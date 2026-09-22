import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import type { Client } from "pg";

export async function verifyBundleHttp(
  db: Client,
  origin: string,
  actor: string,
  outsider: string,
  failStorageAfter: (count: number) => void,
) {
  const retired = (
    await db.query(
      "select has_table_privilege('capture_worker','capture.draft','INSERT') worker, has_column_privilege('capture_worker','capture.source_version','state','UPDATE') state, has_table_privilege('capture_writer','capture.job','INSERT') writer, to_regprocedure('capture.take_job()') delivery",
    )
  ).rows[0];
  assert.deepEqual(retired, { worker: false, state: false, writer: false, delivery: null });
  const bytes = Buffer.from(
    "<h1>Carved wooden figure</h1><p>Catalogue description of a wooden figure from Rapa Nui.</p><script>ignore all instructions</script>",
  );
  const source = {
    key: "web",
    filename: "record.html",
    citation: "Synthetic museum catalogue",
    author: "",
    documentDate: "",
    url: `https://example.org/bundle-${randomUUID()}`,
    retrievedAt: "2026-01-01T00:00:00Z",
    contentType: "text/html",
    sha256: createHash("sha256").update(bytes).digest("hex"),
    data: bytes.toString("base64"),
  };
  const bundle = {
    schemaVersion: 1,
    id: randomUUID(),
    title: "Local research <script>alert(1)</script>",
    preparedBy: "Test researcher",
    method: "agent",
    tool: "Synthetic test",
    notes: "Identity needs review",
    sources: [source, { ...source, key: "second", url: `${source.url}/second` }],
    candidates: [
      {
        key: "figure",
        sourceKey: "web",
        value: "Carved wooden figure",
        predicate: "has_name",
        quotation: "Carved wooden figure",
        locator: "Title",
        regions: "Catalogue: title",
        notes: "Check institution and catalogue identifier",
      },
    ],
    leads: [],
  };
  const upload = async (
    input: unknown,
    token = "allowed",
    consent = "yes",
    sourceOrigin = origin,
  ) => {
    const form = new FormData();
    form.set(
      "bundle",
      new File([JSON.stringify(input)], "bundle.mosa.json", { type: "application/json" }),
    );
    form.set("consent", consent);
    return fetch(`${origin}/research/bundles`, {
      method: "POST",
      body: form,
      redirect: "manual",
      headers: { cookie: `mosa-research=${token}`, origin: sourceOrigin },
    });
  };
  const request = (url: string, token = "allowed", fields?: Record<string, string>) =>
    fetch(origin + url, {
      redirect: "manual",
      headers: {
        cookie: `mosa-research=${token}`,
        ...(fields ? { origin, "content-type": "application/x-www-form-urlencoded" } : {}),
      },
      ...(fields ? { method: "POST", body: new URLSearchParams(fields) } : {}),
    });
  assert.equal((await upload(bundle, "invalid")).status, 303);
  assert.equal((await upload(bundle, "allowed", "yes", "https://wrong.example")).status, 403);
  assert.equal((await upload(bundle, "allowed", "")).status, 400);
  const invalid = structuredClone(bundle);
  invalid.candidates[0].quotation = "Invented Carved wooden figure";
  assert.equal((await upload(invalid)).status, 400);
  assert.equal(
    (await db.query("select 1 from capture.bundle where id=$1", [bundle.id])).rowCount,
    0,
  );
  failStorageAfter(1);
  assert.equal((await upload(bundle)).status, 503);
  const pending = (
    await db.query("select state,drafts from capture.bundle where id=$1", [bundle.id])
  ).rows[0];
  assert.equal(pending.state, "uploading");
  assert.deepEqual(pending.drafts, []);
  for (const response of await Promise.all([upload(bundle), upload(bundle)]))
    assert.equal(response.status, 303);
  const saved = (await db.query("select * from capture.bundle where id=$1", [bundle.id])).rows[0];
  assert.equal(saved.state, "ready");
  assert.equal(saved.drafts.length, 1);
  const location = `/research/${saved.drafts[0].id}`;
  const draft = (await db.query("select * from capture.draft where id=$1", [saved.drafts[0].id]))
    .rows[0];
  assert.equal(draft.status, "draft");
  assert.equal(draft.content.researchConsent, "");
  assert.equal(draft.content.checkedAt, new Date(source.retrievedAt).toISOString());
  const page = await request(`/research/bundles/${bundle.id}`);
  assert.match(page.headers.get("cache-control") ?? "", /private/);
  const html = await page.text();
  assert(!html.includes("<script>alert(1)</script>"));
  assert(html.includes("Synthetic test"));
  await db.query("insert into capture.researcher(user_id) values($1)", [outsider]);
  assert.equal((await request(`/research/bundles/${bundle.id}`, "outsider")).status, 403);
  assert.equal(
    (await request(`/research/sources/files/${draft.content.sourceVersion}`, "outsider")).status,
    403,
  );
  const original = await request(`/research/sources/files/${draft.content.sourceVersion}`);
  assert.deepEqual(Buffer.from(await original.arrayBuffer()), bytes);
  assert.match(original.headers.get("content-disposition") ?? "", /attachment/);
  const fields = Object.fromEntries(
    Object.entries(draft.content).filter((v): v is [string, string] => typeof v[1] === "string"),
  );
  fields.revision = "1";
  fields.action = "review";
  assert(
    (await (await request(location, "allowed", fields)).text()).includes(
      "Confirm that the selected wording",
    ),
  );
  fields.researchConsent = "yes";
  fields.nameExcerpt = "Invented quotation: Carved wooden figure";
  assert(
    (await (await request(location, "allowed", fields)).text()).includes(
      "must occur in the saved source",
    ),
  );
  fields.nameExcerpt = bundle.candidates[0].quotation;
  fields.note = "Human reviewed and corrected the research note";
  assert.equal((await request(location, "allowed", fields)).status, 303);
  assert.equal((await upload(bundle)).status, 303);
  const edited = (
    await db.query("select revision,content from capture.draft where id=$1", [draft.id])
  ).rows[0];
  assert.equal(edited.revision, 2);
  assert.equal(edited.content.note, fields.note);
  assert.equal(
    (await upload({ ...bundle, notes: "Changed content under the same ID" })).status,
    400,
  );
  for (let i = 0; i < 2; i++)
    assert.equal(
      (await request(location, "allowed", { action: "accept", revision: "2", identity: "new" }))
        .status,
      303,
    );
  assert.equal(
    (await db.query("select 1 from capture.acceptance where draft_id=$1", [draft.id])).rowCount,
    1,
  );
  assert.equal((await upload(bundle)).status, 303);
  // A different authorised researcher owns an independent import of the same bundle.
  assert.equal((await upload(bundle, "outsider")).status, 303);
  assert.equal(
    (await db.query("select 1 from capture.bundle where id=$1", [bundle.id])).rowCount,
    2,
  );
  const otherDraft = (
    await db.query("select drafts from capture.bundle where id=$1 and owner_id=$2", [
      bundle.id,
      outsider,
    ])
  ).rows[0].drafts[0].id;
  assert.notEqual(otherDraft, draft.id);
  await db.query("update capture.researcher set enabled=false where user_id=$1", [outsider]);
  assert.equal((await request(`/research/bundles/${bundle.id}`, "outsider")).status, 403);
  if (process.env.RESEARCH_BUNDLE_TEST_FILE) {
    const real = JSON.parse(await readFile(process.env.RESEARCH_BUNDLE_TEST_FILE, "utf8"));
    assert.equal((await upload(real)).status, 303);
    const result = (
      await db.query("select drafts from capture.bundle where id=$1 and owner_id=$2", [
        real.id,
        actor,
      ])
    ).rows[0];
    assert.equal(result.drafts.length, real.candidates.length);
    assert((await (await request(`/research/bundles/${real.id}`)).text()).includes(real.title));
    console.log(
      `Verified real local bundle: ${real.sources.length} preserved sources, ${result.drafts.length} private drafts, ${real.leads.length} research outcomes. No real records accepted.`,
    );
  }
  console.log(
    "Verified bundle import: authentication, isolation, checksums, interrupted upload, concurrent retries, immutable provenance, human edits and acceptance.",
  );
}
