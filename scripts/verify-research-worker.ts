import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Client, Pool } from "pg";
import { getLocalDatabaseUrl } from "./lib/supabase-local";

async function verify() {
  const { enqueueCapture, performCapture, runOne, claimJob, withJob } = await import(
    "../apps/explorer/src/lib/sources/jobs.js"
  );
  const { readable } = await import("../apps/explorer/src/lib/sources/fetch.js");
  const databaseUrl =
    process.env.CAPTURE_TEST_DATABASE_URL ?? (await getLocalDatabaseUrl(process.cwd()));
  if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(databaseUrl).hostname))
    throw Error("Disposable local database required");
  const admin = new Client({ connectionString: databaseUrl });
  await admin.connect();
  const login = `worker_test_${randomUUID().replaceAll("-", "")}`,
    password = randomUUID();
  await admin.query(`create role ${login} login password '${password}'`);
  await admin.query(`grant capture_worker to ${login}`);
  const workerUrl = new URL(databaseUrl);
  workerUrl.username = login;
  workerUrl.password = password;
  const worker = new Pool({ connectionString: workerUrl.toString(), max: 2 });
  const actor = randomUUID();
  await admin.query("insert into capture.researcher(user_id) values($1)", [actor]);
  const saved = new Map<string, Uint8Array>();
  let fail = true;
  let fetches = 0;
  const storage = {
    get: async (key: string) => {
      const b = saved.get(key);
      if (!b) throw Error("missing");
      return b;
    },
    put: async (key: string, bytes: Uint8Array) => {
      saved.set(key, bytes);
      if (fail) {
        fail = false;
        throw Error("interrupted");
      }
    },
  };
  let wording = "A wooden figure from Rapa Nui, described by the museum in its catalogue.";
  const fetcher = async () => {
    fetches++;
    const bytes = Buffer.from(`<p>${wording}</p>`);
    return {
      bytes,
      mediaType: "text/html",
      text: readable(bytes, "text/html"),
      manifest: {
        requestedUrl: "https://example.org/item",
        finalUrl: "https://example.org/item",
        redirects: [],
        status: 200,
        retrievedAt: new Date().toISOString(),
        contentType: "text/html",
        etag: null,
        lastModified: null,
        extractor: "mosa-readable-v1",
      },
    };
  };
  const handler = (p: Pool, j: Parameters<typeof performCapture>[1]) =>
    performCapture(p, j, storage, fetcher);
  try {
    await assert.rejects(
      () => worker.query("insert into knowledge.claim default values"),
      /permission denied/,
    );
    await assert.rejects(
      () => worker.query("insert into publication.decision default values"),
      /permission denied/,
    );
    await admin.query("begin");
    await admin.query("select set_config('capture.actor',$1,true)", [actor]);
    const id = randomUUID();
    const sourceId = await enqueueCapture(admin, actor, id, "https://example.org/item");
    assert.equal(await enqueueCapture(admin, actor, id, "https://example.org/item"), sourceId);
    await admin.query("commit");
    await runOne(worker, { capture: handler });
    assert.equal(
      (await admin.query("select status from capture.job where id=$1", [id])).rows[0].status,
      "failed",
    );
    await admin.query("update capture.job set status='queued' where id=$1", [id]);
    await runOne(worker, { capture: handler });
    assert.equal(fetches, 1, "Restart uses the reserved original bytes");
    assert.equal(saved.size, 1);
    assert.equal(
      (await admin.query("select status from capture.job where id=$1", [id])).rows[0].status,
      "succeeded",
    );
    const original = (await admin.query("select * from capture.source_version where id=$1", [id]))
      .rows[0];
    wording = "A changed catalogue description of the wooden figure from Rapa Nui.";
    const next = randomUUID();
    await admin.query("begin");
    await admin.query("select set_config('capture.actor',$1,true)", [actor]);
    await enqueueCapture(admin, actor, next, "https://example.org/item");
    await admin.query("commit");
    const lease = await claimJob(worker);
    assert(lease);
    assert.equal(lease.id, next);
    assert.equal(await claimJob(worker), undefined, "Another worker cannot take a live lease");
    await admin.query("update capture.job set lease_until=now()-interval '1 second' where id=$1", [
      next,
    ]);
    await assert.rejects(() => withJob(worker, lease, async () => null), /lease expired/);
    await runOne(worker, { capture: handler });
    assert.equal(
      (
        await admin.query("select count(*)::int n from capture.source_version where source_id=$1", [
          sourceId,
        ])
      ).rows[0].n,
      2,
    );
    assert.equal(
      (await admin.query("select sha256 from capture.source_version where id=$1", [id])).rows[0]
        .sha256,
      original.sha256,
    );
    assert.equal(await runOne(worker, { capture: handler }), false);
    console.log(
      "Verified restricted capture worker: leases, interruption, immutable versions and idempotent results.",
    );
  } finally {
    await worker.end();
    await admin.query(`drop role ${login}`);
    await admin.end();
  }
}
verify().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
