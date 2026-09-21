import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export const PACKET_SCHEMA_VERSION = 1;

export const SUPPORTED_PREDICATES = [
  "has_name",
  "made_at",
  "found_at",
  "located_at",
  "held_by",
] as const;

export type SupportedPredicate = (typeof SUPPORTED_PREDICATES)[number];

export const EVIDENCE_RELATIONSHIPS = [
  "supports",
  "contradicts",
  "qualifies",
  "mentions",
  "provides_context",
] as const;

export type EvidenceRelationship = (typeof EVIDENCE_RELATIONSHIPS)[number];

export interface PacketDataset {
  key: string;
  version: string;
  title?: string;
}

export interface PacketExternalIdentifier {
  namespace: string;
  value: string;
  source?: string;
}

export interface PacketObject {
  key: string;
  kind?: string;
  externalIdentifiers?: PacketExternalIdentifier[];
}

export interface PacketAgent {
  key: string;
  kind?: string;
}

export interface PacketPlace {
  key: string;
  kind?: string;
}

export interface PacketSource {
  key: string;
  kind: string;
  url: string;
  retrievedAt: string;
  about?: string[];
  assertedBy?: string;
}

export interface PacketTextLiteral {
  type: "text";
  value: string;
  language?: string;
}

export interface PacketEvidence {
  key: string;
  source: string;
  relationship: EvidenceRelationship;
  locator: string;
  excerpt?: string;
}

export interface PacketClaim {
  key: string;
  subject: string;
  predicate: SupportedPredicate;
  object?: string;
  literal?: PacketTextLiteral;
  assertedBy?: string;
  evidence: PacketEvidence | PacketEvidence[];
}

export interface DossierPacket {
  schemaVersion: typeof PACKET_SCHEMA_VERSION;
  dataset: PacketDataset;
  objects: PacketObject[];
  agents: PacketAgent[];
  places: PacketPlace[];
  sources: PacketSource[];
  claims: PacketClaim[];
}

export async function readPacketFile(packetPath: string): Promise<unknown> {
  const raw = await readFile(packetPath, "utf8");

  try {
    return JSON.parse(raw) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Packet file is not valid JSON: ${message}`);
  }
}

export function claimEvidenceList(claim: PacketClaim): PacketEvidence[] {
  return Array.isArray(claim.evidence) ? claim.evidence : [claim.evidence];
}

// Derived claim keys for source refers_to relationships share the claim
// binding namespace, so the validator reserves this prefix.
export const DERIVED_REFERS_TO_PREFIX = "derived:refers_to:";

export function derivedRefersToClaimKey(sourceKey: string, objectKey: string): string {
  return `${DERIVED_REFERS_TO_PREFIX}${sourceKey}:${objectKey}`;
}

export function derivedRefersToEvidenceKey(sourceKey: string, objectKey: string): string {
  return `${DERIVED_REFERS_TO_PREFIX}${sourceKey}:${objectKey}:evidence`;
}

// Canonical JSON: object keys sorted recursively, arrays kept in order,
// no insignificant whitespace. Key order in the packet file therefore
// never changes the checksum, but content and array order do.
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entryValue]) => entryValue !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  const body = entries
    .map(([key, entryValue]) => `${JSON.stringify(key)}:${canonicalJson(entryValue)}`)
    .join(",");

  return `{${body}}`;
}

export function packetSha256(packet: unknown): string {
  return createHash("sha256").update(canonicalJson(packet), "utf8").digest("hex");
}
