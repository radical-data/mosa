import { randomUUID } from "node:crypto";
import type { DossierPacket, EvidenceRelationship, PacketClaim } from "@mosa/object-dossier/packet";
import { validatePacket } from "@mosa/object-dossier/validate";

export const fields = [
  "sourceVersion",
  "sourceRegions",
  "researchConsent",
  "url",
  "label",
  "note",
  "name",
  "nameBasis",
  "nameLocator",
  "nameExcerpt",
  "nameRelationship",
  "nameEvidenceMode",
  "holder",
  "holderStatus",
  "holderIdentity",
  "holderNameCitation",
  "holderLocator",
  "holderExcerpt",
  "holderRelationship",
  "holderEvidenceMode",
  "holderNameLocator",
  "holderNameExcerpt",
  "speakerMode",
  "speaker",
  "speakerIdentity",
  "speakerNameCitation",
  "speakerLocator",
  "speakerExcerpt",
  "namespace",
  "identifier",
  "interpretation",
] as const;
export type Content = Record<(typeof fields)[number], string> & {
  sourceCitation?: string;
  checkedAt: string;
  // Resolved by the server at review, never accepted from a submitted form.
  holderNameEvidenceId?: string;
  speakerNameEvidenceId?: string;
};
export class CaptureError extends Error {
  constructor(
    message: string,
    readonly field?: string,
  ) {
    super(message);
  }
}
export const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const nameBases = [
  ["has_name", "A name or title"],
  ["classified_as", "An object type or classification"],
  ["described_as", "A description"],
] as const;
// Older drafts retain their meaning; no reinterpretation of accepted records.
export function normaliseContent(value: Content): Content {
  const c = { ...Object.fromEntries(fields.map((key) => [key, ""])), ...value } as Content;
  c.nameBasis ||= "has_name";
  c.nameEvidenceMode ||= "excerpt";
  c.holderEvidenceMode ||= "excerpt";
  c.holderStatus ||= "reported";
  c.nameRelationship ||= "supports";
  c.holderRelationship ||= "supports";
  c.holderIdentity ||= "new";
  c.speakerIdentity ||= "new";
  c.speakerMode ||= "unknown";
  return c;
}
export function readContent(form: FormData, previous?: Content): Content {
  const c = normaliseContent(
    Object.fromEntries(fields.map((key) => [key, String(form.get(key) ?? "").trim()])) as Content,
  );
  for (const key of fields) {
    if (c[key].length > 4000 || [...c[key]].some((ch) => ch.charCodeAt(0) < 9))
      throw new CaptureError("Shorten this field or remove unsupported characters.", key);
  }
  if (c.sourceVersion) {
    if (!uuid.test(c.sourceVersion)) throw new CaptureError("Choose a saved source version.");
    c.url = previous?.url ?? c.url;
    c.checkedAt = previous?.checkedAt ?? new Date().toISOString();
    c.sourceCitation = previous?.sourceCitation;
  }
  let url: URL;
  try {
    url = new URL(c.url || (c.sourceVersion ? "urn:mosa:pending" : ""));
  } catch {
    throw new CaptureError("Enter a complete catalogue URL.", "url");
  }
  if (
    !c.sourceVersion &&
    (!["http:", "https:"].includes(url.protocol) || url.username || url.password)
  )
    throw new CaptureError("Use an HTTP or HTTPS source URL without a password.", "url");
  c.checkedAt = previous?.url === c.url ? previous.checkedAt : new Date().toISOString();
  const checkedAt = String(form.get("checkedAt") ?? "").trim();
  if (
    checkedAt &&
    !(previous && previous.url !== c.url && checkedAt === previous.checkedAt.slice(0, 16))
  ) {
    const parsed = new Date(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(checkedAt) ? `${checkedAt}:00Z` : checkedAt,
    );
    if (!Number.isFinite(parsed.getTime()) || parsed.getTime() > Date.now() + 60000)
      throw new CaptureError("Enter a valid source check time.", "checkedAt");
    c.checkedAt = parsed.toISOString();
  }
  // Resolve the submitted choice against the database inside the write transaction.
  if (form.has("catalogue")) c.namespace = String(form.get("catalogue") ?? "");
  for (const [key, allowed] of [
    ["nameBasis", ["has_name", "classified_as", "described_as"]],
    ["nameEvidenceMode", ["field", "excerpt", "whole"]],
    ["holderEvidenceMode", ["excerpt", "whole", "shared"]],
    ["holderStatus", ["reported", "unknown"]],
    ["speakerMode", ["holder", "other", "unknown"]],
    ["nameRelationship", ["supports", "qualifies", "contradicts", "mentions", "provides_context"]],
    [
      "holderRelationship",
      ["supports", "qualifies", "contradicts", "mentions", "provides_context"],
    ],
  ] as const) {
    if (!(allowed as readonly string[]).includes(c[key]))
      throw new CaptureError("Choose one of the available answers.", key);
  }
  for (const key of ["holderIdentity", "speakerIdentity"] as const)
    if (c[key] !== "new" && !uuid.test(c[key]))
      throw new CaptureError("Choose a person or institution from the list.", key);
  if (!previous && !form.has("name") && !form.has("holder")) {
    c.nameEvidenceMode = "field";
    c.holderStatus = "unknown";
  }
  return c;
}
export function packetFor(id: string, revision: number, value: Content): DossierPacket {
  const c = normaliseContent(value);
  if (c.sourceVersion) {
    if (c.researchConsent !== "yes")
      throw new CaptureError(
        "Confirm that the selected wording and citation may enter the research collection.",
        "researchConsent",
      );
    if (!c.sourceCitation || !/^urn:mosa:source:[0-9a-f-]{36}$/.test(c.url))
      throw new CaptureError("Reload the preserved source before review.");
    if (
      !c.sourceRegions.trim() ||
      c.sourceRegions.split(/\r?\n/).some((line) => !/^page [1-9]\d*: .+/i.test(line))
    )
      throw new CaptureError(
        "List each source region on a separate line, for example Page 12: table, row 3, object column.",
        "sourceRegions",
      );
  }
  const need = (key: keyof Content, message: string) => {
    if (!c[key]) throw new CaptureError(message, key);
  };
  need("name", "Copy the name, object type or description from the source.");
  if (c.identifier || c.namespace) {
    need("identifier", "Enter the catalogue number, or leave both catalogue fields empty.");
    need("namespace", "Choose the catalogue that assigns this number.");
  }
  if (c.holderStatus === "reported")
    need(
      "holder",
      "Select the reported holder or enter a new institution. Choose ‘Not established’ if this source does not establish custody.",
    );
  if (c.holderStatus === "unknown" && c.speakerMode === "holder")
    throw new CaptureError(
      "Custody is unresolved. Select the catalogue publisher separately under ‘Another person or institution’, or leave attribution unknown.",
      "speakerMode",
    );
  if (c.speakerMode === "other")
    need("speaker", "Select or enter the person or institution making these statements.");
  const speaker =
    c.speakerMode === "holder"
      ? "agent:holder"
      : c.speakerMode === "other"
        ? "agent:speaker"
        : undefined;
  function evidence(prefix: "name" | "holder") {
    const mode = c[`${prefix}EvidenceMode`];
    if (mode === "shared") return evidence("name");
    if (mode === "whole") return { locator: "Catalogue record", mode: "whole_document" as const };
    need(
      `${prefix}Locator`,
      "Identify the source field or section where this information appears.",
    );
    if (mode === "field") return { locator: `Catalogue field: ${c.nameLocator}`, excerpt: c.name };
    need(
      `${prefix}Excerpt`,
      "Copy the source wording or select ‘The catalogue record as a whole’. Keep your interpretation in the separate private note.",
    );
    return { locator: c[`${prefix}Locator`], excerpt: c[`${prefix}Excerpt`] };
  }
  const claims: PacketClaim[] = [];
  function add(
    key: string,
    subject: string,
    predicate: PacketClaim["predicate"],
    text: string,
    ev: { locator: string; excerpt?: string; mode?: "excerpt" | "whole_document" },
    relationship: EvidenceRelationship = "supports",
  ) {
    claims.push({
      key: `claim:${key}`,
      subject,
      predicate,
      ...(predicate === "held_by" ? { object: text } : { literal: { type: "text", value: text } }),
      assertedBy: speaker,
      evidence: {
        key: `evidence:${key}`,
        source: "source:catalogue",
        relationship,
        mode: "excerpt",
        ...ev,
        ...(c.sourceVersion
          ? { locator: `${c.sourceCitation}\n${c.sourceRegions}\n${ev.locator}` }
          : {}),
      },
    });
  }
  add(
    "name",
    "item:object",
    c.nameBasis as PacketClaim["predicate"],
    c.name,
    evidence("name"),
    c.nameRelationship as EvidenceRelationship,
  );
  if (c.holderStatus === "reported") {
    add(
      "holder",
      "item:object",
      "held_by",
      "agent:holder",
      evidence("holder"),
      c.holderRelationship as EvidenceRelationship,
    );
    if (!c.holderNameEvidenceId) {
      need(
        "holderNameLocator",
        "For a new institution or a different label, identify where its name appears.",
      );
      need(
        "holderNameExcerpt",
        "Copy the wording that names this institution. Custody evidence is recorded separately.",
      );
      add("holder-name", "agent:holder", "has_name", c.holder, {
        locator: c.holderNameLocator,
        excerpt: c.holderNameExcerpt,
      });
    }
  }
  if (speaker === "agent:speaker" && !c.speakerNameEvidenceId) {
    need("speakerLocator", "Identify where this person or institution is named.");
    need("speakerExcerpt", "Copy the wording that names this person or institution.");
    add("speaker-name", speaker, "has_name", c.speaker, {
      locator: c.speakerLocator,
      excerpt: c.speakerExcerpt,
    });
  }
  const packet: DossierPacket = {
    schemaVersion: c.sourceVersion ? 3 : 2,
    dataset: { key: `capture-${id}`, version: String(revision) },
    objects: [
      {
        key: "item:object",
        kind: "artefact",
        externalIdentifiers: c.identifier
          ? [{ namespace: c.namespace, value: c.identifier, source: "source:catalogue" }]
          : [],
      },
    ],
    agents: [
      ...(c.holderStatus === "reported" ? [{ key: "agent:holder", kind: "organisation" }] : []),
      ...(speaker === "agent:speaker" ? [{ key: "agent:speaker" }] : []),
    ],
    places: [],
    sources: [
      {
        key: "source:catalogue",
        kind: c.sourceVersion ? "document" : "institutional_record",
        ...(c.sourceVersion ? { reference: c.url, version: c.sourceVersion } : { url: c.url }),
        retrievedAt: c.checkedAt,
        about: ["item:object"],
        assertedBy: speaker,
      },
    ],
    claims,
  };
  if (!validatePacket(packet).packet)
    throw new CaptureError(
      "Check the source wording, evidence and catalogue number before review.",
    );
  return packet;
}
export function publicationGaps(value: Content): string[] {
  const c = normaliseContent(value);
  return [
    ...(c.nameBasis !== "has_name"
      ? [
          "This records a classification or description. The current public card requires an evidenced name.",
        ]
      : []),
    ...(c.holderStatus === "unknown" ? ["The reported holder is unresolved."] : []),
    ...(!c.namespace || !c.identifier ? ["No catalogue identifier is recorded."] : []),
    ...(c.speakerMode === "unknown" ? ["The speaker is unknown."] : []),
    ...(c.nameRelationship !== "supports" ||
    (c.holderStatus === "reported" && c.holderRelationship !== "supports")
      ? ["The current public card requires unqualified supporting evidence."]
      : []),
  ];
}
export const newRequestId = randomUUID;
