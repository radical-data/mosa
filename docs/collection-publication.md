# Publish and withdraw collection records

## Scope and current state

The current pilot publishes up to two records from the research database through a versioned static JSON export. The public card contains an attributed name, reported holding institution, institutional identifier and supporting links. The site has no database credentials. Research selection, approvals and evidence fingerprints stay in the private `publication` schema.

The committed snapshot contains the approved Hoa Hakananaiʻa pilot.
`just collection status` reports the separately verified live release.
An [empty-release rehearsal](https://github.com/radical-data/mosa/actions/runs/35604556798)
passed on 2026-09-21. Its 2 min 11 s runtime excluded review, merge and pinning;
it is not a withdrawal deadline.

A missing or invalid export fails the build; the site never falls back to the six design reference records. No images or extra research fields are included in the pilot.

## Prerequisites

1. Apply repository migrations to the intended research database through the established migration process. Do not reset the database or load fixture SQL. Back up the private publication schema with the research database.
2. Create a dedicated login outside Git and grant it `collection_publisher`. This trusted maintainer role inherits research read access and can maintain the private publication ledger; it is not an application-user role or website credential. Do not grant it to `anon`, `authenticated` or the explorer runtime login. Keep its database connection out of public build/runtime environments.
3. Configure `COLLECTION_DATABASE_URL` for maintainer commands. Remote connections also require `COLLECTION_DATABASE_SSL_CA`; TLS verification is mandatory. These are separate from the write credentials used to import dossiers.
4. Import the reviewed Hoa packet with the existing importer if it is not already present. Check the dry run, apply it with the import write account, then confirm that repeating the import is a no-op. See the [bootstrap instructions](../packets/bootstrap/README.md). Use canonical imported identities, not the reserved identifiers in development fixtures.
5. Agree a removal deadline with the publication owner. Rehearse the complete withdrawal/deploy/verification path before putting research content live. This static workflow does not remove a served record merely because its database approval changes.

Use `mise exec --` before the following `just` commands if mise is not active in the shell. Keep selection and candidate files in a private directory outside the repository. Commands that write a file use mode `0600` and replace it atomically.

## Prepare an accepted research draft

The accepted draft URL contains its draft ID. Prepare it without manually
assembling evidence identifiers:

```sh
just collection prepare --draft <draft-id> --retain --output /private/path/candidate.json
```

`--retain` includes the currently authorised card after checking its dependencies.
Review the whole candidate. Classifications/descriptions without an evidenced name,
unresolved holders, absent catalogue identifiers, unknown speakers, non-HTTP(S)
sources, qualifying/contradicting evidence and stale dependencies block this pilot
projection. These are publication limits, not requirements to invent missing research.
Private preserved-source records do not become publishable merely by being accepted.

The command uses canonical evidence references recorded in `capture.acceptance`.
It does not reconstruct them from form fields or importer keys. Existing single-card
releases remain valid. [Research](local-research.md) describes preparation/acceptance.

## Prepare the explicit selection

For a manually assembled candidate, the selection identifies one item, one identifier and five evidence links. Use an array for two explicit selections; duplicate items or a third item are rejected. Each evidence link fixes its claim and source, so the exporter does not choose a name by database order. The speaker labels are also explicitly evidenced names. `holderName`, `nameSpeaker` and `holderSpeaker` can reference the same evidence link when the institution names itself and asserts both statements.

```json
{
  "itemId": "<canonical item UUID>",
  "name": "<evidence UUID for the item's has_name claim>",
  "holder": "<evidence UUID for the item's held_by claim>",
  "holderName": "<evidence UUID naming the holding agent>",
  "nameSpeaker": "<evidence UUID naming the has_name asserting agent>",
  "holderSpeaker": "<evidence UUID naming the held_by asserting agent>",
  "identifier": "<external_identifier row UUID>"
}
```

For the Hoa bootstrap dossier, an import operator can resolve the selection using the existing ingestion bindings. Run this read-only query with an account allowed to read those bindings; the publisher role intentionally does not need ingestion access. Save the resulting JSON as the private selection file.

```sql
with dataset as (
    select id from ingestion.dataset where key = 'mosa-bootstrap'
), object_binding as (
    select entity_id from ingestion.entity_binding
    where dataset_id = (select id from dataset)
      and local_key = 'item:hoa-hakananai-a'
), evidence as (
    select local_key, claim_evidence_id
    from ingestion.evidence_binding
    where dataset_id = (select id from dataset)
)
select jsonb_build_object(
    'itemId', (select entity_id from object_binding),
    'name', (select claim_evidence_id from evidence where local_key = 'evidence:hoa:name:bm'),
    'holder', (select claim_evidence_id from evidence where local_key = 'evidence:hoa:held-by:bm'),
    'holderName', (select claim_evidence_id from evidence where local_key = 'evidence:bm:name'),
    'nameSpeaker', (select claim_evidence_id from evidence where local_key = 'evidence:bm:name'),
    'holderSpeaker', (select claim_evidence_id from evidence where local_key = 'evidence:bm:name'),
    'identifier', (select id from entities.external_identifier
                   where entity_id = (select entity_id from object_binding)
                     and namespace = 'british-museum' and value = 'Oc1869,1005.1')
);
```

A missing binding produces an invalid selection, not an inferred identity. The current pilot rejects claims without an identified speaker, inactive claims, non-HTTP(S) sources, and claims with qualifying or contradicting evidence. Keep those accounts in research until a versioned public contract can represent them without flattening uncertainty.

```sh
just collection prepare --selection /private/path/hoa-selection.json --output /private/path/hoa-candidate.json
```

Review the candidate's exact public wording, attribution, identifiers and all source URLs. The command saves an immutable candidate and a fingerprint of its selected research dependencies in the database. The candidate JSON alone grants no publication permission. Preserve the existing source language; a missing language tag is not guessed.

## Approve and export

Use the `releaseId` from the reviewed candidate. Replace the example actor and authority text with the actual decision-maker and authorisation basis.

```sh
just collection approve --id <release-id> --actor 'Actual operator' --authority 'Actual authorisation basis for this exact reviewed candidate'
just collection export --output apps/website/public/collection-snapshot.json
just website-build
just collection check --snapshot apps/website/public/collection-snapshot.json
```

The export is generated output: do not edit its records by hand. Commit the export, review its diff, and merge it through the normal repository process. Only the public snapshot belongs in Git; selection files, decision records and research credentials do not.

Changing a selected claim, evidence link, source or identifier invalidates the candidate fingerprint. Prepare and review a new candidate rather than refreshing the old approval. A newer approval replaces the desired release; older approvals cannot be reactivated through the command. The currently served release remains visible until deployment changes it.

## Configure and deploy

Configure [website hosting and deployment credentials](operations.md#public-website)
first. The static build/container needs no database credentials; this deployment
command requires the private publisher connection.

1. Disable automatic and preview deployments. Cancel pre-existing queued jobs
   before the first gated release and restrict dashboard/webhook access to operators
   following this procedure. Direct administrator actions can bypass the gate.
2. Pin Coolify's **Git commit SHA** to the complete reviewed commit containing the
   export. The gate rejects moving branch/`HEAD` references.
3. Run the `Website` workflow on that commit on `main` with `deploy` enabled, or
   run the following maintainer commands from a checkout containing that commit.

```sh
just collection deploy --snapshot apps/website/public/collection-snapshot.json --commit <40-character-reviewed-commit>
just collection status
```

The command locks the publisher, checks the authorised snapshot against the
committed file, triggers the production webhook and waits for the identified hosting
job at the pinned commit. It then verifies the served snapshot and bilingual
collection/institution pages. Finding an older served copy is not sufficient.

Only successful verification updates `live_release_id` and `live_verified_at`. The desired release and live release remain distinct. A persistent pending marker protects against a crashed command or uncertain HTTP result. The configured origin sends `Cache-Control: no-store` for collection, institution and snapshot responses; configure any external proxy/CDN to honour that behaviour.

## Withdraw or replace content

Withdrawal immediately invalidates the selected release in the ledger. It does not
immediately remove an already served static page. Confirm the intended release and
removal scope before running the command; a pending deployment must be resolved first.

```sh
just collection withdraw --id <release-id> --actor 'Actual operator' --authority 'Reason for withdrawal'
just collection export --output apps/website/public/collection-snapshot.json
just website-build
```

Withdrawing the desired record creates a new, explicitly approved empty release. Commit and merge that export, pin Coolify to the new commit, and run the gated deployment. Verify the empty collection and institution listings in both languages and check `just collection status` before reporting removal complete. A stale build or old export fails the gate. To revert website code, make a new commit that retains the current authorised export; do not use Coolify's direct image rollback.

To remove one card and retain the other, use:

```sh
just collection withdraw --id <release-id> --item <item-id> --actor 'Actual operator' --authority 'Actual withdrawal reason'
just collection export --output apps/website/public/collection-snapshot.json
```

Item-specific withdrawal checks surviving dependencies and preserves approved
wording. If dependencies changed, it fails rather than approving changes silently.
Omit `--item` to withdraw the whole release. Commit and deploy the replacement
through the same gate and verify all current collection/institution surfaces.

If an already withdrawn record needs to return, prepare a new candidate and record a new decision. The old decision remains immutable. Deleting the public export file is not a withdrawal operation.

## Recover an interrupted deployment

An unresolved deployment blocks a second deployment, approval and withdrawal. This prevents a delayed older hosting job from restoring material after a newer withdrawal. The command reports the pending release in `status`.

1. Inspect Coolify and confirm that the pending job and any queued jobs are terminal or cancelled. Record the resulting served state. Do not clear the guard while an older job can still complete.
2. Record that operational resolution, using the pending release ID:

```sh
just collection recover --id <pending-release-id> --actor 'Actual operator' --authority 'Hosting job cancelled/finished; no older jobs remain; observed served state recorded'
```

3. Export and deploy the desired release through the gate, or withdraw it and deploy the empty release. Recovery clears the pending guard and records an audit event; it does not claim a release is live or that removal succeeded.

A 180-second polling timeout is a failure requiring attention, not proof that the hosting job was cancelled. Meet the agreed removal deadline through this operational process; if it cannot meet that deadline, keep sensitive material unpublished or add runtime enforcement before releasing it.

## Verification

- `just verify-static`: checks, types, unit tests and both app builds.
- `just collection-verify`: database integration checks in a rolled-back transaction, including permissions, stale dependencies and withdrawal. Use a migrated local test database; `PUBLICATION_TEST_DATABASE_URL` can select a separate loopback database.
- `just collection-website-verify`: synthetic populated/withdrawn builds in both languages in a temporary source copy, leaving the working snapshot and build output untouched.
- The website workflow runs the populated/withdrawn checks and production-image HTTP checks. The full database verification also invokes the publication integration checks.

The private publication tables are maintained by the command service using explicit SQL; they are deliberately outside the app-facing generated database type schemas. Private PDF/bundle preparation is implemented in research. Image publication, public dossier routes and publication of incomplete or private-document-backed records remain outside this public contract.

## Catalogue labels and existing decisions

New candidates include the catalogue’s readable name. A catalogue must have a name before a new candidate can be prepared; edit it through the research catalogue screen. The name is part of the reviewed snapshot and its dependencies. Changing it requires a new publication decision before that changed wording can be deployed.

Releases approved before catalogue labels were included keep their original snapshots and fingerprints. Export, validation and individual withdrawal continue to work after the evidence-mode migration. These legacy checks exclude the newly added mode column and catalogue metadata, which were not part of the original decision; they still detect changes to the original research dependencies. Withdrawing one card preserves the surviving card’s approved wording. Preparing a new candidate, including `--retain`, adopts catalogue labels for a fresh review. No migration silently rewrites an approval.
