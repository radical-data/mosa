import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { prepare } from "./lib/publication/store";
import { getLocalDatabaseUrl } from "./lib/supabase-local";
import { verifyCaptureUpgrade } from "./lib/verify-capture-upgrade";

async function verify() {
  const { readContent } = await import("../apps/explorer/src/lib/capture/model.js");
  const { catalogueChoices, saveCatalogue } = await import(
    "../apps/explorer/src/lib/capture/catalogues.js"
  );
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
      await fails(
        () => client.query("insert into entities.catalogue(label) values('Forbidden')"),
        /permission denied/,
      );
      await fails(() => client.query("select * from capture.draft"), /permission denied/);
      await fails(
        () => client.query("select entities.create_item('artefact')"),
        /permission denied/,
      );
      await client.query("reset role");
    }
    await client.query("set local role capture_writer");
    await requireResearcher(client, actor);
    const catalogueForm = new FormData();
    catalogueForm.set("label", "Capture test catalogue");
    await saveCatalogue(client, catalogueForm);
    const catalogue = (await catalogueChoices(client)).find(
      (c) => c.label === "Capture test catalogue",
    );
    assert(catalogue);
    assert.match(catalogue.namespace, /^catalogue-/);
    catalogueForm.set("label", "  CAPTURE   TEST CATALOGUE  ");
    await fails(() => saveCatalogue(client, catalogueForm), /already exists/);
    await fails(
      () =>
        client.query("update entities.catalogue set namespace='changed' where namespace=$1", [
          catalogue.namespace,
        ]),
      /permission denied/,
    );
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
      namespace: catalogue.namespace,
      identifier: randomUUID(),
      note: "PRIVATE-DRAFT-NOTE",
    }))
      form.set(key, value);
    const content = readContent(form);
    await fails(
      () => createDraft(client, actor, randomUUID(), { ...content, namespace: "unregistered" }),
      /Choose an existing catalogue/,
    );
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
    catalogueForm.set("namespace", catalogue.namespace);
    catalogueForm.set("previousLabel", catalogue.label ?? "");
    catalogueForm.set("label", "Renamed test catalogue");
    await saveCatalogue(client, catalogueForm);
    assert.equal((await identityMatches(client, content))[0].id, accepted.item_id);
    await fails(() => saveCatalogue(client, catalogueForm), /changed/);
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
    assert("identifier" in publication.records[0]);
    assert.equal(publication.records[0].identifier.label, "Renamed test catalogue");
    assert.equal(selected.catalogue, catalogue.namespace);
    assert(!JSON.stringify(publication).includes("PRIVATE-DRAFT-NOTE"));
    await fails(() => client.query("select * from capture.draft"), /permission denied/);
    await client.query("reset role");
    await client.query("set local role capture_writer");

    // A source can describe several objects. It is a review suggestion, not an
    // identity conflict when a different exact catalogue identifier is given.
    const sharedSource = {
      ...content,
      name: "Second synthetic object on the same page",
      nameExcerpt: "Second synthetic object on the same page",
      identifier: randomUUID(),
    };
    const sharedDraft = await createDraft(client, actor, randomUUID(), sharedSource);
    const sharedReview = await changeDraft(
      client,
      actor,
      sharedDraft.id,
      1,
      "review",
      sharedSource,
    );
    const sharedMatches = await identityMatches(client, sharedSource);
    assert(sharedMatches.some((match) => !match.exact && match.id === accepted.item_id));
    const sharedAccepted = await changeDraft(
      client,
      actor,
      sharedDraft.id,
      sharedReview.revision,
      "accept",
      undefined,
      "new",
    );
    assert.notEqual(sharedAccepted.item_id, accepted.item_id);

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

    // Multiple citations remain reusable, but require an explicit choice.
    await client.query("reset role");
    const extraCitation = (
      await client.query(
        `
      insert into knowledge.claim_evidence(claim_id,source_id,relationship,locator,excerpt)
      select claim_id,source_id,'supports','Alternative heading','Synthetic museum'
      from knowledge.claim_evidence where id=$1 returning id`,
        [museum.evidenceId],
      )
    ).rows[0].id;
    await client.query("set local role capture_writer");
    const multiple = (await agentChoices(client)).find((entry) => entry.id === museum.id);
    assert.equal(multiple?.citations.length, 2);
    assert(multiple?.context.includes(content.url));
    const multiContent = {
      ...reusedContent,
      identifier: randomUUID(),
      url: `https://example.org/multi-${actor}`,
    };
    const multi = await createDraft(client, actor, randomUUID(), multiContent);
    await fails(
      () => changeDraft(client, actor, multi.id, 1, "review", multiContent),
      /Choose which existing citation/,
    );
    await fails(
      () =>
        changeDraft(client, actor, multi.id, 1, "review", {
          ...multiContent,
          holderNameCitation: randomUUID(),
        }),
      /belongs to another record/,
    );
    const multiReview = await changeDraft(client, actor, multi.id, 1, "review", {
      ...multiContent,
      holderNameCitation: extraCitation,
    });
    assert.equal(multiReview.content.holderNameEvidenceId, extraCitation);
    await changeDraft(client, actor, multi.id, 2, "accept", undefined, "new");
    // Different source wording must create its own evidence, not show a reused citation.
    const renamedContent = {
      ...multiContent,
      holder: "An alternative institution name",
      holderNameLocator: "Heading",
      holderNameExcerpt: "An alternative institution name",
      holderNameCitation: extraCitation,
    };
    const renamed = await createDraft(client, actor, randomUUID(), renamedContent);
    const renamedReview = await changeDraft(client, actor, renamed.id, 1, "review", renamedContent);
    assert.equal(renamedReview.content.holderNameEvidenceId, undefined);

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
    await client.query("reset role");
    await verifyCaptureUpgrade(client);
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
