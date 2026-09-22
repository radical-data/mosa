import type { ClientBase } from "pg";
import { CaptureError, uuid } from "../capture/model.js";
import { MAX_SOURCE_BYTES, sha256 } from "./storage.js";

export interface SavedSource {
  id: string;
  owner_id: string;
  citation: string;
  author: string;
  document_date: string;
  hidden: boolean;
  created_at: string;
}
export interface SourceVersion {
  id: string;
  source_id: string;
  filename: string;
  media_type: string;
  byte_count: number;
  sha256: string;
  storage_key: string;
  state: "uploading" | "ready";
  created_at: string;
}
export function validatePdf(bytes: Uint8Array, mediaType: string) {
  if (bytes.length === 0 || bytes.length > MAX_SOURCE_BYTES)
    throw new CaptureError("Choose a PDF of at most 20 MB.");
  if (
    mediaType !== "application/pdf" ||
    !Buffer.from(bytes.subarray(0, 8))
      .toString()
      .match(/^%PDF-\d\.\d/)
  )
    throw new CaptureError("Choose a PDF document.");
}
export function sourceField(value: unknown, label: string, required = false) {
  const text = typeof value === "string" ? value.trim() : "";
  if (
    (required && !text) ||
    text.length > 2000 ||
    [...text].some((ch) => ch.charCodeAt(0) < 32 && ![9, 10].includes(ch.charCodeAt(0)))
  )
    throw new CaptureError(`Enter ${label} using at most 2000 characters.`);
  return text;
}
export async function getSource(c: ClientBase, id: string): Promise<SavedSource> {
  if (!uuid.test(id)) throw new CaptureError("Source not found.");
  const result = await c.query<SavedSource>("select * from capture.source where id=$1", [id]);
  if (!result.rows[0]) throw new CaptureError("Source not found.");
  return result.rows[0];
}
export async function getVersion(c: ClientBase, id: string): Promise<SourceVersion> {
  if (!uuid.test(id)) throw new CaptureError("Source version not found.");
  const result = await c.query<SourceVersion>("select * from capture.source_version where id=$1", [
    id,
  ]);
  if (!result.rows[0]) throw new CaptureError("Source version not found.");
  return result.rows[0];
}
export async function reserveUpload(
  c: ClientBase,
  actor: string,
  input: {
    id: string;
    citation: string;
    author: string;
    documentDate: string;
    filename: string;
    bytes: Uint8Array;
  },
) {
  if (!uuid.test(input.id)) throw new CaptureError("Reload the upload form.");
  await c.query("select pg_advisory_xact_lock(hashtextextended($1,0))", [input.id]);
  const prior = await c.query<SourceVersion>("select * from capture.source_version where id=$1", [
    input.id,
  ]);
  if (prior.rows[0]) {
    if (prior.rows[0].sha256 !== sha256(input.bytes))
      throw new CaptureError(
        "This upload request already belongs to a different file. Start a new upload.",
      );
    return prior.rows[0];
  }
  await c.query(
    "insert into capture.source(id,owner_id,citation,author,document_date) values($1,$2,$3,$4,$5)",
    [input.id, actor, input.citation, input.author, input.documentDate],
  );
  const result = await c.query<SourceVersion>(
    `insert into capture.source_version
    (id,source_id,filename,media_type,byte_count,sha256,storage_key)
    values($1,$1,$2,'application/pdf',$3,$4,$5) returning *`,
    [
      input.id,
      [...input.filename]
        .map((ch) => (ch.charCodeAt(0) < 32 || ["/", "\\"].includes(ch) ? "_" : ch))
        .join("")
        .slice(0, 200),
      input.bytes.length,
      sha256(input.bytes),
      `${actor}/${input.id}/${input.id}`,
    ],
  );
  return result.rows[0];
}
