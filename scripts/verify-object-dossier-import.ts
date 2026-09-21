// Database integration checks for the object dossier importer (ADR 012).
//
// Assumes a running local Supabase stack with migrations applied and the
// phase fixtures loaded (as prepared by scripts/verify-database.ts). The
// example packet's British Museum external identifier deliberately matches
// the Phase 1 fixture item, so identifier-based reuse is exercised for real.

import path from "node:path";
import { ImportError, runImport } from "@mosa/object-dossier/import";
import { type DossierPacket, readPacketFile } from "@mosa/object-dossier/packet";
import { validatePacket } from "@mosa/object-dossier/validate";
import { Client } from "pg";
import { getLocalDatabaseUrl } from "./lib/supabase-local";

const projectRoot = path.resolve(__dirname, "..");
const examplePacketPath = path.join(
  projectRoot,
  "schemas",
  "examples",
  "hoa-hakananai-a.packet.json",
);

const FIXTURE_ITEM_ID = "30000000-0000-4000-8000-000000000001";
const FIXTURE_SOURCE_ID = "40000000-0000-4000-8000-000000000001";
const FIXTURE_AGENT_ID = "10000000-0000-4000-8000-000000000002";

// Fixture entities live in hand-reserved UUID ranges such as
// 30000000-0000-4000-8000-000000000001. Generated UUIDs never look like this.
const FIXTURE_UUID_PATTERN = /^[0-9a-f]{2}000000-0000-4000-8000-[0-9a-f]{12}$/u;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`assertion failed: ${message}`);
  }
}

function step(message: string): void {
  process.stdout.write(`--- ${message}\n`);
}

async function scalar<T>(client: Client, sql: string, params: unknown[] = []): Promise<T> {
  const result = await client.query(sql, params);
  return result.rows[0] ? (Object.values(result.rows[0])[0] as T) : (undefined as T);
}

async function loadExamplePacket(): Promise<DossierPacket> {
  const raw = await readPacketFile(examplePacketPath);
  const outcome = validatePacket(raw);
  assert(outcome.packet && outcome.errors.length === 0, "example packet validates");
  return outcome.packet;
}

function syntheticPacket(datasetKey: string): DossierPacket {
  return {
    schemaVersion: 1,
    dataset: { key: datasetKey, version: "1" },
    objects: [{ key: "item:x", kind: "artefact" }],
    agents: [{ key: "agent:x", kind: "organisation" }],
    places: [{ key: "place:x", kind: "city" }],
    sources: [
      {
        key: "source:x",
        kind: "institutional_record",
        url: `https://example.org/${datasetKey}/record/1`,
        retrievedAt: "2026-07-28T00:00:00Z",
        about: ["item:x"],
      },
    ],
    claims: [
      {
        key: "claim:x:name",
        subject: "item:x",
        predicate: "has_name",
        literal: { type: "text", value: `Verify object ${datasetKey}` },
        evidence: {
          key: "evidence:x:name",
          source: "source:x",
          relationship: "supports",
          locator: "Name field",
          excerpt: `Verify object ${datasetKey}`,
        },
      },
    ],
  };
}

async function verifyObjectDossierImport(): Promise<void> {
  const databaseUrl = await getLocalDatabaseUrl(projectRoot);
  const client = new Client({
    application_name: "mosa-object-dossier-import-verify",
    connectionString: databaseUrl,
  });
  await client.connect();

  try {
    const packet = await loadExamplePacket();
    const datasetKey = packet.dataset.key;

    step("requires a freshly prepared database");
    const staleDatasets = await client.query(
      "select key from ingestion.dataset where key = any($1::text[])",
      [[datasetKey, "verify-rollback", "verify-collision"]],
    );
    assert(
      staleDatasets.rowCount === 0,
      `verification datasets already exist (${staleDatasets.rows
        .map((row) => row.key)
        .join(", ")}); run just db-verify against a reset database`,
    );

    step("dry run matches fixture entities and writes nothing");
    const dryRun = await runImport(packet, { databaseUrl, apply: false });
    assert(!dryRun.applied && !dryRun.noop, "dry run neither applies nor no-ops");

    const objectResolution = dryRun.plan.resolution.entities.get("item:hoa-hakananai-a");
    assert(
      objectResolution?.action === "matched" && objectResolution.entityId === FIXTURE_ITEM_ID,
      "packet object matches the fixture item through its external identifier",
    );

    const sourceResolution = dryRun.plan.resolution.entities.get("source:bm:oc1869-1005-1");
    assert(
      sourceResolution?.action === "matched" && sourceResolution.entityId === FIXTURE_SOURCE_ID,
      "packet source matches the fixture source through its reference URL",
    );

    const datasetAfterDryRun = await scalar<string | undefined>(
      client,
      "select id from ingestion.dataset where key = $1",
      [datasetKey],
    );
    assert(datasetAfterDryRun === undefined, "dry run does not create the dataset record");

    step("apply imports the dossier");
    const claimsBefore = await scalar<string>(client, "select count(*) from knowledge.claim");
    const applied = await runImport(packet, { databaseUrl, apply: true });
    assert(applied.applied && !applied.noop, "apply writes the dossier");

    const bindings = await client.query<{ local_key: string; entity_id: string }>(
      `select binding.local_key, binding.entity_id
         from ingestion.entity_binding as binding
         join ingestion.dataset as dataset on dataset.id = binding.dataset_id
        where dataset.key = $1`,
      [datasetKey],
    );
    const entityIdByKey = new Map(bindings.rows.map((row) => [row.local_key, row.entity_id]));

    step("external identifiers reuse the existing fixture object");
    assert(
      entityIdByKey.get("item:hoa-hakananai-a") === FIXTURE_ITEM_ID,
      "imported object binds to the fixture item instead of creating a duplicate",
    );
    const itemCount = await scalar<string>(
      client,
      `select count(*)
         from entities.external_identifier
        where namespace = 'british-museum' and value = 'Oc1869,1005.1'`,
    );
    assert(Number(itemCount) === 1, "the shared external identifier still exists exactly once");

    step("created entities use PostgreSQL-generated UUIDs");
    for (const localKey of [
      "agent:british-museum",
      "place:london",
      "place:rano-kao",
      "place:orongo",
    ]) {
      const entityId = entityIdByKey.get(localKey);
      assert(entityId, `${localKey} received a binding`);
      assert(
        !FIXTURE_UUID_PATTERN.test(entityId),
        `${localKey} (${entityId}) does not reuse a fixture-reserved UUID`,
      );
    }

    step("every imported claim has evidence");
    const claimsWithoutEvidence = await scalar<string>(
      client,
      `select count(*)
         from ingestion.claim_binding as binding
         join ingestion.dataset as dataset on dataset.id = binding.dataset_id
        where dataset.key = $1
          and not exists (
              select 1 from knowledge.claim_evidence as evidence
               where evidence.claim_id = binding.claim_id
          )`,
      [datasetKey],
    );
    assert(Number(claimsWithoutEvidence) === 0, "no imported claim lacks evidence");

    step("made_at, found_at and located_at remain distinct");
    const originClaims = await client.query<{
      local_key: string;
      predicate: string;
      object_entity_id: string;
    }>(
      `select binding.local_key, claim.predicate, claim.object_entity_id
         from ingestion.claim_binding as binding
         join ingestion.dataset as dataset on dataset.id = binding.dataset_id
         join knowledge.claim as claim on claim.id = binding.claim_id
        where dataset.key = $1
          and claim.predicate in ('made_at', 'found_at', 'located_at')`,
      [datasetKey],
    );
    const byPredicate = new Map(
      originClaims.rows.map((row) => [row.predicate, row.object_entity_id]),
    );
    assert(byPredicate.size === 3, "made_at, found_at and located_at were all imported");
    assert(
      byPredicate.get("made_at") === entityIdByKey.get("place:rano-kao"),
      "made_at points to Rano Kao",
    );
    assert(
      byPredicate.get("found_at") === entityIdByKey.get("place:orongo"),
      "found_at points to Orongo",
    );
    assert(
      byPredicate.get("located_at") === entityIdByKey.get("place:london"),
      "located_at points to London",
    );

    step("source refers_to relationships are created");
    const refersTo = await scalar<string>(
      client,
      `select count(*)
         from ingestion.claim_binding as binding
         join ingestion.dataset as dataset on dataset.id = binding.dataset_id
         join knowledge.claim as claim on claim.id = binding.claim_id
        where dataset.key = $1
          and claim.predicate = 'refers_to'
          and claim.subject_id = $2
          and claim.object_entity_id = $3`,
      [datasetKey, FIXTURE_SOURCE_ID, FIXTURE_ITEM_ID],
    );
    assert(Number(refersTo) === 1, "the source refers_to the object");

    step("imported entities receive derived display labels");
    const ranoKaoLabel = await client.query<{ display_label: string; display_label_basis: string }>(
      "select display_label, display_label_basis from entities.entity_display where id = $1",
      [entityIdByKey.get("place:rano-kao")],
    );
    assert(
      ranoKaoLabel.rows[0]?.display_label === "Rano Kao" &&
        ranoKaoLabel.rows[0]?.display_label_basis === "has_name",
      "the created place derives its display label from the imported has_name claim",
    );

    step("an identical reimport is a no-op");
    const claimsAfterApply = await scalar<string>(client, "select count(*) from knowledge.claim");
    const rerun = await runImport(packet, { databaseUrl, apply: true });
    assert(rerun.noop && !rerun.applied, "second apply reports a no-op");
    const claimsAfterRerun = await scalar<string>(client, "select count(*) from knowledge.claim");
    assert(claimsAfterApply === claimsAfterRerun, "the reimport creates no claims");
    assert(Number(claimsAfterApply) > Number(claimsBefore), "the first apply did create claims");

    step("an identifier that belongs to a non-item fails the import");
    await client.query(
      `insert into entities.external_identifier (entity_id, namespace, value)
       values ($1, 'verify-collision-ns', 'X1')`,
      [FIXTURE_AGENT_ID],
    );
    const collisionPacket = syntheticPacket("verify-collision");
    collisionPacket.objects[0].externalIdentifiers = [
      { namespace: "verify-collision-ns", value: "X1" },
    ];
    const entitiesBeforeCollision = await scalar<string>(
      client,
      "select count(*) from entities.entity",
    );
    let collisionError: unknown;
    try {
      await runImport(collisionPacket, { databaseUrl, apply: true });
    } catch (error) {
      collisionError = error;
    }
    assert(collisionError instanceof ImportError, "the identifier/type collision raises an error");
    assert(
      String((collisionError as Error).message).includes("refusing to create a duplicate"),
      "the collision error explains the refusal",
    );
    const entitiesAfterCollision = await scalar<string>(
      client,
      "select count(*) from entities.entity",
    );
    assert(
      entitiesBeforeCollision === entitiesAfterCollision,
      "the collision import wrote no entities",
    );

    step("a database error rolls back the entire dossier");
    const rollbackPacket = syntheticPacket("verify-rollback");
    // Two evidence entries with identical (claim, source, relationship,
    // locator) violate the claim_evidence uniqueness constraint mid-import.
    rollbackPacket.claims[0].evidence = [
      {
        key: "evidence:x:name",
        source: "source:x",
        relationship: "supports",
        locator: "Name field",
        excerpt: "Verify object verify-rollback",
      },
      {
        key: "evidence:x:name-duplicate",
        source: "source:x",
        relationship: "supports",
        locator: "Name field",
        excerpt: "Verify object verify-rollback",
      },
    ];
    const entitiesBeforeRollback = await scalar<string>(
      client,
      "select count(*) from entities.entity",
    );
    let rollbackError: unknown;
    try {
      await runImport(rollbackPacket, { databaseUrl, apply: true });
    } catch (error) {
      rollbackError = error;
    }
    assert(rollbackError instanceof Error, "the failing import raises an error");
    const entitiesAfterRollback = await scalar<string>(
      client,
      "select count(*) from entities.entity",
    );
    assert(
      entitiesBeforeRollback === entitiesAfterRollback,
      "the failed import left no canonical entities behind",
    );
    const rollbackBindings = await scalar<string>(
      client,
      `select count(*)
         from ingestion.entity_binding as binding
         join ingestion.dataset as dataset on dataset.id = binding.dataset_id
        where dataset.key = 'verify-rollback'`,
    );
    assert(Number(rollbackBindings) === 0, "the failed import left no bindings behind");
    const failedRun = await scalar<string>(
      client,
      `select status
         from ingestion.run as run
         join ingestion.dataset as dataset on dataset.id = run.dataset_id
        where dataset.key = 'verify-rollback'
        order by run.started_at desc
        limit 1`,
    );
    assert(failedRun === "failed", "the failed import is recorded as a failed run");

    step("competency query answers the dossier questions from one identifier");
    const competency = await client.query<{
      item_id: string;
      display_name: string;
      origin_claims: Array<{ predicate: string; place: string; evidence_count: number }> | null;
      current_locations: string[] | null;
      holders: string[] | null;
      sources: string[] | null;
    }>(
      `with target as (
           select identifier.entity_id as item_id
             from entities.external_identifier as identifier
            where identifier.namespace = $1
              and identifier.value = $2
       )
       select
           target.item_id,
           display.display_label as display_name,
           (
               select jsonb_agg(jsonb_build_object(
                   'predicate', claim.predicate,
                   'place', place_display.display_label,
                   'evidence_count', (
                       select count(*)
                         from knowledge.claim_evidence as evidence
                        where evidence.claim_id = claim.id
                   )
               ))
                 from knowledge.claim as claim
                 join entities.entity_display as place_display
                   on place_display.id = claim.object_entity_id
                where claim.subject_id = target.item_id
                  and claim.predicate in ('made_at', 'found_at')
                  and claim.status = 'active'
           ) as origin_claims,
           (
               select jsonb_agg(place_display.display_label)
                 from knowledge.claim as claim
                 join entities.entity_display as place_display
                   on place_display.id = claim.object_entity_id
                where claim.subject_id = target.item_id
                  and claim.predicate = 'located_at'
                  and claim.status = 'active'
           ) as current_locations,
           (
               select jsonb_agg(holder_display.display_label)
                 from knowledge.claim as claim
                 join entities.entity_display as holder_display
                   on holder_display.id = claim.object_entity_id
                where claim.subject_id = target.item_id
                  and claim.predicate = 'held_by'
                  and claim.status = 'active'
           ) as holders,
           (
               select jsonb_agg(distinct source_display.display_label)
                 from knowledge.claim as claim
                 join entities.entity_display as source_display
                   on source_display.id = claim.subject_id
                where claim.object_entity_id = target.item_id
                  and claim.predicate in ('refers_to', 'depicts')
                  and claim.status = 'active'
           ) as sources
         from target
         join entities.entity_display as display on display.id = target.item_id`,
      ["british-museum", "Oc1869,1005.1"],
    );

    const row = competency.rows[0];
    assert(row, "the identifier resolves to an object");
    assert(row.item_id === FIXTURE_ITEM_ID, "the identifier resolves to the fixture item");
    assert(row.display_name === "Hoa Hakananaiʻa", "the object displays its has_name label");

    const origins = row.origin_claims ?? [];
    assert(
      origins.some((claim) => claim.predicate === "made_at" && claim.place === "Rano Kao"),
      "origin includes made_at Rano Kao",
    );
    assert(
      origins.some((claim) => claim.predicate === "found_at" && claim.place === "Orongo"),
      "origin includes found_at Orongo",
    );
    assert(
      origins.every((claim) => Number(claim.evidence_count) >= 1),
      "every origin claim carries evidence",
    );
    assert((row.current_locations ?? []).includes("London"), "current location includes London");
    assert((row.holders ?? []).includes("British Museum"), "holder includes the British Museum");
    assert((row.sources ?? []).length > 0, "related sources are retrievable");

    process.stdout.write("Object dossier import verification passed.\n");
  } finally {
    await client.end();
  }
}

async function main(): Promise<void> {
  try {
    await verifyObjectDossierImport();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`error: ${message}\n`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  void main();
}

export { verifyObjectDossierImport };
