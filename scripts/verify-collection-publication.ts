import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { importInTransaction } from "@mosa/object-dossier/import";
import type { DossierPacket } from "@mosa/object-dossier/packet";
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
        // Resolve and quote the name explicitly: the Supabase image crashes
        // when GRANT receives the CURRENT_USER role specifier.
        const grant = await client.query(
          "select format('grant collection_publisher to %I', current_user) as statement",
        );
        await client.query(grant.rows[0].statement);
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
          catalogue: "test",
        };
        await client.query(
          "update entities.catalogue set label='Test catalogue' where namespace='test'",
        );
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
        await client.query("savepoint renamed_catalogue");
        await client.query(
          "update entities.catalogue set label='Renamed catalogue' where namespace='test'",
        );
        await fails(() => validateRelease(client, prepared.releaseId), /dependencies changed/);
        await client.query("rollback to savepoint renamed_catalogue");
        await client.query("savepoint changed_mode");
        await client.query(
          "update knowledge.claim_evidence set evidence_mode='whole_document' where id=$1",
          [n.evidence],
        );
        await fails(() => validateRelease(client, prepared.releaseId), /dependencies changed/);
        await client.query("rollback to savepoint changed_mode");
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
        const anotherItem = (await client.query("select entities.create_item('artefact') id"))
          .rows[0].id;
        const anotherName = await claim(anotherItem, "has_name", "Second synthetic object", null);
        const anotherHolder = await claim(anotherItem, "held_by", null, agent);
        const anotherIdentifier = (
          await client.query(
            "insert into entities.external_identifier(entity_id,namespace,value,source_id) values($1,'test','second',$2) returning id",
            [anotherItem, source],
          )
        ).rows[0].id;
        const anotherSelection = {
          ...selection,
          itemId: anotherItem,
          name: anotherName.evidence,
          holder: anotherHolder.evidence,
          identifier: anotherIdentifier,
        };
        await fails(() => prepare(client, [selection, selection]), /Duplicate/);
        const pair = await prepare(client, [selection, anotherSelection]);
        await approve(client, pair.releaseId, "Test reviewer", "Two selected records");
        assert.equal((await currentRelease(client)).records.length, 2);
        const remaining = await withdraw(
          client,
          pair.releaseId,
          "Test reviewer",
          "Remove second item",
          anotherItem,
        );
        assert.deepEqual(
          remaining.records.map((record) => record.id),
          [item],
        );
        assert.deepEqual(await currentRelease(client), remaining);
        await client.query(
          `insert into knowledge.claim_evidence(claim_id,source_id,relationship,locator,excerpt)
        values($1,$2,'qualifies','Qualifier','possibly')`,
          [h.claim, source],
        );
        await fails(() => candidate(client, selection, randomUUID()), /unqualified/);
        const fullPacket: DossierPacket = {
          schemaVersion: 4,
          dataset: { key: `publication-dossier-${randomUUID()}`, version: "1" },
          objects: [{ key: "item:one" }],
          agents: [],
          places: [],
          events: [{ key: "event:one", kind: "relocation" }],
          sources: [
            {
              key: "source:one",
              kind: "institutional_record",
              url: "https://example.org/full-dossier",
              publicUrl: "https://example.org/full-dossier",
              citation: "Synthetic source",
              retrievedAt: "2026-09-23T00:00:00Z",
              about: ["item:one"],
            },
          ],
          claims: [
            {
              key: "claim:name",
              subject: "item:one",
              predicate: "has_name",
              literal: { type: "text", value: "Full synthetic dossier" },
              evidence: {
                key: "evidence:name",
                source: "source:one",
                relationship: "supports",
                locator: "Name",
                excerpt: "Full synthetic dossier",
              },
            },
            {
              key: "claim:material",
              subject: "item:one",
              predicate: "made_of",
              literal: { type: "text", value: "wood" },
              evidence: {
                key: "evidence:material",
                source: "source:one",
                relationship: "supports",
                locator: "Material",
                excerpt: "wood",
              },
            },
            {
              key: "claim:moved",
              subject: "event:one",
              predicate: "moved_item",
              object: "item:one",
              evidence: {
                key: "evidence:moved",
                source: "source:one",
                relationship: "mentions",
                locator: "History",
                excerpt: "moved",
              },
            },
          ],
          restitutionCases: [
            {
              key: "case:one",
              reference: `synthetic-${randomUUID()}`,
              title: "Synthetic return enquiry",
              status: "open",
              items: ["item:one"],
              parties: [],
              documents: [{ key: "document:one", source: "source:one", role: "correspondence" }],
              actions: [],
            },
          ],
        };
        await importInTransaction(client, fullPacket);
        const fullItem = (
          await client.query<{ entity_id: string }>(
            `select b.entity_id from ingestion.entity_binding b join ingestion.dataset d on d.id=b.dataset_id
           where d.key=$1 and b.local_key='item:one'`,
            [fullPacket.dataset.key],
          )
        ).rows[0].entity_id;
        const researcher = randomUUID();
        const draftId = randomUUID();
        await client.query("insert into capture.researcher(user_id) values($1)", [researcher]);
        await client.query(
          `insert into capture.draft(id,owner_id,request_id,status,content,item_id)
           values($1,$2,$3,'accepted',$4,$5)`,
          [draftId, researcher, randomUUID(), { kind: "dossier", packet: fullPacket }, fullItem],
        );
        await client.query("set local role collection_publisher");
        const fullRelease = await prepare(client, [
          anotherSelection,
          { draftId, itemId: fullItem },
        ]);
        assert.equal(fullRelease.schemaVersion, 2);
        assert.equal(fullRelease.records.length, 2);
        assert("kind" in fullRelease.records[1]);
        assert.equal(fullRelease.records[1].claims.length, 3);
        assert.equal(fullRelease.records[1].cases.length, 1);
        await approve(
          client,
          fullRelease.releaseId,
          "Test reviewer",
          "Synthetic dossier publication",
        );
        assert.deepEqual(await currentRelease(client), fullRelease);
        const afterDossierWithdrawal = await withdraw(
          client,
          fullRelease.releaseId,
          "Test reviewer",
          "Remove synthetic dossier",
          fullItem,
        );
        assert.deepEqual(
          afterDossierWithdrawal.records.map((record) => record.id),
          [anotherItem],
        );
        console.log(
          "Verified publication: private permissions, candidate approval, full dossiers, stale dependencies, interrupted deployment recovery and individual withdrawal. All test writes rolled back.",
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
