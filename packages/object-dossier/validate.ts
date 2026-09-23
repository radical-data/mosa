import { Ajv2020, type ValidateFunction } from "ajv/dist/2020";
import addFormats from "ajv-formats";
import schema from "../../schemas/object-dossier-packet.schema.json";
import {
  claimEvidenceList,
  DERIVED_REFERS_TO_PREFIX,
  type DossierPacket,
  evidenceMode,
  type PacketClaim,
  type PacketEvidence,
  sourceReference,
} from "./packet";

// Source kinds whose evidence may reasonably lack an excerpt.
const VISUAL_SOURCE_KINDS = new Set(["photograph", "image", "audiovisual_record", "video", "film"]);

export interface ValidationOutcome {
  packet?: DossierPacket;
  errors: string[];
}

let compiledSchema: ValidateFunction | undefined;

function getCompiledSchema(): ValidateFunction {
  if (!compiledSchema) {
    const ajv = new Ajv2020({ allErrors: true });
    addFormats(ajv);
    compiledSchema = ajv.compile(schema);
  }

  return compiledSchema;
}

function schemaErrors(validate: ValidateFunction): string[] {
  return (validate.errors ?? []).map((error) => {
    const where = error.instancePath || "(packet root)";
    return `schema: ${where} ${error.message ?? "is invalid"}`;
  });
}

function recordDuplicate(seen: Set<string>, key: string, label: string, errors: string[]): void {
  if (seen.has(key)) {
    errors.push(`duplicate ${label} key: ${key}`);
    return;
  }

  seen.add(key);
}

function checkEvidence(
  claimKey: string,
  evidence: PacketEvidence,
  sourceKindsByKey: Map<string, string>,
  errors: string[],
): void {
  if (!sourceKindsByKey.has(evidence.source)) {
    errors.push(
      `claim ${claimKey}: evidence ${evidence.key} references unknown source ${evidence.source}`,
    );
    return;
  }

  if (evidence.excerpt !== undefined && evidence.excerpt.trim().length === 0) {
    errors.push(`claim ${claimKey}: evidence ${evidence.key} has a blank excerpt`);
    return;
  }

  if (evidence.excerpt === undefined) {
    const sourceKind = sourceKindsByKey.get(evidence.source) ?? "";
    const isVisual = VISUAL_SOURCE_KINDS.has(sourceKind);
    const isWholeDocument = evidenceMode(evidence) === "whole_document";

    if (!isVisual && !isWholeDocument) {
      errors.push(
        `claim ${claimKey}: evidence ${evidence.key} omits an excerpt but its source is not visual and is not marked whole-document`,
      );
    }
  }
}

function checkClaim(
  claim: PacketClaim,
  entityKinds: Map<string, "object" | "agent" | "place" | "source" | "event">,
  sourceKindsByKey: Map<string, string>,
  errors: string[],
): void {
  const subjectKind = entityKinds.get(claim.subject);
  if (!subjectKind) {
    errors.push(`claim ${claim.key}: subject ${claim.subject} does not resolve to a packet entity`);
  }

  if (claim.assertedBy !== undefined && entityKinds.get(claim.assertedBy) !== "agent") {
    errors.push(
      `claim ${claim.key}: assertedBy ${claim.assertedBy} does not resolve to a packet agent`,
    );
  }

  const valueKinds: Partial<Record<PacketClaim["predicate"], string[]>> = {
    refers_to: ["source", "object|agent|place|event"],
    depicts: ["source", "object|agent|place"],
    authored_by: ["source", "agent"],
    published_by: ["source", "agent"],
    made_at: ["object", "place"],
    found_at: ["object", "place"],
    located_at: ["object|agent", "place"],
    held_by: ["object", "agent"],
    possibly_same_as: ["object|agent|place|event", "object|agent|place|event"],
    physical_remains_of: ["object", "agent"],
    moved_item: ["event", "object"],
    moved_from: ["event", "place"],
    moved_to: ["event", "place"],
    moved_via: ["event", "object"],
    carried_out_by: ["event", "agent"],
    commanded_by: ["object", "agent"],
    transferred_item: ["event", "object"],
    transferred_to: ["event", "agent"],
    held_item: ["event", "object"],
    holding_agent: ["event", "agent"],
    transferred_from: ["event", "agent"],
    occurred_at: ["event", "place"],
  };
  switch (claim.predicate) {
    case "has_name":
    case "classified_as":
    case "described_as":
    case "made_of": {
      if (claim.literal?.type !== "text") {
        errors.push(`claim ${claim.key}: ${claim.predicate} requires a text literal value`);
      }
      break;
    }
    case "made_during":
    case "occurred_during": {
      if (claim.literal?.type !== "date_interval")
        errors.push(`claim ${claim.key}: ${claim.predicate} requires a structured date`);
      if (subjectKind && subjectKind !== (claim.predicate === "made_during" ? "object" : "event"))
        errors.push(`claim ${claim.key}: ${claim.predicate} has the wrong subject kind`);
      break;
    }
    case "refers_to":
    case "depicts":
    case "authored_by":
    case "published_by":
    case "made_at":
    case "found_at":
    case "located_at":
    case "held_by":
    case "possibly_same_as":
    case "physical_remains_of":
    case "moved_item":
    case "moved_from":
    case "moved_to":
    case "moved_via":
    case "carried_out_by":
    case "commanded_by":
    case "transferred_item":
    case "transferred_to":
    case "held_item":
    case "holding_agent":
    case "transferred_from":
    case "occurred_at": {
      const [subject, object] = valueKinds[claim.predicate] ?? [];
      if (subjectKind && !subject.split("|").includes(subjectKind))
        errors.push(
          ["made_at", "found_at", "held_by"].includes(claim.predicate)
            ? `claim ${claim.key}: ${claim.predicate} subject must be a packet ${subject}`
            : `claim ${claim.key}: ${claim.predicate} requires a ${subject} subject`,
        );
      if (!claim.object || !object.split("|").includes(entityKinds.get(claim.object) ?? ""))
        errors.push(
          ["made_at", "found_at", "held_by"].includes(claim.predicate)
            ? `claim ${claim.key}: ${claim.predicate} must point to a packet ${object}`
            : `claim ${claim.key}: ${claim.predicate} requires a ${object} value`,
        );
      break;
    }
    default: {
      // The JSON Schema already restricts predicates; this guards against
      // schema drift so unsupported predicates are rejected, never accepted.
      errors.push(`claim ${claim.key}: unsupported predicate ${String(claim.predicate)}`);
    }
  }

  if (claim.object !== undefined && !entityKinds.has(claim.object)) {
    errors.push(`claim ${claim.key}: object ${claim.object} does not resolve to a packet entity`);
  }

  for (const evidence of claimEvidenceList(claim)) {
    checkEvidence(claim.key, evidence, sourceKindsByKey, errors);
  }
}

export function validatePacket(raw: unknown): ValidationOutcome {
  const validate = getCompiledSchema();

  if (!validate(raw)) {
    return { errors: schemaErrors(validate) };
  }

  const packet = raw as DossierPacket;
  const errors: string[] = [];

  // Entity keys share one binding namespace per dataset, so they must be
  // unique across objects, agents, places and sources.
  const entityKinds = new Map<string, "object" | "agent" | "place" | "source" | "event">();
  const seenEntityKeys = new Set<string>();

  for (const [kind, records] of [
    ["object", packet.objects],
    ["agent", packet.agents],
    ["place", packet.places],
    ["source", packet.sources],
    ["event", packet.events ?? []],
  ] as const) {
    for (const record of records) {
      recordDuplicate(seenEntityKeys, record.key, "entity", errors);
      entityKinds.set(record.key, kind);
    }
  }

  const sourceKindsByKey = new Map(packet.sources.map((source) => [source.key, source.kind]));

  for (const caseRecord of packet.restitutionCases ?? []) {
    for (const item of caseRecord.items)
      if (entityKinds.get(item) !== "object")
        errors.push(`case ${caseRecord.key}: unknown item ${item}`);
    for (const party of [
      ...caseRecord.parties,
      ...caseRecord.actions.flatMap((action) => action.parties),
    ])
      if (entityKinds.get(party.agent) !== "agent")
        errors.push(`case ${caseRecord.key}: unknown agent ${party.agent}`);
    for (const document of caseRecord.documents)
      if (entityKinds.get(document.source) !== "source")
        errors.push(`case ${caseRecord.key}: unknown source ${document.source}`);
    const documentKeys = new Set(caseRecord.documents.map((document) => document.key));
    if (documentKeys.size !== caseRecord.documents.length)
      errors.push(`case ${caseRecord.key}: duplicate document key`);
    const actionKeys = new Set(caseRecord.actions.map((action) => action.key));
    if (actionKeys.size !== caseRecord.actions.length)
      errors.push(`case ${caseRecord.key}: duplicate action key`);
    for (const action of caseRecord.actions)
      for (const document of action.documents)
        if (!documentKeys.has(document.document))
          errors.push(`case ${caseRecord.key}: unknown document ${document.document}`);
    if ((caseRecord.status === "closed") !== Boolean(caseRecord.closed))
      errors.push(`case ${caseRecord.key}: closed date must match status`);
  }

  const seenIdentifiers = new Set<string>();
  for (const object of packet.objects) {
    for (const identifier of object.externalIdentifiers ?? []) {
      const pair = `${identifier.namespace}\u0000${identifier.value}`;
      if (seenIdentifiers.has(pair)) {
        errors.push(
          `object ${object.key}: duplicate external identifier ${identifier.namespace}:${identifier.value} in packet`,
        );
      }
      seenIdentifiers.add(pair);

      if (identifier.source !== undefined && entityKinds.get(identifier.source) !== "source") {
        errors.push(
          `object ${object.key}: identifier ${identifier.namespace}:${identifier.value} references unknown source ${identifier.source}`,
        );
      }
    }
  }

  const seenSourceUrls = new Set<string>();
  for (const source of packet.sources) {
    const url = sourceReference(source);
    if (source.publicUrl) {
      try {
        const publicUrl = new URL(source.publicUrl);
        if (
          !["http:", "https:"].includes(publicUrl.protocol) ||
          publicUrl.username ||
          publicUrl.password
        )
          errors.push(`source ${source.key}: public URL must be HTTP(S) without credentials`);
      } catch {
        errors.push(`source ${source.key}: invalid public URL`);
      }
    }
    if (seenSourceUrls.has(url)) {
      errors.push(`source ${source.key}: duplicate source URL in packet: ${url}`);
    }
    seenSourceUrls.add(url);

    for (const aboutKey of source.about ?? []) {
      if (entityKinds.get(aboutKey) !== "object") {
        errors.push(
          `source ${source.key}: about entry ${aboutKey} does not resolve to a packet object`,
        );
      }
    }

    if (source.assertedBy !== undefined && entityKinds.get(source.assertedBy) !== "agent") {
      errors.push(
        `source ${source.key}: assertedBy ${source.assertedBy} does not resolve to a packet agent`,
      );
    }
  }

  const seenClaimKeys = new Set<string>();
  const seenEvidenceKeys = new Set<string>();

  for (const claim of packet.claims) {
    recordDuplicate(seenClaimKeys, claim.key, "claim", errors);

    if (claim.key.startsWith(DERIVED_REFERS_TO_PREFIX)) {
      errors.push(
        `claim ${claim.key}: the ${DERIVED_REFERS_TO_PREFIX} key prefix is reserved for derived source refers_to claims`,
      );
    }

    for (const evidence of claimEvidenceList(claim)) {
      recordDuplicate(seenEvidenceKeys, evidence.key, "evidence", errors);

      if (evidence.key.startsWith(DERIVED_REFERS_TO_PREFIX)) {
        errors.push(
          `evidence ${evidence.key}: the ${DERIVED_REFERS_TO_PREFIX} key prefix is reserved for derived source refers_to evidence`,
        );
      }
    }

    checkClaim(claim, entityKinds, sourceKindsByKey, errors);
  }

  if (errors.length > 0) {
    return { errors };
  }

  return { packet, errors: [] };
}
