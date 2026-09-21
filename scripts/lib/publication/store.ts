import { randomUUID } from "node:crypto";
import { type PublicCollection, parseCollection } from "@mosa/public-collection";
import type { Client } from "pg";
import { candidate, canonical, parseSelection } from "./candidate";

export const initialRelease = "00000000-0000-4000-8000-000000000000";
export async function locked<T>(client: Client, action: () => Promise<T>): Promise<T> {
  // One database-wide publisher lock, shared by approval, withdrawal and deployment.
  // Acquire before opening a transaction so waiters do not inherit a stale snapshot.
  await client.query("select pg_advisory_lock(1297040193, 1)");
  try {
    return await action();
  } finally {
    await client.query("select pg_advisory_unlock(1297040193, 1)");
  }
}
export async function transaction<T>(client: Client, action: () => Promise<T>): Promise<T> {
  await client.query("begin isolation level repeatable read");
  try {
    const value = await action();
    await client.query("commit");
    return value;
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}
export async function validateRelease(
  client: Client,
  releaseId: string,
): Promise<PublicCollection> {
  const result = await client.query("select * from publication.release where id=$1", [releaseId]);
  const row = result.rows[0];
  if (!row || row.withdrawn_at) throw Error("Unknown or withdrawn release");
  const snapshot = parseCollection(row.snapshot);
  if (snapshot.releaseId !== releaseId) throw Error("Release identity mismatch");
  if (row.selection) {
    const current = await candidate(client, parseSelection(row.selection), releaseId);
    if (
      current.fingerprint !== row.fingerprint ||
      canonical(current.snapshot) !== canonical(snapshot)
    )
      throw Error("Research dependencies changed; prepare and review a new candidate");
  } else if (snapshot.records.length !== 0) throw Error("Unselected research content is forbidden");
  return snapshot;
}
export async function currentRelease(
  client: Client,
  expected?: PublicCollection,
): Promise<PublicCollection> {
  const result =
    await client.query(`select s.desired_release_id, r.approved_at from publication.state s
    join publication.release r on r.id=s.desired_release_id where singleton`);
  const row = result.rows[0];
  if (!row || (!row.approved_at && row.desired_release_id !== initialRelease))
    throw Error("Release has no publication decision");
  const snapshot = await validateRelease(client, row.desired_release_id);
  if (expected && canonical(snapshot) !== canonical(expected))
    throw Error(
      "Snapshot is not the currently authorised release; stale deployments and rollbacks are blocked",
    );
  return snapshot;
}
export async function requireIdle(client: Client) {
  const state = (
    await client.query("select pending_release_id from publication.state where singleton")
  ).rows[0];
  if (state.pending_release_id)
    throw Error(
      "A deployment is unresolved. Cancel or finish the hosting job and record recovery before changing publication.",
    );
}
export async function recover(client: Client, id: string, actor: string, reason: string) {
  const row = await client.query(
    "update publication.state set pending_release_id=null,pending_started_at=null where singleton and pending_release_id=$1 returning desired_release_id",
    [id],
  );
  if (!row.rowCount) throw Error("No matching unresolved deployment");
  await client.query(
    "insert into publication.deployment_recovery(release_id,actor,reason) values($1,$2,$3)",
    [id, actor, reason],
  );
  return { releaseId: row.rows[0].desired_release_id };
}
export async function prepare(client: Client, selection: unknown) {
  const selected = parseSelection(selection);
  const id = randomUUID();
  const result = await candidate(client, selected, id);
  await client.query(
    `insert into publication.release(id,selection,fingerprint,snapshot) values ($1,$2,$3,$4)`,
    [id, selected, result.fingerprint, result.snapshot],
  );
  return result.snapshot;
}
export async function approve(client: Client, id: string, actor: string, authority: string) {
  await requireIdle(client);
  const snapshot = await validateRelease(client, id);
  const result = await client.query(
    `update publication.release set approved_by=$2, authority=$3, approved_at=now()
    where id=$1 and approved_at is null and withdrawn_at is null returning id`,
    [id, actor, authority],
  );
  if (!result.rowCount)
    throw Error(
      "Decision already recorded; prepare a new candidate instead of restoring an old release",
    );
  await client.query("update publication.state set desired_release_id=$1 where singleton", [id]);
  return snapshot;
}
export async function withdraw(client: Client, id: string, actor: string, reason: string) {
  await requireIdle(client);
  const result = await client.query(
    `update publication.release set withdrawn_by=$2, withdrawn_at=now()
    where id=$1 and withdrawn_at is null returning id`,
    [id, actor],
  );
  if (!result.rowCount) throw Error("Unknown or already withdrawn release");
  const desired = (
    await client.query("select desired_release_id from publication.state where singleton")
  ).rows[0].desired_release_id;
  if (desired === id) {
    const emptyId = randomUUID();
    const empty = parseCollection({ schemaVersion: 1, releaseId: emptyId, records: [] });
    await client.query(
      `insert into publication.release(id,snapshot,approved_by,authority,approved_at) values($1,$2,$3,$4,now())`,
      [emptyId, empty, actor, reason],
    );
    await client.query("update publication.state set desired_release_id=$1 where singleton", [
      emptyId,
    ]);
  }
  return currentRelease(client);
}
