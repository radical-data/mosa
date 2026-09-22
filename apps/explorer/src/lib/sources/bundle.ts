import { createHash } from "node:crypto";
import { CaptureError, uuid } from "../capture/model.js";
import { publicUrl, readable } from "./fetch.js";
import { sha256 } from "./storage.js";
import { validatePdf } from "./store.js";

export const MAX_BUNDLE_BYTES = 20_000_000;
export interface BundleSource {
  key: string;
  filename: string;
  citation: string;
  author: string;
  documentDate: string;
  url: string;
  retrievedAt: string;
  contentType: string;
  sha256: string;
  data: string;
}
export interface BundleCandidate {
  key: string;
  sourceKey: string;
  value: string;
  predicate: "has_name" | "classified_as" | "described_as";
  quotation: string;
  locator: string;
  regions: string;
  notes: string;
}
export interface ResearchBundle {
  schemaVersion: 1;
  id: string;
  title: string;
  preparedBy: string;
  method: "human" | "agent" | "mixed";
  tool: string;
  notes: string;
  sources: BundleSource[];
  candidates: BundleCandidate[];
  leads: {
    key: string;
    description: string;
    seedLocator: string;
    outcome: string;
    notes: string;
  }[];
}
export interface CheckedSource {
  input: BundleSource;
  bytes: Uint8Array;
  text: string | null;
  mediaType: string;
}
function record(value: unknown, keys: string[], label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new CaptureError(`Invalid ${label}.`);
  const result = value as Record<string, unknown>;
  if (Object.keys(result).some((key) => !keys.includes(key)))
    throw new CaptureError(`Unsupported field in ${label}.`);
  return result;
}
function text(value: unknown, label: string, max = 4000, required = true): string {
  if (typeof value !== "string" || value.length > max || (required && !value.trim()))
    throw new CaptureError(`Invalid ${label}; use ${required ? "1–" : "0–"}${max} characters.`);
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code < 32 && ![9, 10, 13].includes(code))
      throw new CaptureError(`Remove unsupported control characters from ${label}.`);
  }
  return value;
}
function key(value: unknown) {
  const result = text(value, "record key", 100);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(result))
    throw new CaptureError("Use lower-case letters, digits and hyphens in record keys.");
  return result;
}
function list(value: unknown, max: number, label: string): unknown[] {
  if (!Array.isArray(value) || value.length > max)
    throw new CaptureError(`Use at most ${max} ${label}.`);
  return value;
}
function unique<T extends { key: string }>(values: T[]) {
  if (new Set(values.map((v) => v.key)).size !== values.length)
    throw new CaptureError("Record keys must be unique within each list.");
  return values;
}
export function validateBundle(raw: unknown) {
  const b = record(
    raw,
    [
      "schemaVersion",
      "id",
      "title",
      "preparedBy",
      "method",
      "tool",
      "notes",
      "sources",
      "candidates",
      "leads",
    ],
    "bundle",
  );
  if (b.schemaVersion !== 1 || typeof b.id !== "string" || !uuid.test(b.id))
    throw new CaptureError("Use bundle schemaVersion 1 and a UUID id.");
  if (!["human", "agent", "mixed"].includes(String(b.method)))
    throw new CaptureError("Choose a preparation method: human, agent or mixed.");
  const sources: CheckedSource[] = list(b.sources, 25, "sources").map((rawSource) => {
    const s = record(
      rawSource,
      [
        "key",
        "filename",
        "citation",
        "author",
        "documentDate",
        "url",
        "retrievedAt",
        "contentType",
        "sha256",
        "data",
      ],
      "source",
    );
    const filename = text(s.filename, "filename", 200);
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(filename))
      throw new CaptureError("Source filenames must be plain filenames without paths.");
    const url = text(s.url, "source URL", 2000, false);
    if (url) publicUrl(url);
    const retrievedAt = text(s.retrievedAt, "retrieval date", 40);
    if (
      !/^\d{4}-\d{2}-\d{2}T.*Z$/.test(retrievedAt) ||
      !Number.isFinite(Date.parse(retrievedAt)) ||
      Date.parse(retrievedAt) > Date.now() + 60000
    )
      throw new CaptureError("Use a valid UTC retrieval date, no later than now.");
    const contentType = text(s.contentType, "content type", 100);
    const mediaType = contentType.split(";")[0];
    if (!["application/pdf", "text/html", "application/json"].includes(mediaType))
      throw new CaptureError("Sources must be PDF, HTML or JSON.");
    const data = text(s.data, "source bytes", MAX_BUNDLE_BYTES);
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(data))
      throw new CaptureError("Invalid base64 source bytes.");
    const bytes = Buffer.from(data, "base64");
    if (!bytes.length || bytes.toString("base64") !== data || sha256(bytes) !== s.sha256)
      throw new CaptureError("Source checksum does not match its saved bytes.");
    if (mediaType === "application/pdf") validatePdf(bytes, mediaType);
    const input: BundleSource = {
      key: key(s.key),
      filename,
      citation: text(s.citation, "citation", 2000),
      author: text(s.author, "author", 2000, false),
      documentDate: text(s.documentDate, "document date", 2000, false),
      url,
      retrievedAt,
      contentType,
      sha256: String(s.sha256),
      data,
    };
    return {
      input,
      bytes,
      mediaType,
      text: mediaType === "application/pdf" ? null : readable(bytes, contentType),
    };
  });
  unique(sources.map((s) => s.input));
  const candidates: BundleCandidate[] = unique(
    list(b.candidates, 100, "candidates").map((rawCandidate) => {
      const c = record(
        rawCandidate,
        ["key", "sourceKey", "value", "predicate", "quotation", "locator", "regions", "notes"],
        "candidate",
      );
      const sourceKey = key(c.sourceKey);
      const source = sources.find((s) => s.input.key === sourceKey);
      if (!source) throw new CaptureError("Candidate references a missing source.");
      if (!["has_name", "classified_as", "described_as"].includes(String(c.predicate)))
        throw new CaptureError("Unsupported proposed predicate.");
      const value = text(c.value, "proposed wording");
      const quotation = text(c.quotation, "quotation");
      if (!quotation.includes(value) || (source.text !== null && !source.text.includes(quotation)))
        throw new CaptureError(
          "Proposed wording must occur in its quotation, and web quotations must occur in the preserved source.",
        );
      const regions = text(c.regions, "source regions");
      if (
        source.mediaType === "application/pdf" &&
        regions.split(/\r?\n/).some((r) => !/^page [1-9]\d*: .+/i.test(r))
      )
        throw new CaptureError("For PDF evidence, identify each region as Page 12: table, row 3.");
      return {
        key: key(c.key),
        sourceKey,
        value,
        predicate: c.predicate as BundleCandidate["predicate"],
        quotation,
        locator: text(c.locator, "evidence locator"),
        regions,
        notes: text(c.notes, "candidate notes", 4000, false),
      };
    }),
  );
  const leads = unique(
    list(b.leads, 100, "leads").map((rawLead) => {
      const l = record(rawLead, ["key", "description", "seedLocator", "outcome", "notes"], "lead");
      if (!["matched", "ambiguous", "no-match", "blocked"].includes(String(l.outcome)))
        throw new CaptureError("Use a lead outcome of matched, ambiguous, no-match or blocked.");
      return {
        key: key(l.key),
        description: text(l.description, "lead description"),
        seedLocator: text(l.seedLocator, "seed locator"),
        outcome: String(l.outcome),
        notes: text(l.notes, "lead notes", 4000, false),
      };
    }),
  );
  if (!sources.length && !leads.length)
    throw new CaptureError("Include a preserved source or a researched lead.");
  const bundle: ResearchBundle = {
    schemaVersion: 1,
    id: b.id.toLowerCase(),
    title: text(b.title, "bundle title", 200),
    preparedBy: text(b.preparedBy, "preparer", 200),
    method: b.method as ResearchBundle["method"],
    tool: text(b.tool, "tool", 200, false),
    notes: text(b.notes, "bundle notes", 4000, false),
    sources: sources.map((s) => s.input),
    candidates,
    leads,
  };
  if (Buffer.byteLength(JSON.stringify(bundle)) > MAX_BUNDLE_BYTES)
    throw new CaptureError("Bundle exceeds 20 MB. Split it into smaller batches.");
  const manifest = { ...bundle, sources: bundle.sources.map(({ data: _data, ...s }) => s) };
  // Stable hashing makes JSON whitespace and property order irrelevant to retries.
  const canonical = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(canonical)
      : v && typeof v === "object"
        ? Object.fromEntries(
            Object.entries(v)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([k, value]) => [k, canonical(value)]),
          )
        : v;
  return {
    bundle,
    sources,
    manifest,
    checksum: sha256(Buffer.from(JSON.stringify(canonical(manifest)))),
  };
}
export type CheckedBundle = ReturnType<typeof validateBundle>;
export function bundleRecordId(actor: string, bundle: string, key: string) {
  const hex = createHash("sha256")
    .update(JSON.stringify([actor, bundle, key]))
    .digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}
