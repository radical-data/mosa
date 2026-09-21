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
  identifier: { namespace: string; value: string; source: string };
}
export interface PublicCollection {
  schemaVersion: 1;
  releaseId: string;
  records: PublicCard[];
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
  if (c.schemaVersion !== 1 || typeof c.releaseId !== "string" || !uuid.test(c.releaseId))
    throw Error("Unsupported public collection version or release ID");
  if (!Array.isArray(c.records) || c.records.length > 1)
    throw Error("Slice 1 supports zero or one explicitly selected record");
  const records = c.records.map((value): PublicCard => {
    const card = object(value, ["id", "name", "holder", "identifier"]);
    if (typeof card.id !== "string" || !uuid.test(card.id)) throw Error("Invalid item ID");
    const id = object(card.identifier, ["namespace", "value", "source"]);
    return {
      id: card.id,
      name: statement(card.name),
      holder: statement(card.holder),
      identifier: {
        namespace: text(id.namespace),
        value: text(id.value),
        source: sourceURL(id.source),
      },
    };
  });
  return { schemaVersion: 1, releaseId: c.releaseId, records };
}
