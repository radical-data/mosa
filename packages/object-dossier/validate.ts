import { Ajv2020, type ValidateFunction } from "ajv/dist/2020";
import addFormats from "ajv-formats";
import schema from "../../schemas/object-dossier-packet.schema.json";
import {
  claimEvidenceList,
  DERIVED_REFERS_TO_PREFIX,
  type DossierPacket,
  type PacketClaim,
  type PacketEvidence,
} from "./packet";

// Source kinds whose evidence may reasonably lack an excerpt.
const VISUAL_SOURCE_KINDS = new Set(["photograph", "image", "audiovisual_record", "video", "film"]);

// Locators such as "Whole catalogue record" or "Whole image" describe
// whole-document evidence, which may also lack an excerpt.
const WHOLE_DOCUMENT_LOCATOR = /^whole\b/iu;

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
    const isWholeDocument = WHOLE_DOCUMENT_LOCATOR.test(evidence.locator.trim());

    if (!isVisual && !isWholeDocument) {
      errors.push(
        `claim ${claimKey}: evidence ${evidence.key} omits an excerpt but its source is not visual and its locator does not describe whole-document evidence`,
      );
    }
  }
}

function checkClaim(
  claim: PacketClaim,
  entityKinds: Map<string, "object" | "agent" | "place" | "source">,
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

  switch (claim.predicate) {
    case "has_name":
    case "classified_as":
    case "described_as": {
      if (!claim.literal) {
        errors.push(`claim ${claim.key}: ${claim.predicate} requires a text literal value`);
      }
      break;
    }
    case "made_at":
    case "found_at":
    case "located_at": {
      if (subjectKind && subjectKind !== "object") {
        errors.push(`claim ${claim.key}: ${claim.predicate} subject must be a packet object`);
      }
      if (!claim.object || entityKinds.get(claim.object) !== "place") {
        errors.push(`claim ${claim.key}: ${claim.predicate} must point to a packet place`);
      }
      break;
    }
    case "held_by": {
      if (subjectKind && subjectKind !== "object") {
        errors.push(`claim ${claim.key}: held_by subject must be a packet object`);
      }
      if (!claim.object || entityKinds.get(claim.object) !== "agent") {
        errors.push(`claim ${claim.key}: held_by must point to a packet agent`);
      }
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
  const entityKinds = new Map<string, "object" | "agent" | "place" | "source">();
  const seenEntityKeys = new Set<string>();

  for (const [kind, records] of [
    ["object", packet.objects],
    ["agent", packet.agents],
    ["place", packet.places],
    ["source", packet.sources],
  ] as const) {
    for (const record of records) {
      recordDuplicate(seenEntityKeys, record.key, "entity", errors);
      entityKinds.set(record.key, kind);
    }
  }

  const sourceKindsByKey = new Map(packet.sources.map((source) => [source.key, source.kind]));

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
    const url = source.url.trim();
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
