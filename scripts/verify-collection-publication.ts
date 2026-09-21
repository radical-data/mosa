import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { candidate, type Selection } from "./lib/publication/candidate";
import {
  approve,
  currentRelease,
  locked,
  prepare,
  recover,
  requireIdle,
  validateRelease,
  withdraw,
} from "./lib/publication/store";
import { getLocalDatabaseUrl } from "./lib/supabase-local";

async function verify() {
  const connectionString =
    process.env.PUBLICATION_TEST_DATABASE_URL ?? (await getLocalDatabaseUrl(process.cwd()));
  if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(connectionString).hostname))
    throw Error("Publication tests require a local database");
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await locked(client, async () => {
      const other = new Client({ connectionString });
      await other.connect();
      try {
        assert.equal(
          (await other.query("select pg_try_advisory_lock(1297040193,1) locked")).rows[0].locked,
          false,
        );
      } finally {
        await other.end();
      }
      await client.query("begin");
      try {
        // Supabase's postgres login is not a superuser. Membership is needed to
        // exercise SET ROLE and is rolled back with the rest of this local test.
        await client.query("grant collection_publisher to current_user");
        async function fails(action: () => Promise<unknown>, pattern: RegExp) {
          await client.query("savepoint expected_failure");
          await assert.rejects(action, pattern);
          await client.query("rollback to savepoint expected_failure");
        }
        const item = (await client.query("select entities.create_item('artefact') id")).rows[0].id;
        const agent = (await client.query("select entities.create_agent('organisation') id"))
          .rows[0].id;
        const source = (
          await client.query(
            "select entities.create_source('institutional_record','https://example.org/catalogue','2026-09-21T00:00:00Z') id",
          )
        ).rows[0].id;
        async function claim(
          subject: string,
          predicate: string,
          literal: string | null,
          object: string | null,
        ) {
          const c = (
            await client.query(
              `insert into knowledge.claim(subject_id,predicate,literal_value,object_entity_id,asserted_by_agent_id,notes)
          values($1,$2,$3,$4,$5,'PRIVATE-NOTE-SENTINEL') returning id`,
              [
                subject,
                predicate,
                literal ? { type: "text", value: literal } : null,
                object,
                agent,
              ],
            )
          ).rows[0].id;
          const evidence = (
            await client.query(
              `insert into knowledge.claim_evidence(claim_id,source_id,relationship,locator,excerpt)
          values($1,$2,'supports','Test field','PRIVATE-EXCERPT-SENTINEL') returning id`,
              [c, source],
            )
          ).rows[0].id;
          return { claim: c, evidence };
        }
        const n = await claim(item, "has_name", "Synthetic object", null);
        const h = await claim(item, "held_by", null, agent);
        const an = await claim(agent, "has_name", "Synthetic institution", null);
        await claim(item, "has_name", "RESTRICTED-NAME-SENTINEL", null);
        const identifier = (
          await client.query(
            `insert into entities.external_identifier(entity_id,namespace,value,source_id) values($1,'test',$2,$3) returning id`,
            [item, randomUUID(), source],
          )
        ).rows[0].id;
        const selection: Selection = {
          itemId: item,
          name: n.evidence,
          holder: h.evidence,
          holderName: an.evidence,
          nameSpeaker: an.evidence,
          holderSpeaker: an.evidence,
          identifier,
        };
        for (const role of ["anon", "authenticated", "explorer_reader"]) {
          await fails(async () => {
            await client.query(`set local role ${role}`);
            await client.query("select * from publication.release");
          }, /permission denied/);
        }
        await client.query("set local role collection_publisher");
        const prepared = await prepare(client, selection);
        assert(!JSON.stringify(prepared).includes("SENTINEL"));
        await fails(() => currentRelease(client, prepared), /not the currently/);
        await approve(client, prepared.releaseId, "Test reviewer", "Synthetic test authority");
        assert.deepEqual(await currentRelease(client, prepared), prepared);
        await fails(
          () => approve(client, prepared.releaseId, "Other reviewer", "Test"),
          /already recorded/,
        );
        await fails(
          () =>
            client.query("update publication.release set snapshot='{}' where id=$1", [
              prepared.releaseId,
            ]),
          /immutable/,
        );
        await client.query("reset role");
        await client.query("update knowledge.claim set literal_value=$2 where id=$1", [
          n.claim,
          { type: "text", value: "Changed name" },
        ]);
        await fails(() => validateRelease(client, prepared.releaseId), /dependencies changed/);
        await client.query("update knowledge.claim set literal_value=$2 where id=$1", [
          n.claim,
          { type: "text", value: "Synthetic object" },
        ]);
        // updated_at is part of the dependency fingerprint: a reverted edit still requires review.
        const second = await prepare(client, selection);
        await approve(client, second.releaseId, "Test reviewer", "Reviewed correction");
        await fails(() => currentRelease(client, prepared), /not the currently/);
        await client.query("update publication.state set pending_release_id=$1 where singleton", [
          second.releaseId,
        ]);
        await fails(() => requireIdle(client), /unresolved/);
        await fails(
          () => withdraw(client, second.releaseId, "Test reviewer", "Test withdrawal"),
          /unresolved/,
        );
        await recover(
          client,
          second.releaseId,
          "Test operator",
          "Confirmed no hosting job remains",
        );
        const empty = await withdraw(client, second.releaseId, "Test reviewer", "Test withdrawal");
        assert.equal(empty.records.length, 0);
        assert.deepEqual(await currentRelease(client, empty), empty);
        await fails(() => currentRelease(client, second), /not the currently/);
        await fails(
          () => approve(client, second.releaseId, "Test reviewer", "Restore"),
          /withdrawn/,
        );
        await client.query(
          `insert into knowledge.claim_evidence(claim_id,source_id,relationship,locator,excerpt)
        values($1,$2,'qualifies','Qualifier','possibly')`,
          [h.claim, source],
        );
        await fails(() => candidate(client, selection, randomUUID()), /unqualified/);
        console.log(
          "Verified publication: private permissions, candidate approval, immutable decisions, stale dependencies, interrupted deployment recovery and withdrawal. All test writes rolled back.",
        );
      } finally {
        await client.query("rollback");
      }
    });
  } finally {
    await client.end();
  }
}
verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
