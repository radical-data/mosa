import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { prepare } from "./lib/publication/store";
import { getLocalDatabaseUrl } from "./lib/supabase-local";

async function verify() {
  const { readContent } = await import("../apps/explorer/src/lib/capture/model.js");
  const { agentChoices, changeDraft, createDraft, getDraft, identityMatches, requireResearcher } =
    await import("../apps/explorer/src/lib/capture/store.js");
  const connectionString =
    process.env.CAPTURE_TEST_DATABASE_URL ?? (await getLocalDatabaseUrl(process.cwd()));
  if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(connectionString).hostname))
    throw Error("Capture tests require a disposable local database");
  const client = new Client({ connectionString });
  await client.connect();
  await client.query("begin");
  try {
    const grant = (
      await client.query("select format('grant capture_writer to %I',current_user) statement")
    ).rows[0].statement;
    await client.query(grant);
    const actor = randomUUID(),
      other = randomUUID();
    await client.query("insert into capture.researcher(user_id) values($1),($2)", [actor, other]);
    async function fails(action: () => Promise<unknown>, pattern: RegExp) {
      await client.query("savepoint expected_failure");
      await assert.rejects(action, pattern);
      await client.query("rollback to savepoint expected_failure");
    }
    for (const role of ["anon", "authenticated", "explorer_reader"]) {
      await client.query(`set local role ${role}`);
      await fails(() => client.query("select * from capture.draft"), /permission denied/);
      await fails(
        () => client.query("select entities.create_item('artefact')"),
        /permission denied/,
      );
      await client.query("reset role");
    }
    await client.query("set local role capture_writer");
    await requireResearcher(client, actor);
    await fails(() => client.query("select * from publication.state"), /permission denied/);
    await fails(
      () => client.query("update capture.researcher set enabled=false"),
      /permission denied/,
    );
    const form = new FormData();
    for (const [key, value] of Object.entries({
      url: "https://example.org/capture-test",
      name: "Synthetic capture object",
      nameLocator: "Name",
      nameExcerpt: "Synthetic capture object",
      holder: "Synthetic museum",
      holderLocator: "Holder",
      holderExcerpt: "Held at Synthetic museum",
      holderNameLocator: "Publisher heading",
      holderNameExcerpt: "Synthetic museum",
      speakerMode: "holder",
      namespace: "capture-test",
      identifier: randomUUID(),
      note: "PRIVATE-DRAFT-NOTE",
    }))
      form.set(key, value);
    const content = readContent(form);
    const request = randomUUID();
    const draft = await createDraft(client, actor, request, content);
    assert.equal((await createDraft(client, actor, request, content)).id, draft.id);
    await requireResearcher(client, other);
    assert.equal((await client.query("select id from capture.draft")).rowCount, 0);
    await fails(() => getDraft(client, other, draft.id), /not found/);
    await requireResearcher(client, actor);
    const review = await changeDraft(client, actor, draft.id, 1, "review", content);
    await fails(() => changeDraft(client, actor, draft.id, 1, "save", content), /another tab/);
    // A promotion audit failure after canonical writes rolls back everything.
    await client.query("reset role");
    await client.query(
      `create function capture.fail_accept_test() returns trigger language plpgsql as $$begin if new.status='accepted' then raise exception 'test audit failure'; end if;return new;end$$`,
    );
    await client.query(
      "create trigger fail_accept_test before insert on capture.revision for each row execute function capture.fail_accept_test()",
    );
    await client.query("set local role capture_writer");
    const before = (await client.query("select count(*) from entities.entity")).rows[0].count;
    await fails(
      () => changeDraft(client, actor, draft.id, review.revision, "accept", undefined, "new"),
      /test audit failure/,
    );
    assert.equal(
      (await client.query("select count(*) from entities.entity")).rows[0].count,
      before,
    );
    assert.equal((await getDraft(client, actor, draft.id)).status, "review");
    await client.query("reset role");
    await client.query("drop trigger fail_accept_test on capture.revision");
    await client.query("set local role capture_writer");
    const accepted = await changeDraft(
      client,
      actor,
      draft.id,
      review.revision,
      "accept",
      undefined,
      "new",
    );
    assert.ok(accepted.item_id);
    const count = (await client.query("select count(*) from knowledge.claim")).rows[0].count;
    assert.equal(
      (await changeDraft(client, actor, draft.id, review.revision, "accept", undefined, "new"))
        .item_id,
      accepted.item_id,
    );
    assert.equal((await client.query("select count(*) from knowledge.claim")).rows[0].count, count);
    assert.equal((await identityMatches(client, content))[0].id, accepted.item_id);
    await fails(
      () => client.query("select * from capture.publication_candidate"),
      /permission denied/,
    );
    await client.query("reset role");
    const publisherGrant = (
      await client.query("select format('grant collection_publisher to %I',current_user) statement")
    ).rows[0].statement;
    await client.query(publisherGrant);
    await client.query("set local role collection_publisher");
    const selected = (
      await client.query("select selection from capture.publication_candidate where draft_id=$1", [
        draft.id,
      ])
    ).rows[0].selection;
    const publication = await prepare(client, selected);
    assert.equal(publication.records[0].id, accepted.item_id);
    assert(!JSON.stringify(publication).includes("PRIVATE-DRAFT-NOTE"));
    await fails(() => client.query("select * from capture.draft"), /permission denied/);
    await client.query("reset role");
    await client.query("set local role capture_writer");

    const choices = await agentChoices(client);
    const museum = choices.find((a) => a.label === "Synthetic museum");
    assert(museum?.evidenceId, "Institution choices must expose readable, evidenced names");
    const match = (await identityMatches(client, content))[0];
    assert.equal(match.label, "Synthetic capture object");
    assert.equal(match.holder, "Synthetic museum");
    const reusedContent = {
      ...content,
      url: `https://example.org/reused-${actor}`,
      identifier: randomUUID(),
      holderIdentity: museum.id,
      holder: "",
      holderNameLocator: "",
      holderNameExcerpt: "",
      interpretation: "PRIVATE-INTERPRETATION",
    };
    const reused = await createDraft(client, actor, randomUUID(), reusedContent);
    const reusedReview = await changeDraft(client, actor, reused.id, 1, "review", reusedContent);
    assert.equal(reusedReview.content.holderNameEvidenceId, museum.evidenceId);
    assert.equal(reusedReview.content.holder, museum.label);
    await client.query("savepoint changed_name_evidence");
    await client.query("reset role");
    await client.query("update knowledge.claim_evidence set relationship='mentions' where id=$1", [
      museum.evidenceId,
    ]);
    await client.query("set local role capture_writer");
    await fails(
      () => changeDraft(client, actor, reused.id, 2, "accept", undefined, "new"),
      /evidence changed/,
    );
    await client.query("rollback to savepoint changed_name_evidence");
    await changeDraft(client, actor, reused.id, 2, "accept", undefined, "new");
    assert.equal(
      (
        await client.query(
          "select count(*) from knowledge.claim where subject_id=$1 and predicate='has_name'",
          [museum.id],
        )
      ).rows[0].count,
      "1",
    );
    await client.query("reset role");
    await client.query("set local role collection_publisher");
    const reusedSelection = (
      await client.query("select selection from capture.publication_candidate where draft_id=$1", [
        reused.id,
      ])
    ).rows[0].selection;
    assert.equal(reusedSelection.holderName, museum.evidenceId);
    assert(
      !JSON.stringify(await prepare(client, reusedSelection)).includes("PRIVATE-INTERPRETATION"),
    );
    await client.query("reset role");
    await client.query("set local role capture_writer");

    const sparseContent = {
      ...content,
      url: `https://example.org/classification-${actor}`,
      name: "figure ('moai kavakava')",
      nameBasis: "classified_as",
      nameEvidenceMode: "whole",
      holderStatus: "unknown",
      speakerMode: "unknown",
      namespace: "",
      identifier: "",
    };
    const sparse = await createDraft(client, actor, randomUUID(), sparseContent);
    await changeDraft(client, actor, sparse.id, 1, "review", sparseContent);
    const sparseAccepted = await changeDraft(
      client,
      actor,
      sparse.id,
      2,
      "accept",
      undefined,
      "new",
    );
    const sparseClaims = (
      await client.query("select predicate from knowledge.claim where subject_id=$1", [
        sparseAccepted.item_id,
      ])
    ).rows;
    assert.deepEqual(
      sparseClaims.map((c) => c.predicate),
      ["classified_as"],
    );
    await client.query("reset role");
    await client.query("set local role collection_publisher");
    assert.equal(
      (
        await client.query("select * from capture.publication_candidate where draft_id=$1", [
          sparse.id,
        ])
      ).rowCount,
      0,
    );
    await client.query("reset role");
    await client.query("set local role capture_writer");

    const duplicate = await createDraft(client, actor, randomUUID(), content);
    await changeDraft(client, actor, duplicate.id, 1, "review", content);
    await fails(
      () => changeDraft(client, actor, duplicate.id, 2, "accept", undefined, "new"),
      /matching object/,
    );
    const linked = await changeDraft(
      client,
      actor,
      duplicate.id,
      2,
      "accept",
      undefined,
      accepted.item_id,
    );
    assert.equal(linked.item_id, accepted.item_id);
    for (const action of ["defer", "reject", "delete"]) {
      const d = await createDraft(client, actor, randomUUID(), content);
      const before = (await client.query("select count(*) from knowledge.claim")).rows[0].count;
      await changeDraft(client, actor, d.id, 1, action);
      assert.equal(
        (await client.query("select count(*) from knowledge.claim")).rows[0].count,
        before,
      );
    }
    await client.query("reset role");
    await client.query("update capture.researcher set enabled=false where user_id=$1", [actor]);
    await client.query("set local role capture_writer");
    await fails(() => requireResearcher(client, actor), /access is required/);
    assert.equal((await client.query("select id from capture.draft")).rowCount, 0);
    console.log(
      "Verified source capture: isolation, access, revisions, atomic promotion, identity matching and retries.",
    );
  } finally {
    await client.query("rollback");
    await client.end();
  }
}
verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
