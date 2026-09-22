import { createHash } from "node:crypto";

export const MAX_SOURCE_BYTES = 20_000_000;
export const sha256 = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

export interface SourceStorage {
  put(key: string, bytes: Uint8Array, mediaType: string): Promise<void>;
  get(key: string): Promise<Uint8Array>;
}

// Only server callers use this client. Never expose storage credentials or URLs.
export function sourceStorage(): SourceStorage {
  const origin = process.env.SOURCE_STORAGE_URL ?? process.env.SUPABASE_URL;
  const token = process.env.SOURCE_STORAGE_KEY;
  if (!origin || !token) throw new Error("Private source storage is not configured");
  const base = new URL(origin);
  if (base.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(base.hostname))
    throw new Error("Storage requires HTTPS");
  function url(key: string) {
    if (!/^[a-f0-9-]+\/[a-f0-9-]+\/[a-f0-9-]+$/.test(key))
      throw new Error("Invalid private storage key");
    return new URL(`/storage/v1/object/research-sources/${key}`, base);
  }
  const headers = { Authorization: `Bearer ${token}`, apikey: token };
  const get = async (key: string) => {
    const response = await fetch(url(key), {
      headers,
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error("The preserved file could not be read");
    return boundedBytes(response, MAX_SOURCE_BYTES);
  };
  return {
    get,
    async put(key, bytes, mediaType) {
      const response = await fetch(url(key), {
        method: "POST",
        headers: { ...headers, "Content-Type": mediaType, "x-upsert": "false" },
        body: Buffer.from(bytes),
        redirect: "error",
        signal: AbortSignal.timeout(30_000),
      });
      // A retry may follow a successful upload but an interrupted DB finalisation.
      if (!response.ok && ![400, 409].includes(response.status))
        throw new Error("The source upload could not be stored");
      const stored = await get(key);
      if (sha256(stored) !== sha256(bytes)) throw new Error("Stored source checksum differs");
    },
  };
}

export async function boundedBytes(response: Response | Request, limit: number) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Missing content");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) throw new Error("Content exceeds the size limit");
      chunks.push(value);
    }
    return Buffer.concat(chunks);
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
