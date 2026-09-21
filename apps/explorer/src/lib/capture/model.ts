import { randomUUID } from "node:crypto";
import type { DossierPacket, EvidenceRelationship, PacketClaim } from "@mosa/object-dossier/packet";
import { validatePacket } from "@mosa/object-dossier/validate";

export const fields = [
  "url",
  "label",
  "note",
  "name",
  "nameLocator",
  "nameExcerpt",
  "nameRelationship",
  "holder",
  "holderIdentity",
  "holderLocator",
  "holderExcerpt",
  "holderRelationship",
  "speakerMode",
  "speaker",
  "speakerIdentity",
  "speakerLocator",
  "speakerExcerpt",
  "namespace",
  "identifier",
] as const;
export type Content = Record<(typeof fields)[number], string> & { checkedAt: string };
export class CaptureError extends Error {}
export const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function readContent(form: FormData, previous?: Content): Content {
  const content = Object.fromEntries(
    fields.map((key) => [key, String(form.get(key) ?? "").trim()]),
  ) as Content;
  for (const value of Object.values(content))
    if (value.length > 4000 || [...value].some((character) => character.charCodeAt(0) < 9))
      throw new CaptureError("A field is too long or contains unsupported characters.");
  let url: URL;
  try {
    url = new URL(content.url);
  } catch {
    throw new CaptureError("Enter a complete catalogue URL.");
  }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password)
    throw new CaptureError("Use an HTTP or HTTPS source URL without a password.");
  content.checkedAt = previous?.url === content.url ? previous.checkedAt : new Date().toISOString();
  const checkedAt = String(form.get("checkedAt") ?? "").trim();
  if (checkedAt) {
    const parsed = new Date(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(checkedAt) ? `${checkedAt}:00Z` : checkedAt,
    );
    if (!Number.isFinite(parsed.getTime()) || parsed.getTime() > Date.now() + 60000)
      throw new CaptureError("Enter a valid source check time.");
    content.checkedAt = parsed.toISOString();
  }
  content.nameRelationship ||= "supports";
  content.holderRelationship ||= "supports";
  content.holderIdentity ||= "new";
  content.speakerIdentity ||= "new";
  content.speakerMode ||= "unknown";
  if (!["holder", "other", "unknown"].includes(content.speakerMode))
    throw new CaptureError("Choose who makes these statements.");
  for (const key of ["holderIdentity", "speakerIdentity"] as const)
    if (content[key] !== "new" && !uuid.test(content[key]))
      throw new CaptureError("Choose an institution from the list.");
  for (const key of ["nameRelationship", "holderRelationship"] as const)
    if (
      !["supports", "qualifies", "contradicts", "mentions", "provides_context"].includes(
        content[key],
      )
    )
      throw new CaptureError("Choose how the source relates to each statement.");
  return content;
}
export function packetFor(id: string, revision: number, c: Content): DossierPacket {
  const required: (keyof Content)[] = [
    "name",
    "holder",
    "namespace",
    "identifier",
    "nameLocator",
    "nameExcerpt",
    "holderLocator",
    "holderExcerpt",
  ];
  if (c.speakerMode === "other") required.push("speaker", "speakerLocator", "speakerExcerpt");
  if (required.some((key) => !c[key]))
    throw new CaptureError(
      "Complete the name, holder, identifier and evidence fields before review.",
    );
  const speaker =
    c.speakerMode === "holder"
      ? "agent:holder"
      : c.speakerMode === "other"
        ? "agent:speaker"
        : undefined;
  function claim(
    key: string,
    subject: string,
    predicate: "has_name" | "held_by",
    value: string,
    locator: string,
    excerpt: string,
    relationship: EvidenceRelationship,
  ): PacketClaim {
    return {
      key: `claim:${key}`,
      subject,
      predicate,
      ...(predicate === "has_name"
        ? { literal: { type: "text" as const, value } }
        : { object: value }),
      assertedBy: speaker,
      evidence: {
        key: `evidence:${key}`,
        source: "source:catalogue",
        relationship,
        locator,
        excerpt,
      },
    };
  }
  const claims = [
    claim(
      "name",
      "item:object",
      "has_name",
      c.name,
      c.nameLocator,
      c.nameExcerpt,
      c.nameRelationship as EvidenceRelationship,
    ),
    claim(
      "holder",
      "item:object",
      "held_by",
      "agent:holder",
      c.holderLocator,
      c.holderExcerpt,
      c.holderRelationship as EvidenceRelationship,
    ),
    claim(
      "holder-name",
      "agent:holder",
      "has_name",
      c.holder,
      c.holderLocator,
      c.holderExcerpt,
      "supports",
    ),
  ];
  if (speaker === "agent:speaker")
    claims.push(
      claim(
        "speaker-name",
        speaker,
        "has_name",
        c.speaker,
        c.speakerLocator,
        c.speakerExcerpt,
        "supports",
      ),
    );
  const packet: DossierPacket = {
    schemaVersion: 1,
    dataset: { key: `capture-${id}`, version: String(revision) },
    objects: [
      {
        key: "item:object",
        kind: "artefact",
        externalIdentifiers: [
          { namespace: c.namespace, value: c.identifier, source: "source:catalogue" },
        ],
      },
    ],
    agents: [
      { key: "agent:holder", kind: "organisation" },
      ...(speaker === "agent:speaker" ? [{ key: "agent:speaker" }] : []),
    ],
    places: [],
    sources: [
      {
        key: "source:catalogue",
        kind: "institutional_record",
        url: c.url,
        retrievedAt: c.checkedAt,
        about: ["item:object"],
        assertedBy: speaker,
      },
    ],
    claims,
  };
  const result = validatePacket(packet);
  if (!result.packet)
    throw new CaptureError("The proposed evidence is incomplete. Check the fields before review.");
  return result.packet;
}
export const newRequestId = randomUUID;
