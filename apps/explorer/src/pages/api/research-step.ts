import { createHash, timingSafeEqual } from "node:crypto";
import type { APIRoute } from "astro";
import { Pool } from "pg";
import { performDiscovery } from "../../lib/sources/discovery";
import { performCapture, runOne } from "../../lib/sources/jobs";
import { performPreparation } from "../../lib/sources/preparation";
import { sourceStorage } from "../../lib/sources/storage";

// Called by Supabase Cron, never by source content or the browser.
export const POST: APIRoute = async ({ request }) => {
  const secret = process.env.RESEARCH_RUNNER_SECRET;
  const supplied = request.headers.get("authorization") ?? "";
  const digest = (text: string) => createHash("sha256").update(text).digest();
  if (
    !secret ||
    secret.length < 32 ||
    !timingSafeEqual(digest(supplied), digest(`Bearer ${secret}`))
  )
    return new Response("Unauthorised", { status: 401 });
  const connectionString = process.env.RESEARCH_WORKER_DATABASE_URL;
  if (!connectionString) return new Response("Research runner is not configured", { status: 503 });
  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 5000,
    statement_timeout: 15000,
  });
  try {
    return Response.json(
      {
        processed: await runOne(pool, {
          capture: (p, j) => performCapture(p, j, sourceStorage()),
          prepare: performPreparation,
          discover: performDiscovery,
        }),
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return new Response("Research step interrupted; queued work is retained", { status: 503 });
  } finally {
    await pool.end();
  }
};
