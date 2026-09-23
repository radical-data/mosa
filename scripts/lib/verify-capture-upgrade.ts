import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { PublicCollection } from "@mosa/public-collection";
import type { Client } from "pg";
import { candidate, digest, parseSelection } from "./publication/candidate";
import { approve, prepare, validateRelease, withdraw } from "./publication/store";

// Called only inside the disposable capture test's transaction. Reconstruct the
// previous schema and real accepted fixtures, then run the actual upgrade SQL.
export async function verifyCaptureUpgrade(client: Client) {
  await client.query("savepoint upgrade_fixture");
  const migration = async (name: string) =>
    (await readFile(path.resolve(__dirname, "../../supabase/migrations", name), "utf8"))
      .replace(/^begin;\s*/i, "")
      .replace(/commit;\s*$/i, "");
  const accepted = (
    await client.query("select count(*) from capture.draft where status='accepted'")
  ).rows[0].count;
  await client.query("drop view capture.publication_candidate");
  await client.query("drop table capture.acceptance");
  await client.query("alter table knowledge.claim_evidence drop column evidence_mode");
  await client.query(await migration("20260922100000_capture_reuse_label_evidence.sql"));
  const previous = (
    await client.query("select * from capture.publication_candidate order by draft_id")
  ).rows;
  assert(previous.length > 1, "Upgrade needs both original and reused-name fixtures");
  const selections = previous
    .filter(
      (row, index, rows) =>
        rows.findIndex((other) => other.selection.itemId === row.selection.itemId) === index,
    )
    .slice(0, 2)
    .map((row) => parseSelection(row.selection));
  assert.equal(selections.length, 2);
  await client.query(
    "update knowledge.claim_evidence set locator='Whole catalogue record', excerpt=null where id=$1",
    [selections[0].name],
  );
  // Generate approvals against the old schema, before the mode column exists.
  // Cover both historical single-card and array selection representations.
  const releases: PublicCollection[] = [];
  for (const selection of [selections[0], selections]) {
    const id = randomUUID();
    const results = await Promise.all(
      (Array.isArray(selection) ? selection : [selection]).map((entry) =>
        candidate(client, entry, id),
      ),
    );
    const snapshot: PublicCollection = {
      schemaVersion: 1,
      releaseId: id,
      records: results.flatMap((entry) => entry.snapshot.records),
    };
    const fingerprint = Array.isArray(selection)
      ? digest(results.map((entry) => entry.fingerprint))
      : results[0].fingerprint;
    await client.query(
      "insert into publication.release(id,selection,snapshot,fingerprint) values($1,$2,$3,$4)",
      [id, JSON.stringify(selection), snapshot, fingerprint],
    );
    await approve(client, id, "Upgrade test", "Preserve the existing decision");
    releases.push(snapshot);
  }
  const whole = (
    await client.query(`update knowledge.claim_evidence set locator='Whole catalogue record', excerpt=null
    where id=(select e.id from knowledge.claim_evidence e join knowledge.claim c on c.id=e.claim_id
      where c.predicate='refers_to' limit 1) returning id`)
  ).rows[0].id;
  await client.query(await migration("20260922130000_capture_acceptance_references.sql"));
  assert.equal(
    (await client.query("select count(*) from capture.acceptance")).rows[0].count,
    accepted,
  );
  for (const row of previous) {
    const current = (
      await client.query("select selection from capture.publication_candidate where draft_id=$1", [
        row.draft_id,
      ])
    ).rows[0];
    assert(current, "Accepted draft disappeared from publication preparation");
    const { catalogue, ...references } = current.selection;
    assert(catalogue);
    assert.deepEqual(references, row.selection);
  }
  assert.equal(
    (await client.query("select evidence_mode from knowledge.claim_evidence where id=$1", [whole]))
      .rows[0].evidence_mode,
    "whole_document",
  );
  for (const release of releases)
    assert.deepEqual(await validateRelease(client, release.releaseId), release);
  // A catalogue rename does not rewrite or invalidate an old publication decision.
  await client.query(
    "update entities.catalogue set label=label || ' updated' where label is not null",
  );
  for (const release of releases)
    assert.deepEqual(await validateRelease(client, release.releaseId), release);
  const retained = await withdraw(
    client,
    releases[1].releaseId,
    "Upgrade test",
    "Remove one record",
    selections[0].itemId,
  );
  assert.equal(retained.records.length, 1);
  assert("identifier" in retained.records[0]);
  assert.equal(retained.records[0].identifier.label, undefined);
  await validateRelease(client, retained.releaseId);
  const newlyPrepared = await prepare(client, selections[1]);
  assert("identifier" in newlyPrepared.records[0]);
  assert(newlyPrepared.records[0].identifier.label?.endsWith(" updated"));
  assert.equal(
    (
      await client.query("select approved_at from publication.release where id=$1", [
        newlyPrepared.releaseId,
      ])
    ).rows[0].approved_at,
    null,
  );
  // Legacy fingerprints still detect changes to the evidence they approved.
  await client.query(
    "update knowledge.claim_evidence set locator=locator || ' changed' where id=$1",
    [selections[0].name],
  );
  await assert.rejects(
    () => validateRelease(client, releases[0].releaseId),
    /dependencies changed/,
  );
  await client.query("rollback to savepoint upgrade_fixture");
  console.log(
    "Verified upgrade: accepted drafts, legacy evidence, unchanged approvals and individual withdrawal.",
  );
}
