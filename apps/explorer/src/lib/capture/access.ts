import type { APIContext } from "astro";
import { Pool, type PoolClient } from "pg";
import { resolveDatabaseConfig } from "../database-config";
import { CaptureError } from "./model";
import { requireResearcher } from "./store";

let pool: Pool | undefined;
export function capturePool() {
  if (!process.env.CAPTURE_DATABASE_URL)
    throw new CaptureError("Research entry is not configured yet.");
  if (!pool) {
    const config = resolveDatabaseConfig({
      nodeEnv: process.env.NODE_ENV,
      databaseUrl: process.env.CAPTURE_DATABASE_URL,
      databaseSslCa: process.env.DATABASE_SSL_CA,
      databasePoolSize: "3",
      databaseStatementTimeoutMs: "10000",
    });
    pool = new Pool({
      connectionString: config.connectionString,
      ssl: config.ssl,
      max: 3,
      connectionTimeoutMillis: 3000,
      idleTimeoutMillis: 10000,
      allowExitOnIdle: true,
      options: "-c statement_timeout=10000 -c lock_timeout=3000",
      application_name: "mosa-capture",
    });
  }
  return pool;
}
export async function researchTransaction<T>(
  actor: string,
  action: (client: PoolClient) => Promise<T>,
) {
  const client = await capturePool().connect();
  try {
    await client.query("begin");
    await requireResearcher(client, actor);
    const value = await action(client);
    await client.query("commit");
    return value;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
export async function authRequest(path: string, body?: unknown, token?: string) {
  const origin = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!origin || !key) throw new CaptureError("Research sign-in is not configured yet.");
  const url = new URL(origin);
  if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname))
    throw new Error("Auth requires HTTPS");
  return fetch(new URL(`/auth/v1/${path}`, url), {
    method: body ? "POST" : "GET",
    headers: {
      apikey: key,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    redirect: "error",
    signal: AbortSignal.timeout(10000),
  });
}
export async function authenticatedActor(context: APIContext): Promise<string | null> {
  const token = context.cookies.get("mosa-research")?.value;
  if (!token) return null;
  const response = await authRequest("user", undefined, token);
  if (!response.ok) return null;
  const user = (await response.json()) as { id?: string };
  if (!user.id) return null;
  await researchTransaction(user.id, async () => {});
  return user.id;
}
export function checkOrigin(request: Request) {
  const expected =
    process.env.RESEARCH_ORIGIN ??
    (process.env.NODE_ENV === "production" ? null : new URL(request.url).origin);
  if (!expected || request.headers.get("origin") !== expected)
    throw new CaptureError("This form must be submitted from the research website.");
  if (
    !["application/x-www-form-urlencoded", "multipart/form-data"].some((type) =>
      request.headers.get("content-type")?.startsWith(type),
    )
  )
    throw new CaptureError("Submit the research form.");
}
export async function boundedForm(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new CaptureError("Missing form.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 64000) {
      await reader.cancel();
      throw new CaptureError("This form is too large.");
    }
    chunks.push(value);
  }
  return new Response(Buffer.concat(chunks), {
    headers: { "Content-Type": request.headers.get("content-type") ?? "" },
  }).formData();
}
