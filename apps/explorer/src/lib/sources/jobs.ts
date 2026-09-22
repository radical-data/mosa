import { randomUUID } from "node:crypto";
import type { ClientBase, Pool } from "pg";
import { CaptureError, uuid } from "../capture/model.js";
import { requireResearcher } from "../capture/store.js";
import { CaptureFailure, type CaptureResult, captureUrl, publicUrl } from "./fetch.js";
import { type SourceStorage, sha256, sourceStorage } from "./storage.js";
import type { SourceVersion } from "./store.js";

export interface Job {
  id: string;
  owner_id: string;
  source_id: string;
  kind: string;
  status: string;
  attempts: number;
  lease: string;
  input: Record<string, unknown>;
  result: Record<string, unknown>;
  error: string | null;
}
export async function enqueueCapture(
  c: ClientBase,
  actor: string,
  requestId: string,
  value: string,
) {
  if (!uuid.test(requestId)) throw new CaptureError("Reload the capture form.");
  const url = publicUrl(value).href;
  const source =
    (
      await c.query<{ id: string }>(
        `insert into capture.source(id,owner_id,citation,original_url) values($1,$2,$3,$3)
 on conflict(owner_id,original_url) where original_url is not null do nothing returning id`,
        [randomUUID(), actor, url],
      )
    ).rows[0] ??
    (
      await c.query<{ id: string }>(
        "select id from capture.source where owner_id=$1 and original_url=$2",
        [actor, url],
      )
    ).rows[0];
  await c.query(
    `insert into capture.job(id,owner_id,source_id,kind,input) values($1,$2,$3,'capture',$4) on conflict(id) do nothing`,
    [requestId, actor, source.id, { url }],
  );
  const existing = (await c.query<Job>("select * from capture.job where id=$1", [requestId]))
    .rows[0];
  if (!existing || existing.source_id !== source.id)
    throw new CaptureError("This request already belongs to another source.");
  return source.id;
}
export async function transaction<T>(pool: Pool, fn: (c: ClientBase) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query("begin");
    const result = await fn(c);
    await c.query("commit");
    return result;
  } catch (e) {
    await c.query("rollback");
    throw e;
  } finally {
    c.release();
  }
}
export async function claimJob(pool: Pool): Promise<Job | undefined> {
  return transaction(pool, async (c) => {
    await c.query(
      "update capture.job set status='failed',error='Worker interrupted three times; retry explicitly.' where status='running' and lease_until<now() and attempts>=3",
    );
    const row = (
      await c.query<Job>(`select j.* from capture.job j join capture.researcher r on r.user_id=j.owner_id and r.enabled
    where (status='queued' or status='running' and lease_until<now()) and attempts<3 order by created_at for update of j skip locked limit 1`)
    ).rows[0];
    if (!row) return;
    const lease = randomUUID();
    await c.query(
      "update capture.job set status='running',lease=$2,lease_until=now()+interval '3 minutes',attempts=attempts+1,error=null where id=$1",
      [row.id, lease],
    );
    return { ...row, lease, status: "running" };
  });
}
export async function withJob<T>(
  pool: Pool,
  job: Job,
  fn: (c: ClientBase) => Promise<T>,
): Promise<T> {
  return transaction(pool, async (c) => {
    const current = (
      await c.query(
        "select 1 from capture.job where id=$1 and lease=$2 and status in ('running','paused') and lease_until>now() for update",
        [job.id, job.lease],
      )
    ).rowCount;
    if (!current)
      throw new CaptureFailure("lease_lost", "Worker lease expired; saved work will be resumed.");
    await requireResearcher(c, job.owner_id);
    return fn(c);
  });
}
export async function performCapture(
  pool: Pool,
  job: Job,
  storage: SourceStorage,
  fetchSource: (url: string) => Promise<CaptureResult> = captureUrl,
) {
  let version = await withJob(
    pool,
    job,
    async (c) =>
      (await c.query<SourceVersion>("select * from capture.source_version where id=$1", [job.id]))
        .rows[0],
  );
  let bytes: Uint8Array;
  if (version) {
    if (version.state === "ready") return { versionId: version.id };
    // A reserved version is immutable. If storage failed, recapture only identical bytes.
    try {
      bytes = await storage.get(version.storage_key);
    } catch {
      bytes = (await fetchSource(String(job.input.url))).bytes;
    }
    if (sha256(bytes) !== version.sha256)
      throw new CaptureFailure(
        "source_changed",
        "The source changed during capture. Start a new capture; the earlier reservation is retained.",
      );
  } else {
    const captured = await fetchSource(String(job.input.url));
    bytes = captured.bytes;
    version = await withJob(
      pool,
      job,
      async (c) =>
        (
          await c.query<SourceVersion>(
            `insert into capture.source_version
     (id,source_id,filename,media_type,byte_count,sha256,storage_key,readable_text,manifest)
     values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *`,
            [
              job.id,
              job.source_id,
              captured.mediaType === "application/json" ? "catalogue.json" : "catalogue.html",
              captured.mediaType,
              bytes.length,
              sha256(bytes),
              `${job.owner_id}/${job.source_id}/${job.id}`,
              captured.text,
              captured.manifest,
            ],
          )
        ).rows[0],
    );
  }
  await storage.put(version.storage_key, bytes, version.media_type);
  await withJob(pool, job, (c) =>
    c.query("update capture.source_version set state='ready' where id=$1", [version.id]),
  );
  return { versionId: version.id };
}
export type JobHandler = (pool: Pool, job: Job) => Promise<Record<string, unknown>>;
export async function runOne(
  pool: Pool,
  handlers: Record<string, JobHandler> = {
    capture: (p, j) => performCapture(p, j, sourceStorage()),
  },
) {
  const job = await claimJob(pool);
  if (!job) return false;
  try {
    const handler = handlers[job.kind];
    if (!handler)
      throw new CaptureFailure("unsupported", "This worker does not support the requested job.");
    const result = await handler(pool, job);
    await withJob(pool, job, (c) =>
      c.query("update capture.job set status='succeeded',result=$2,lease_until=null where id=$1", [
        job.id,
        result,
      ]),
    );
  } catch (e) {
    const message =
      e instanceof CaptureFailure
        ? `${e.code}: ${e.message}`
        : "Operation failed. Check worker configuration or retry; saved work is retained.";
    await pool.query(
      "update capture.job set status='failed',error=$3,lease_until=null where id=$1 and lease=$2 and status in ('running','paused')",
      [job.id, job.lease, message],
    );
  }
  return true;
}
