import { Client, type ClientBase } from "pg";
import {
  claimEvidenceList,
  type DossierPacket,
  derivedRefersToClaimKey,
  derivedRefersToEvidenceKey,
  type PacketTextLiteral,
  packetSha256,
} from "./packet";
import {
  loadClaimBindings,
  loadEvidenceBindings,
  type ResolutionPlan,
  resolveEntities,
} from "./resolve";

export const IMPORTER_VERSION = "1.1.0";

export class ImportError extends Error {
  readonly details: string[];

  constructor(message: string, details: string[] = []) {
    const suffix = details.length > 0 ? `\n${details.map((line) => `  - ${line}`).join("\n")}` : "";
    super(`${message}${suffix}`);
    this.name = "ImportError";
    this.details = details;
  }
}

export interface ClaimWork {
  localKey: string;
  subjectKey: string;
  predicate: string;
  objectKey?: string;
  literal?: PacketTextLiteral;
  assertedByKey?: string;
  derived: boolean;
}

export interface EvidenceWork {
  localKey: string;
  claimLocalKey: string;
  sourceKey: string;
  relationship: string;
  locator: string;
  excerpt?: string;
}

export interface PacketWork {
  claims: ClaimWork[];
  evidence: EvidenceWork[];
}

// Derived source refers_to claims are evidenced by the source itself: the
// whole document is what establishes that the source concerns the object.
export function buildPacketWork(packet: DossierPacket): PacketWork {
  const claims: ClaimWork[] = [];
  const evidence: EvidenceWork[] = [];

  for (const source of packet.sources) {
    for (const objectKey of source.about ?? []) {
      const claimKey = derivedRefersToClaimKey(source.key, objectKey);
      claims.push({
        localKey: claimKey,
        subjectKey: source.key,
        predicate: "refers_to",
        objectKey,
        assertedByKey: source.assertedBy,
        derived: true,
      });
      evidence.push({
        localKey: derivedRefersToEvidenceKey(source.key, objectKey),
        claimLocalKey: claimKey,
        sourceKey: source.key,
        relationship: "supports",
        locator: "Whole document",
      });
    }
  }

  for (const claim of packet.claims) {
    claims.push({
      localKey: claim.key,
      subjectKey: claim.subject,
      predicate: claim.predicate,
      objectKey: claim.object,
      literal: claim.literal,
      assertedByKey: claim.assertedBy,
      derived: false,
    });

    for (const entry of claimEvidenceList(claim)) {
      evidence.push({
        localKey: entry.key,
        claimLocalKey: claim.key,
        sourceKey: entry.source,
        relationship: entry.relationship,
        locator: entry.locator,
        excerpt: entry.excerpt,
      });
    }
  }

  return { claims, evidence };
}

export interface WorkStatus {
  localKey: string;
  action: "bound" | "create";
}

export interface ImportPlan {
  sha256: string;
  datasetKey: string;
  packetVersion: string;
  datasetId: string | null;
  alreadyImported: boolean;
  resolution: ResolutionPlan;
  claims: WorkStatus[];
  evidence: WorkStatus[];
}

async function findDatasetId(client: ClientBase, datasetKey: string): Promise<string | null> {
  const result = await client.query<{ id: string }>(
    "select id from ingestion.dataset where key = $1",
    [datasetKey],
  );

  return result.rows[0]?.id ?? null;
}

async function hasSucceededRun(
  client: ClientBase,
  datasetId: string,
  sha256: string,
): Promise<boolean> {
  const result = await client.query(
    `select 1
       from ingestion.run
      where dataset_id = $1
        and packet_sha256 = $2
        and status = 'succeeded'`,
    [datasetId, sha256],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function planImport(client: ClientBase, packet: DossierPacket): Promise<ImportPlan> {
  const sha256 = packetSha256(packet);
  const datasetId = await findDatasetId(client, packet.dataset.key);
  const alreadyImported = datasetId !== null && (await hasSucceededRun(client, datasetId, sha256));

  const resolution = await resolveEntities(client, datasetId, packet);
  const claimBindings = await loadClaimBindings(client, datasetId);
  const evidenceBindings = await loadEvidenceBindings(client, datasetId);
  const work = buildPacketWork(packet);

  return {
    sha256,
    datasetKey: packet.dataset.key,
    packetVersion: packet.dataset.version,
    datasetId,
    alreadyImported,
    resolution,
    claims: work.claims.map((claim) => ({
      localKey: claim.localKey,
      action: claimBindings.has(claim.localKey) ? "bound" : "create",
    })),
    evidence: work.evidence.map((entry) => ({
      localKey: entry.localKey,
      action: evidenceBindings.has(entry.localKey) ? "bound" : "create",
    })),
  };
}

interface CreatedCounts {
  entities: number;
  identifiers: number;
  claims: number;
  evidence: number;
}

export interface ImportOutcome {
  mode: "dry-run" | "apply";
  plan: ImportPlan;
  applied: boolean;
  noop: boolean;
  runId?: string;
  created: CreatedCounts;
}

const CREATE_FUNCTION_BY_KIND = {
  agent: "entities.create_agent($1)",
  place: "entities.create_place($1)",
  object: "entities.create_item($1)",
} as const;

async function withKeyContext<T>(localKey: string, operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ImportError(`failed while importing ${localKey}: ${message}`);
  }
}

async function applyCanonicalWrites(
  client: ClientBase,
  packet: DossierPacket,
  datasetId: string,
): Promise<CreatedCounts> {
  const created: CreatedCounts = { entities: 0, identifiers: 0, claims: 0, evidence: 0 };

  // Resolve inside the locked transaction so bindings and identifier
  // matches cannot change under us.
  const resolution = await resolveEntities(client, datasetId, packet);
  if (resolution.errors.length > 0) {
    throw new ImportError("identity resolution failed", resolution.errors);
  }

  const entityIds = new Map<string, string>();

  const kindLookup = new Map<string, string | undefined>();
  for (const record of [...packet.objects, ...packet.agents, ...packet.places]) {
    kindLookup.set(record.key, record.kind);
  }

  // Supporting agents and places first, then objects, then sources, so
  // later rows (identifiers, claims, evidence) can reference them.
  const creationOrder = [
    ...packet.agents.map((record) => record.key),
    ...packet.places.map((record) => record.key),
    ...packet.objects.map((record) => record.key),
    ...packet.sources.map((record) => record.key),
  ];

  for (const localKey of creationOrder) {
    const entry = resolution.entities.get(localKey);
    if (!entry) {
      throw new ImportError(`failed while importing ${localKey}: missing resolution entry`);
    }

    if (entry.action === "bound") {
      entityIds.set(localKey, entry.entityId as string);
      continue;
    }

    let entityId = entry.entityId;

    if (entry.action === "create") {
      entityId = await withKeyContext(localKey, async () => {
        if (entry.kind === "source") {
          const source = packet.sources.find((candidate) => candidate.key === localKey);
          if (!source) {
            throw new Error("packet source record disappeared");
          }
          const result = await client.query<{ id: string }>(
            "select entities.create_source($1, $2, $3) as id",
            [source.kind, source.url.trim(), source.retrievedAt],
          );
          return result.rows[0].id;
        }

        const result = await client.query<{ id: string }>(
          `select ${CREATE_FUNCTION_BY_KIND[entry.kind]} as id`,
          [kindLookup.get(localKey) ?? null],
        );
        return result.rows[0].id;
      });
      created.entities += 1;
    }

    entityIds.set(localKey, entityId as string);

    // Bind matched entities too, so later runs resolve binding-first.
    await withKeyContext(localKey, async () => {
      await client.query(
        `insert into ingestion.entity_binding (dataset_id, local_key, entity_id)
         values ($1, $2, $3)`,
        [datasetId, localKey, entityId],
      );
    });
  }

  for (const object of packet.objects) {
    const objectId = entityIds.get(object.key) as string;

    for (const identifier of object.externalIdentifiers ?? []) {
      await withKeyContext(object.key, async () => {
        const existing = await client.query<{ entity_id: string }>(
          "select entity_id from entities.external_identifier where namespace = $1 and value = $2",
          [identifier.namespace, identifier.value],
        );

        const existingEntityId = existing.rows[0]?.entity_id;
        if (existingEntityId) {
          if (existingEntityId !== objectId) {
            throw new Error(
              `external identifier ${identifier.namespace}:${identifier.value} already belongs to entity ${existingEntityId}`,
            );
          }
          return;
        }

        await client.query(
          `insert into entities.external_identifier (entity_id, namespace, value, source_id)
           values ($1, $2, $3, $4)`,
          [
            objectId,
            identifier.namespace,
            identifier.value,
            identifier.source ? entityIds.get(identifier.source) : null,
          ],
        );
        created.identifiers += 1;
      });
    }
  }

  const work = buildPacketWork(packet);
  const claimBindings = await loadClaimBindings(client, datasetId);
  const claimIds = new Map<string, string>(claimBindings);

  for (const claim of work.claims) {
    if (claimIds.has(claim.localKey)) {
      continue;
    }

    await withKeyContext(claim.localKey, async () => {
      const result = await client.query<{ id: string }>(
        `insert into knowledge.claim (
             subject_id,
             predicate,
             object_entity_id,
             literal_value,
             asserted_by_agent_id
         )
         values ($1, $2, $3, $4::jsonb, $5)
         returning id`,
        [
          entityIds.get(claim.subjectKey),
          claim.predicate,
          claim.objectKey ? entityIds.get(claim.objectKey) : null,
          claim.literal ? JSON.stringify(claim.literal) : null,
          claim.assertedByKey ? entityIds.get(claim.assertedByKey) : null,
        ],
      );

      const claimId = result.rows[0].id;
      claimIds.set(claim.localKey, claimId);
      created.claims += 1;

      await client.query(
        `insert into ingestion.claim_binding (dataset_id, local_key, claim_id)
         values ($1, $2, $3)`,
        [datasetId, claim.localKey, claimId],
      );
    });
  }

  const evidenceBindings = await loadEvidenceBindings(client, datasetId);

  for (const entry of work.evidence) {
    if (evidenceBindings.has(entry.localKey)) {
      continue;
    }

    await withKeyContext(entry.localKey, async () => {
      const result = await client.query<{ id: string }>(
        `insert into knowledge.claim_evidence (claim_id, source_id, relationship, locator, excerpt)
         values ($1, $2, $3, $4, $5)
         returning id`,
        [
          claimIds.get(entry.claimLocalKey),
          entityIds.get(entry.sourceKey),
          entry.relationship,
          entry.locator,
          entry.excerpt ?? null,
        ],
      );

      created.evidence += 1;

      await client.query(
        `insert into ingestion.evidence_binding (dataset_id, local_key, claim_evidence_id)
         values ($1, $2, $3)`,
        [datasetId, entry.localKey, result.rows[0].id],
      );
    });
  }

  await runPostImportAssertions(client, packet, datasetId);

  return created;
}

async function runPostImportAssertions(
  client: ClientBase,
  packet: DossierPacket,
  datasetId: string,
): Promise<void> {
  const missingEvidence = await client.query<{ local_key: string }>(
    `select binding.local_key
       from ingestion.claim_binding as binding
       join knowledge.claim as claim on claim.id = binding.claim_id
      where binding.dataset_id = $1
        and not exists (
            select 1
              from knowledge.claim_evidence as evidence
             where evidence.claim_id = claim.id
        )`,
    [datasetId],
  );

  if (missingEvidence.rows.length > 0) {
    throw new ImportError(
      "post-import assertion failed: claims without evidence",
      missingEvidence.rows.map((row) => row.local_key),
    );
  }

  const entityKeys = [
    ...packet.objects.map((record) => record.key),
    ...packet.agents.map((record) => record.key),
    ...packet.places.map((record) => record.key),
    ...packet.sources.map((record) => record.key),
  ];

  const boundEntities = await client.query<{ count: string }>(
    `select count(*) as count
       from ingestion.entity_binding
      where dataset_id = $1
        and local_key = any($2::text[])`,
    [datasetId, entityKeys],
  );

  if (Number(boundEntities.rows[0].count) !== entityKeys.length) {
    throw new ImportError(
      "post-import assertion failed: not every packet entity received a binding",
    );
  }
}

// Call only inside a transaction owned by the caller. Draft promotion and all
// canonical writes then commit together. All importer entry points share this lock.
export async function lockImport(client: ClientBase) {
  await client.query("select pg_advisory_xact_lock(1297040193, 2)");
}
export async function importInTransaction(
  client: ClientBase,
  packet: DossierPacket,
  bindings: Record<string, string> = {},
): Promise<ImportOutcome> {
  await lockImport(client);
  const plan = await planImport(client, packet);
  if (plan.resolution.errors.length)
    throw new ImportError("identity resolution failed", plan.resolution.errors);
  if (plan.alreadyImported)
    return {
      mode: "apply",
      plan,
      applied: false,
      noop: true,
      created: { entities: 0, identifiers: 0, claims: 0, evidence: 0 },
    };
  const datasetId = (
    await client.query(
      `insert into ingestion.dataset(key,title) values($1,$2)
     on conflict(key) do update set title=coalesce(excluded.title,ingestion.dataset.title) returning id`,
      [packet.dataset.key, packet.dataset.title ?? null],
    )
  ).rows[0].id;
  // Human-confirmed identities, never label matches. The caller must validate
  // both the kind and the authority to bind these existing entities.
  for (const [key, id] of Object.entries(bindings)) {
    await client.query(
      `insert into ingestion.entity_binding(dataset_id,local_key,entity_id)
      values($1,$2,$3) on conflict(dataset_id,local_key) do nothing`,
      [datasetId, key, id],
    );
    const bound = await client.query(
      `select entity_id from ingestion.entity_binding where dataset_id=$1 and local_key=$2`,
      [datasetId, key],
    );
    if (bound.rows[0].entity_id !== id)
      throw new ImportError("Existing identity binding differs from the confirmed identity");
  }
  const runId = (
    await client.query(
      `insert into ingestion.run(dataset_id,packet_version,packet_sha256,importer_version)
    values($1,$2,$3,$4) returning id`,
      [datasetId, packet.dataset.version, plan.sha256, IMPORTER_VERSION],
    )
  ).rows[0].id;
  const created = await applyCanonicalWrites(client, packet, datasetId);
  await client.query("update ingestion.run set status='succeeded',finished_at=now() where id=$1", [
    runId,
  ]);
  return { mode: "apply", plan, applied: true, noop: false, runId, created };
}
export interface RunImportOptions {
  databaseUrl: string;
  apply: boolean;
  applicationName?: string;
}
export async function runImport(
  packet: DossierPacket,
  options: RunImportOptions,
): Promise<ImportOutcome> {
  const client = new Client({
    application_name: options.applicationName ?? "mosa-object-dossier-importer",
    connectionString: options.databaseUrl,
  });
  await client.connect();
  try {
    if (!options.apply) {
      const plan = await planImport(client, packet);
      if (plan.resolution.errors.length)
        throw new ImportError("identity resolution failed", plan.resolution.errors);
      return {
        mode: "dry-run",
        plan,
        applied: false,
        noop: plan.alreadyImported,
        created: { entities: 0, identifiers: 0, claims: 0, evidence: 0 },
      };
    }
    await client.query("begin");
    try {
      const outcome = await importInTransaction(client, packet);
      await client.query("commit");
      return outcome;
    } catch (error) {
      await client.query("rollback");
      // Preserve failed CLI attempts without leaving partial canonical writes.
      const datasetId = (
        await client.query(
          `insert into ingestion.dataset(key,title) values($1,$2)
        on conflict(key) do update set title=ingestion.dataset.title returning id`,
          [packet.dataset.key, packet.dataset.title ?? null],
        )
      ).rows[0].id;
      await client.query(
        `insert into ingestion.run(dataset_id,packet_version,packet_sha256,importer_version,status,finished_at,error)
        values($1,$2,$3,$4,'failed',now(),$5)`,
        [
          datasetId,
          packet.dataset.version,
          packetSha256(packet),
          IMPORTER_VERSION,
          (error instanceof Error ? error.message : String(error)).slice(0, 4000),
        ],
      );
      throw error;
    }
  } finally {
    await client.end();
  }
}
