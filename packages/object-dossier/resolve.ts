import type { ClientBase } from "pg";
import { claimEvidenceList, type DossierPacket, sourceReference } from "./packet";

export type PacketEntityKind = "object" | "agent" | "place" | "source" | "event";

export type ResolutionAction = "bound" | "matched" | "create";

export interface EntityResolution {
  key: string;
  kind: PacketEntityKind;
  action: ResolutionAction;
  // Present for bound and matched entities; assigned by PostgreSQL at
  // creation time for the rest.
  entityId?: string;
  detail?: string;
}

export interface ResolutionPlan {
  entities: Map<string, EntityResolution>;
  errors: string[];
  warnings: string[];
}

interface BindingRow {
  local_key: string;
  entity_id: string;
}

async function loadEntityBindings(
  client: ClientBase,
  datasetId: string | null,
): Promise<Map<string, string>> {
  if (!datasetId) {
    return new Map();
  }

  const result = await client.query<BindingRow>(
    "select local_key, entity_id from ingestion.entity_binding where dataset_id = $1",
    [datasetId],
  );

  return new Map(result.rows.map((row) => [row.local_key, row.entity_id]));
}

async function resolveObjectByIdentifiers(
  client: ClientBase,
  packet: DossierPacket,
  objectKey: string,
  errors: string[],
): Promise<EntityResolution | null> {
  const object = packet.objects.find((candidate) => candidate.key === objectKey);
  const identifiers = object?.externalIdentifiers ?? [];
  const matches = new Map<string, string>();

  for (const identifier of identifiers) {
    const result = await client.query<{ entity_id: string; entity_type: string }>(
      `select identifier.entity_id, entity.entity_type
         from entities.external_identifier as identifier
         join entities.entity as entity on entity.id = identifier.entity_id
        where identifier.namespace = $1
          and identifier.value = $2`,
      [identifier.namespace, identifier.value],
    );

    const row = result.rows[0];
    if (!row) {
      continue;
    }

    if (row.entity_type !== "item") {
      errors.push(
        `object ${objectKey}: external identifier ${identifier.namespace}:${identifier.value} already belongs to a ${row.entity_type} entity (${row.entity_id}); refusing to create a duplicate`,
      );
      continue;
    }

    matches.set(row.entity_id, `${identifier.namespace}:${identifier.value}`);
  }

  if (matches.size > 1) {
    const described = [...matches.entries()]
      .map(([entityId, identifier]) => `${identifier} -> ${entityId}`)
      .join(", ");
    errors.push(
      `object ${objectKey}: external identifiers match different existing items (${described})`,
    );
    return null;
  }

  const match = [...matches.entries()][0];
  if (!match) {
    return null;
  }

  return {
    key: objectKey,
    kind: "object",
    action: "matched",
    entityId: match[0],
    detail: `matched by external identifier ${match[1]}`,
  };
}

async function resolveSourceByUrl(
  client: ClientBase,
  packet: DossierPacket,
  sourceKey: string,
  errors: string[],
): Promise<EntityResolution | null> {
  const source = packet.sources.find((candidate) => candidate.key === sourceKey);
  if (!source) {
    return null;
  }

  // Exact reference match only. Aggressive URL normalisation (dropping
  // query parameters, following redirects) can merge different records.
  const url = sourceReference(source);
  const result = await client.query<{ id: string; source_kind: string }>(
    "select id, source_kind from entities.source where btrim(reference) = $1",
    [url],
  );

  if (result.rows.length === 0) {
    return null;
  }

  if (result.rows.length > 1) {
    const ids = result.rows.map((row) => row.id).join(", ");
    errors.push(`source ${sourceKey}: URL ${url} matches multiple existing sources (${ids})`);
    return null;
  }

  const row = result.rows[0];
  if (row.source_kind.trim() !== source.kind.trim()) {
    errors.push(
      `source ${sourceKey}: URL ${url} matches existing source ${row.id} with incompatible source_kind ${row.source_kind}; refusing to merge or duplicate`,
    );
    return null;
  }

  return {
    key: sourceKey,
    kind: "source",
    action: "matched",
    entityId: row.id,
    detail: `matched by reference URL`,
  };
}

// Names never establish identity. This only reports possible matches so a
// human can review them; the importer still creates a separate entity.
async function collectNameMatchWarnings(
  client: ClientBase,
  packet: DossierPacket,
  plan: Map<string, EntityResolution>,
  warnings: string[],
): Promise<void> {
  const entityTypeByKind: Record<PacketEntityKind, string> = {
    object: "item",
    agent: "agent",
    place: "place",
    source: "source",
    event: "event",
  };

  for (const claim of packet.claims) {
    if (claim.predicate !== "has_name" || claim.literal?.type !== "text") {
      continue;
    }

    const resolution = plan.get(claim.subject);
    if (resolution?.action !== "create") {
      continue;
    }

    const result = await client.query<{ id: string }>(
      `select entity.id
         from knowledge.claim as claim
         join entities.entity as entity on entity.id = claim.subject_id
        where claim.predicate = 'has_name'
          and claim.status = 'active'
          and claim.literal_value ->> 'value' = $1
          and entity.entity_type = $2
        limit 5`,
      [claim.literal.value, entityTypeByKind[resolution.kind]],
    );

    for (const row of result.rows) {
      warnings.push(
        `possible name match for ${claim.subject}: existing ${entityTypeByKind[resolution.kind]} ${row.id} has active name "${claim.literal.value}"; review manually, the importer will create a new entity`,
      );
    }
  }
}

export async function resolveEntities(
  client: ClientBase,
  datasetId: string | null,
  packet: DossierPacket,
): Promise<ResolutionPlan> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const bindings = await loadEntityBindings(client, datasetId);
  const entities = new Map<string, EntityResolution>();

  const records: Array<{ key: string; kind: PacketEntityKind }> = [
    ...packet.objects.map((record) => ({ key: record.key, kind: "object" as const })),
    ...packet.agents.map((record) => ({ key: record.key, kind: "agent" as const })),
    ...packet.places.map((record) => ({ key: record.key, kind: "place" as const })),
    ...packet.sources.map((record) => ({ key: record.key, kind: "source" as const })),
    ...(packet.events ?? []).map((record) => ({ key: record.key, kind: "event" as const })),
  ];

  for (const record of records) {
    const boundEntityId = bindings.get(record.key);
    if (boundEntityId) {
      entities.set(record.key, {
        key: record.key,
        kind: record.kind,
        action: "bound",
        entityId: boundEntityId,
        detail: "existing dataset binding",
      });
      continue;
    }

    let resolution: EntityResolution | null = null;

    if (record.kind === "object") {
      resolution = await resolveObjectByIdentifiers(client, packet, record.key, errors);
    } else if (record.kind === "source") {
      resolution = await resolveSourceByUrl(client, packet, record.key, errors);
    }

    entities.set(
      record.key,
      resolution ?? { key: record.key, kind: record.kind, action: "create" },
    );
  }

  await collectNameMatchWarnings(client, packet, entities, warnings);

  return { entities, errors, warnings };
}

export interface ClaimResolution {
  localKey: string;
  action: "bound" | "create";
  claimId?: string;
}

export interface EvidenceResolution {
  localKey: string;
  action: "bound" | "create";
  claimEvidenceId?: string;
}

export async function loadClaimBindings(
  client: ClientBase,
  datasetId: string | null,
): Promise<Map<string, string>> {
  if (!datasetId) {
    return new Map();
  }

  const result = await client.query<{ local_key: string; claim_id: string }>(
    "select local_key, claim_id from ingestion.claim_binding where dataset_id = $1",
    [datasetId],
  );

  return new Map(result.rows.map((row) => [row.local_key, row.claim_id]));
}

export async function loadEvidenceBindings(
  client: ClientBase,
  datasetId: string | null,
): Promise<Map<string, string>> {
  if (!datasetId) {
    return new Map();
  }

  const result = await client.query<{ local_key: string; claim_evidence_id: string }>(
    "select local_key, claim_evidence_id from ingestion.evidence_binding where dataset_id = $1",
    [datasetId],
  );

  return new Map(result.rows.map((row) => [row.local_key, row.claim_evidence_id]));
}

export function summariseEvidenceKeys(packet: DossierPacket): string[] {
  return packet.claims.flatMap((claim) => claimEvidenceList(claim).map((evidence) => evidence.key));
}
