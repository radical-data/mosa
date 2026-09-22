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
    await admin.query("select pgmq.set_vt('research_jobs',$1,0)", [lease.message_id]);
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
    const { enqueueLead, performDiscovery, controlLead } = await import(
      "../apps/explorer/src/lib/sources/discovery.js"
    );
    const { performPreparation } = await import("../apps/explorer/src/lib/sources/preparation.js");
    const leadForm = (extra: Record<string, string> = {}) => {
      const f = new FormData();
      for (const [k, v] of Object.entries({
        requestId: randomUUID(),
        institution: "Synthetic museum",
        description: "wooden figure",
        maxRequests: "20",
        maxModelCalls: "4",
        minutes: "30",
        consent: "yes",
        ...extra,
      }))
        f.set(k, v);
      return f;
    };
    await assert.rejects(
      () => enqueueLead(admin, actor, leadForm({ maxRequests: "0" })),
      /positive limits/,
    );
    const lead = await enqueueLead(admin, actor, leadForm());
    let searches = 0,
      assessments = 0,
      preparations = 0;
    let foundUrl = `https://example.org/discovery-${actor}`;
    const handlers = {
      capture: handler,
      discover: (p: Pool, j: Parameters<typeof performDiscovery>[1]) =>
        performDiscovery(
          p,
          j,
          async () => {
            searches++;
            return [
              { url: foundUrl, title: "Wooden figure", description: "Synthetic museum catalogue" },
            ];
          },
          async () => {
            assessments++;
            return {
              model: "synthetic-model",
              responseId: "decision",
              usage: {},
              value: {
                decision: "candidate",
                index: 0,
                reason: "Institution and description agree; identity still requires review",
                query: null,
              },
            };
          },
        ),
      prepare: (p: Pool, j: Parameters<typeof performPreparation>[1]) =>
        performPreparation(p, j, async () => {
          preparations++;
          return {
            model: "synthetic-model",
            responseId: "proposal",
            usage: {},
            value: {
              statement: { predicate: "described_as", value: "wooden figure", quote: wording },
              observations: "Researcher must confirm identity.",
            },
          };
        }),
    };
    await runOne(worker, handlers);
    await controlLead(admin, lead, "pause");
    await runOne(worker, handlers);
    assert.equal(assessments, 0, "Pause prevents the next external operation");
    await controlLead(admin, lead, "resume");
    for (let i = 0; i < 12; i++) await runOne(worker, handlers);
    const leadResult = (await admin.query("select * from capture.job where id=$1", [lead])).rows[0];
    assert.equal(leadResult.status, "succeeded");
    assert.equal(leadResult.result.stoppingReason, "candidate_ready");
    assert(leadResult.result.draftId);
    assert.equal(searches, 1);
    assert.equal(assessments, 1);
    assert.equal(preparations, 1);
    assert.equal(leadResult.requests_used, 8);
    assert.equal(leadResult.tokens_reserved, 140000);
    const sameLead = await enqueueLead(admin, actor, leadForm());
    for (let i = 0; i < 12; i++) await runOne(worker, handlers);
    assert.equal(
      (await admin.query("select result from capture.job where id=$1", [sameLead])).rows[0].result
        .draftId,
      leadResult.result.draftId,
      "Repeated discovery reuses the preserved source and candidate",
    );
    assert.equal(preparations, 1);
    const small = await enqueueLead(admin, actor, leadForm({ maxRequests: "1" }));
    for (let i = 0; i < 4; i++) await runOne(worker, handlers);
    const exhausted = (await admin.query("select * from capture.job where id=$1", [small])).rows[0];
    assert.match(exhausted.error, /budget_exhausted/);
    assert.equal(exhausted.requests_used, 1);
    const humanLead = await enqueueLead(admin, actor, leadForm());
    await controlLead(admin, humanLead, "pause");
    await controlLead(admin, humanLead, "choose", foundUrl);
    for (let i = 0; i < 8; i++) await runOne(worker, handlers);
    assert.equal(
      (await admin.query("select result from capture.job where id=$1", [humanLead])).rows[0].result
        .draftId,
      leadResult.result.draftId,
      "Human-to-agent hand-off uses existing records",
    );
    foundUrl = `https://example.org/concurrent-${actor}`;
    const concurrentA = await enqueueLead(admin, actor, leadForm());
    const concurrentB = await enqueueLead(admin, actor, leadForm());
    for (let i = 0; i < 24; i++) await runOne(worker, handlers);
    const pair = (
      await admin.query("select result from capture.job where id=any($1::uuid[])", [
        [concurrentA, concurrentB],
      ])
    ).rows;
    assert.equal(
      pair[0].result.draftId,
      pair[1].result.draftId,
      "Concurrent leads reuse in-flight capture and preparation",
    );
    assert(pair[0].result.draftId);
    console.log(
      "Verified discovery: pause/resume, budgets, source and candidate reuse, and human hand-off.",
    );
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
