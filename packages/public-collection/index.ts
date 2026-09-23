// This is the complete public boundary. Reject unknown keys at every level.
export interface Statement {
  text: string;
  language: string | null;
  attributedTo: string;
  sources: string[];
}
export interface PublicCard {
  id: string;
  name: Statement;
  holder: Statement;
  identifier: { namespace: string; label?: string; value: string; source: string };
}
export interface PublicEvidence {
  relationship: "supports" | "mentions" | "qualifies" | "contradicts" | "provides_context";
  citation: string;
  url?: string;
  locator: string;
  excerpt?: string;
}
export interface PublicClaim {
  predicate: string;
  subject: { key: string; kind: string; label: string };
  value: { kind: "text" | "entity" | "date"; text: string; language?: string };
  attributedTo: string | null;
  evidence: PublicEvidence[];
}
export interface PublicDossier {
  kind: "dossier";
  id: string;
  label: string;
  identifiers: { namespace: string; value: string; citation: string; url?: string }[];
  claims: PublicClaim[];
  events: { key: string; kind: string }[];
  cases: {
    reference: string;
    title: string;
    status: "open" | "closed";
    actions: { kind: string; description: string; date?: string }[];
    documents: { citation: string; url?: string; role: string }[];
  }[];
}
export interface PublicCollection {
  schemaVersion: 1 | 2;
  releaseId: string;
  records: (PublicCard | PublicDossier)[];
}
export const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function object(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("Expected an object");
  const result = value as Record<string, unknown>;
  if (Object.keys(result).sort().join() !== [...keys].sort().join())
    throw Error("Unexpected or missing fields");
  return result;
}
export function text(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > 2000 ||
    [...value].some((character) => character.charCodeAt(0) < 32)
  )
    throw Error("Invalid text");
  return value;
}
export function sourceURL(value: unknown): string {
  const original = text(value);
  const url = new URL(original);
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password)
    throw Error("Expected a public HTTP(S) source URL without credentials");
  return original;
}
function optionalURL(value: unknown): string | undefined {
  return value === undefined ? undefined : sourceURL(value);
}
function optionalText(value: unknown): string | undefined {
  return value === undefined ? undefined : text(value);
}
function dossier(value: unknown): PublicDossier {
  const d = object(value, ["kind", "id", "label", "identifiers", "claims", "events", "cases"]);
  if (d.kind !== "dossier" || typeof d.id !== "string" || !uuid.test(d.id))
    throw Error("Invalid dossier identity");
  if (
    !Array.isArray(d.identifiers) ||
    !Array.isArray(d.claims) ||
    !Array.isArray(d.events) ||
    !Array.isArray(d.cases) ||
    d.identifiers.length > 30 ||
    d.claims.length > 200 ||
    d.events.length > 50 ||
    d.cases.length > 20
  )
    throw Error("Invalid dossier lists");
  return {
    kind: "dossier",
    id: d.id,
    label: text(d.label),
    identifiers: d.identifiers.map((value) => {
      const v = object(value, [
        "namespace",
        "value",
        "citation",
        ...(value && typeof value === "object" && "url" in value ? ["url"] : []),
      ]);
      return {
        namespace: text(v.namespace),
        value: text(v.value),
        citation: text(v.citation),
        ...(v.url === undefined ? {} : { url: sourceURL(v.url) }),
      };
    }),
    claims: d.claims.map((value) => {
      const c = object(value, ["predicate", "subject", "value", "attributedTo", "evidence"]);
      const subject = object(c.subject, ["key", "kind", "label"]);
      const claimValue = object(c.value, [
        "kind",
        "text",
        ...(c.value && typeof c.value === "object" && "language" in c.value ? ["language"] : []),
      ]);
      if (
        !["text", "entity", "date"].includes(String(claimValue.kind)) ||
        (claimValue.language !== undefined &&
          (typeof claimValue.language !== "string" ||
            !/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(claimValue.language)))
      )
        throw Error("Invalid claim value");
      if (c.attributedTo !== null && typeof c.attributedTo !== "string")
        throw Error("Invalid attribution");
      if (!Array.isArray(c.evidence) || c.evidence.length < 1 || c.evidence.length > 10)
        throw Error("Claim needs bounded evidence");
      return {
        predicate: text(c.predicate),
        subject: { key: text(subject.key), kind: text(subject.kind), label: text(subject.label) },
        value: {
          kind: claimValue.kind as PublicClaim["value"]["kind"],
          text: text(claimValue.text),
          ...(claimValue.language === undefined ? {} : { language: claimValue.language }),
        },
        attributedTo: c.attributedTo === null ? null : text(c.attributedTo),
        evidence: c.evidence.map((value) => {
          const e = object(value, [
            "relationship",
            "citation",
            "locator",
            ...(value && typeof value === "object" && "url" in value ? ["url"] : []),
            ...(value && typeof value === "object" && "excerpt" in value ? ["excerpt"] : []),
          ]);
          if (
            !["supports", "mentions", "qualifies", "contradicts", "provides_context"].includes(
              String(e.relationship),
            )
          )
            throw Error("Invalid evidence relationship");
          return {
            relationship: e.relationship as PublicEvidence["relationship"],
            citation: text(e.citation),
            locator: text(e.locator),
            ...(optionalURL(e.url) ? { url: optionalURL(e.url) } : {}),
            ...(optionalText(e.excerpt) ? { excerpt: optionalText(e.excerpt) } : {}),
          };
        }),
      };
    }),
    events: d.events.map((value) => {
      const e = object(value, ["key", "kind"]);
      return { key: text(e.key), kind: text(e.kind) };
    }),
    cases: d.cases.map((value) => {
      const c = object(value, ["reference", "title", "status", "actions", "documents"]);
      if (
        !["open", "closed"].includes(String(c.status)) ||
        !Array.isArray(c.actions) ||
        !Array.isArray(c.documents) ||
        c.actions.length > 100 ||
        c.documents.length > 50
      )
        throw Error("Invalid public case");
      return {
        reference: text(c.reference),
        title: text(c.title),
        status: c.status as "open" | "closed",
        actions: c.actions.map((value) => {
          const a = object(value, [
            "kind",
            "description",
            ...(value && typeof value === "object" && "date" in value ? ["date"] : []),
          ]);
          return {
            kind: text(a.kind),
            description: text(a.description),
            ...(optionalText(a.date) ? { date: optionalText(a.date) } : {}),
          };
        }),
        documents: c.documents.map((value) => {
          const doc = object(value, [
            "citation",
            "role",
            ...(value && typeof value === "object" && "url" in value ? ["url"] : []),
          ]);
          return {
            citation: text(doc.citation),
            role: text(doc.role),
            ...(optionalURL(doc.url) ? { url: optionalURL(doc.url) } : {}),
          };
        }),
      };
    }),
  };
}
function statement(value: unknown): Statement {
  const s = object(value, ["text", "language", "attributedTo", "sources"]);
  if (
    s.language !== null &&
    (typeof s.language !== "string" || !/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(s.language))
  )
    throw Error("Invalid language tag");
  if (!Array.isArray(s.sources) || s.sources.length < 1 || s.sources.length > 5)
    throw Error("Missing or excessive sources");
  return {
    text: text(s.text),
    language: s.language as string | null,
    attributedTo: text(s.attributedTo),
    sources: [...new Set(s.sources.map(sourceURL))],
  };
}
export function parseCollection(value: unknown): PublicCollection {
  const c = object(value, ["schemaVersion", "releaseId", "records"]);
  if (
    ![1, 2].includes(Number(c.schemaVersion)) ||
    typeof c.releaseId !== "string" ||
    !uuid.test(c.releaseId)
  )
    throw Error("Unsupported public collection version or release ID");
  if (!Array.isArray(c.records) || c.records.length > (c.schemaVersion === 1 ? 2 : 1000))
    throw Error("Too many public records");
  const records = c.records.map((value): PublicCard | PublicDossier => {
    if (c.schemaVersion === 2 && value && typeof value === "object" && "kind" in value)
      return dossier(value);
    const card = object(value, ["id", "name", "holder", "identifier"]);
    if (typeof card.id !== "string" || !uuid.test(card.id)) throw Error("Invalid item ID");
    const identifierValue = card.identifier;
    const id = object(
      identifierValue,
      identifierValue && typeof identifierValue === "object" && "label" in identifierValue
        ? ["namespace", "label", "value", "source"]
        : ["namespace", "value", "source"],
    );
    return {
      id: card.id,
      name: statement(card.name),
      holder: statement(card.holder),
      identifier: {
        namespace: text(id.namespace),
        ...(id.label === undefined ? {} : { label: text(id.label) }),
        value: text(id.value),
        source: sourceURL(id.source),
      },
    };
  });
  if (new Set(records.map((record) => record.id)).size !== records.length)
    throw Error("Duplicate collection item");
  return { schemaVersion: c.schemaVersion as 1 | 2, releaseId: c.releaseId, records };
}
