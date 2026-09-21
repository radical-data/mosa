# Implement the source-to-publication collection workflow

## Objective and status

Implement the [agreed collection workflow](collection-workflow.md). A researcher can capture a source, confirm an object, review evidenced claims, preview a public dossier, publish authorised content, and correct or withdraw that content.

Status: planned, 2026-09-21. No implementation step is completed by adding this document. Each numbered step is a deliverable that can be reviewed independently; split a step into smaller changes when necessary.

## Baseline and dependencies

The baseline is `main` at `a9000f6`, used to create `codex/collection-workflow-plan`. It contains the read-only explorer, research schema, v1 dossier importer, bilingual static website and foregrounded-claim selection. Reuse those components; the missing work is authoring, source preservation, review and publication integration.

Use these existing components:

- [Packet contract](../schemas/object-dossier-packet.schema.json)
- [Validation](../scripts/lib/object-dossier/validate.ts), [identity resolution](../scripts/lib/object-dossier/resolve.ts) and [importer](../scripts/lib/object-dossier/import.ts)
- [Database migrations](../supabase/migrations/) and [database tests](../supabase/tests/database/)
- [Explorer](../apps/explorer/) and its research projections
- [Website](../apps/website/), its [collection adapter](../apps/website/src/data/site.ts) and [collection template](../apps/website/src/templates/collection.astro)
- [Foregrounding migration](../supabase/migrations/20260831120000_create_foregrounded_claims.sql) and [decision](adrs/013-foreground-claims-and-defer-first-class-concepts.md)
- [Bootstrap packets](../packets/bootstrap/README.md), as import examples rather than publication-approved content

Complete steps 1–9 for the first usable manual release. Add AI in step 10, provenance authoring in step 11 and restitution authoring in step 12. Existing read-only provenance views can remain available before event authoring is added.

## Step 1 — Define the first dossier and public contract

1. Review the existing research projections, foregrounded-claim selection and website adapter against this workflow. Record which fields can be derived and which require additional research or editorial decisions.
2. Confirm the current schema and application commands before implementation; update this plan if the baseline changes.
3. Choose one real dossier with the researcher and person responsible for publication. Establish which source content and images can be used for the pilot. Use synthetic equivalents in committed tests.
4. Define a public record contract covering stable item identity, attributed names, separate origin and custody claims, identifiers, permitted citations, optional imagery, original text, translations and revision references. A related entity label is also public content.
5. Record the authoring application boundary. The proposed default is an authenticated workspace within `apps/explorer`, with separate server write services and credentials. Keep its existing reader routes operational. A separate app is an alternative if deployment or access needs require it.
6. Confirm who can capture, review, select foregrounded claims, authorise publication and withdraw content. Record source storage and withdrawal requirements before implementing the affected services.

**Deliverables:** pilot dossier specification; mapping from research records to public fields; versioned public export schema with synthetic examples; recorded application and permission decisions.

**Acceptance:** the contract represents two conflicting names, an unknown origin and an item without an image. The pilot distinguishes private source material from publishable claims or excerpts. No decision relies on an assumed production import.

## Step 2 — Add authenticated draft and review foundations

Depends on step 1.

1. Add migrations for draft dossiers, source captures, claim proposals, review decisions and research coverage metadata. Keep provisional labels and notes outside canonical entities.
2. Give drafts and proposals revision identifiers. Record the actor and UTC time for changes and decisions.
3. Add authenticated server operations with explicit permissions for capture, review and publication work. Audit the current broad `authenticated` and reader policies before exposing a workspace; do not assume a login alone provides scoped access.
4. Enforce the same access rules through direct database/API access and the application. Keep server credentials out of browser responses and bundles.
5. Reject stale edits with a visible conflict response. Make draft creation and review requests retryable without duplicate records.

**Deliverables:** migrations, generated database types, authenticated workspace shell, server operations and permission tests.

**Acceptance:** an unauthenticated request cannot read drafts or write research data. A capture-only user cannot accept or publish a proposal through a direct request. Two editors cannot silently overwrite the same draft revision. Saving a draft creates no canonical claim or public content.

## Step 3 — Build source capture and preservation

Depends on step 2.

1. Build **Add source** for URLs, files, photographs and archival references, with optional institution, catalogue identifier and private lead note.
2. Add immutable source-version metadata: content hash, media type, storage reference, capture time, original reference and access conditions. Store files privately; issue access only after checking the requesting user's permission.
3. Separate capture jobs from draft saves. Show pending, completed and failed capture states, with retry and manual continuation.
4. For reference-only sources, record that no digital copy is held. For changed remote content, create a new version without changing earlier evidence targets.
5. Restrict URL fetching to permitted HTTP(S) destinations; reject private/internal destinations and recheck redirects. Set file size, content-type and fetch-time limits in configuration and expose validation failures in the form.
6. Extend the packet schema and importer for non-URL sources and version-linked evidence. Preserve v1 imports through explicit version handling; do not fabricate public URLs for private files.

**Deliverables:** source capture UI, private storage integration, capture worker, versioned packet changes and compatibility tests.

**Acceptance:** a museum URL, a local document and an archival reference can each start a dossier. A failed download preserves the draft and reference. Retrying a completed capture does not duplicate its version. An unauthorised user cannot retrieve a private file. Existing v1 bootstrap packets still validate and import with their existing meaning.

## Step 4 — Build identity confirmation

Depends on step 3.

1. Search existing bindings, exact external identifiers and source references; use names only to find candidates.
2. Show candidates with identifiers, institution, attributed names, sources and the match reason.
3. Implement explicit link, create and defer actions. Keep deferred drafts outside canonical object creation.
4. Reuse identity resolution during canonical writes. Detect conflicting identifiers and incompatible entity types before committing.
5. Define how an explicit existing-entity selection becomes a trusted internal reference or binding. Keep user-supplied identifiers separate from server-authorised links; do not weaken the portable packet's identity rules.

**Deliverables:** identity screen, authorised binding operations and duplicate/conflict tests.

**Acceptance:** equal names alone do not merge two objects. A known institutional identifier resolves to the existing object. Conflicting identifiers require a researcher decision. Repeated or concurrent confirmation requests do not create duplicate bindings or objects.

## Step 5 — Complete manual claim review and the research dossier

Depends on step 4.

1. Build the source/proposal review screen. Allow passage selection where supported and manual page, timestamp or visual locators for other sources.
2. Start with the existing summary predicates: `has_name`, `made_at`, `found_at`, `located_at` and `held_by`, plus validated source relationships. Label each field in ordinary language and preserve its exact predicate meaning.
3. Require the evidence locator, relationship and excerpt under the existing evidence rules. Record original language and asserting agent when known; do not invent a speaker.
4. Implement accept, edit, reject and defer. Compile accepted proposals through shared validation and canonical write logic.
5. Refactor the importer transaction boundary so that canonical writes and the proposal-to-claim promotion record commit together. Existing `runImport` owns its transaction and records run outcomes separately; wrapping it in a second transaction is insufficient.
6. Add explicit correction/supersession operations and review history. Keep conflicting claims as distinct accounts. A changed packet checksum alone is not a correction workflow.
7. Build the dossier overview with the ADR 011 sections, identifiers, evidence, disagreements and explicit research coverage. Allow a draft with missing origin or provenance to remain useful.

**Deliverables:** manual review UI, transactional promotion service, correction operation, dossier overview and integration tests.

**Acceptance:** a researcher records an attributed name and current holder without editing JSON or seeing UUIDs. Rejecting a proposal produces no canonical claim. A failed or retried promotion leaves neither partial evidence nor duplicate claims. A corrected claim retains its history. A conflicting claim remains independently readable. “Removed from Orongo” is not accepted as evidence of `found_at` solely because that field is available.

## Step 6 — Add public selection and publication decisions

Depends on step 5 and the public field mapping in step 1.

1. Reuse `presentation.foregrounded_claim` and its active-claim projection. Add actor/time history for editorial selection without turning foregrounding into publication permission. The existing active-only filter is insufficient for public access.
2. Add revision-specific publication decisions for the permitted claim content, related labels, identifiers, citations, excerpts, media and translations. Record the decision-maker, time, scope and basis of authority.
3. Define the public dependency rules. Publishing an item does not publish its whole graph. Publishing a claim does not publish an entire source file. A public title cannot use a restricted name claim.
4. Keep public translations linked to their source revision. A changed revision requires a new publication decision for changed content; dependent translations require renewed review. An unchanged previously authorised revision remains eligible only until explicitly superseded or withdrawn by the publication rules.
5. Add authenticated preview using the same public projection rules as export. Keep draft assets protected; `noindex` is not access control.

**Deliverables:** publication migrations and operations, decision UI, preview and dependency tests.

**Acceptance:** accepting and foregrounding a claim leave it unpublished. A reviewer without publication permission cannot publish. Restricted excerpts and filenames do not appear in preview output intended for public release. Editing a claim does not transfer its approval to the new revision. Withdrawing a source revision invalidates public derivatives that depend on that revision.

## Step 7 — Generate a restricted, versioned public export

Depends on step 6.

1. Implement a trusted exporter that reads only the publication-approved projection through a dedicated restricted interface. Audit grants and policies; do not give the website the explorer reader or a service-role key.
2. Export the contract from step 1 with schema version, snapshot identity, generation time and published revision references. Validate the complete export before making it available to the website build.
3. Re-evaluate eligibility for every value, including nested labels, source metadata, translated text, search terms, media links and counts. Generate counts from public records only.
4. Generate only permitted media derivatives. Keep private storage references and capture logs out of the export.
5. Make snapshot generation consistent under concurrent review and withdrawal. Bind export validity to a publication revision or equivalent marker that the deployment service can recheck.

**Deliverables:** export schema, exporter, restricted read interface, synthetic snapshots and boundary tests.

**Acceptance:** a deliberately restricted value is absent from JSON, media metadata and search data. An item with missing fields exports without invented values. Repeated exports of unchanged publication content agree apart from explicitly volatile metadata. An invalid export fails without replacing the last valid snapshot. A withdrawal during export prevents the stale snapshot from becoming eligible for deployment.

## Step 8 — Connect the static website and public dossiers

Depends on step 7.

1. Replace the website's curated collection adapter with the validated export. Keep private authoring modules out of the website app.
2. Add stable item routes and link collection cards to public dossiers. Update institution listings and other collection-derived sections from the same snapshot.
3. Render attributed names, original wording, reviewed translations, distinct origin/custody fields, permitted sources and public provenance when available. Provide text-only cards when images are absent.
4. Reconcile concept/type controls with the authorised data contract. Preserve stable filter IDs; omit unsupported controls rather than inventing classifications.
5. Retain the site's Chilean Spanish and British English routing, language switching, metadata and progressive enhancement. Declare alternate-language item URLs only when the corresponding page exists.
6. Build public search from the export only. Make collection browsing and dossier reading work without client-side JavaScript.

**Deliverables:** collection adapter, item routes, updated listing/filter components and output checks.

**Acceptance:** a public card opens the matching stable dossier. Both supported site languages work with missing optional translations clearly represented. A source-language name survives unchanged. Restricted content is absent from generated HTML, JSON, search data and image output. Missing images and unknown origin do not break the build or suggest fabricated information.

## Step 9 — Complete publishing, withdrawal and the pilot

Depends on step 8. This step completes the first manual release.

1. Trigger validated website builds from publication changes. Record the snapshot, content revisions and deployment result; show authorised, deploying, live and failed states to the publisher.
2. Recheck publication eligibility immediately before promoting a deployment. Serialise promotion against withdrawal or use an equivalent revision guard. A stale build must not replace a newer permitted release.
3. Implement priority withdrawal: invalidate affected revisions, generate the permitted remainder, remove obsolete pages and media, update search/sitemap output and purge applicable caches.
4. Block rollback to snapshots containing withdrawn material. Keep failed withdrawal visible and actionable; do not report removal as complete until the served output is verified.
5. Agree and record a withdrawal deadline and test against it. Add runtime access enforcement before launch if the static deployment path cannot meet the required deadline.
6. Run the real pilot from capture through manual review, preview, publication, correction and withdrawal. Record friction with the researcher and publication decision-maker; fix failures before expanding the dataset.
7. Document operation, recovery and the revision-aware rollback procedure. Restore a backup in an isolated environment and confirm that private files, evidence versions and decision history remain linked.

**Deliverables:** deployment integration, withdrawal operation, runbook and pilot results.

**Acceptance:** the real dossier is readable at its public URL with the authorised sources and imagery. A private note never appears in public output. A failed build is visibly failed. Withdrawal removes the affected served content and dependent outputs within the agreed deadline. A concurrent older build or rollback cannot restore that content.

## Step 10 — Add AI proposals to the manual review workflow

Depends on the completed manual release.

1. Select an extraction service only after defining which source material may be sent to it. Keep storage permission and external processing permission separate.
2. Generate proposals referencing preserved source versions and exact passages or visual locators. Record model, prompt version, extraction time and method separately from attribution.
3. Use the existing review actions; give the extraction worker no permission to accept, merge identities, publish or alter restitution cases.
4. Treat retrieved text as untrusted source content. An instruction embedded in a document cannot trigger tools or change the review policy.
5. Evaluate names and identifiers, ambiguous origin, conflicting accounts, uncertain dates, colonial removal language, unsupported predicates and sensitive sources. Record results and limitations before enabling routine use.

**Acceptance:** AI proposals remain outside canonical claims until reviewed. Every accepted proposal has traceable evidence. Manual entry works during extraction failure. The model abstains or produces a reviewable unresolved proposal where the source is ambiguous. AI confidence is not stored as factual authority.

## Step 11 — Add provenance authoring

Depends on steps 5–9; AI is not a prerequisite.

1. Extend the versioned write contract for events, structured dates, role claims and evidence.
2. Build an event form for the reported action, object, date, places, participants, source characterisation and evidence.
3. Preserve relocation versus transfer, uncertain or alternative dates, separate accounts and explicit identity reconciliation. Keep the source's removal characterisation attributed.
4. Apply the existing review and publication decisions to event claims. Add public timeline output only for authorised event content.

**Acceptance:** a researcher records one evidenced removal event without constructing graph rows manually. Movement origin does not become findspot or manufacture location. Partial dates retain their precision. Recording transfer does not assert title or consent. Unresolved accounts remain separate events until explicitly reconciled.

## Step 12 — Add the restitution workspace

Depends on the manual release and a review of the existing Phase 3 model with intended case workers. Provenance completeness is not a prerequisite for recording a request.

1. Define permitted case workers and access to contacts, correspondence and community-provided material.
2. Add validated operations for cases, parties, actions, linked documents and next actions, reusing the existing restitution constraints.
3. Design any additional workflow states from real case tasks. Document their operational meanings before migrating the current status model.
4. Provide a separate, explicit route to publish selected case information. Keep correspondence and contact details private unless specifically authorised.

**Acceptance:** a permitted case worker records a request and next action without altering custody or provenance claims. An unauthorised user cannot retrieve case documents through direct requests. Public item pages expose only case content selected for publication. Case status does not imply moral or legal validity.

## Verification and delivery discipline

For each implementation step, add tests for its observable behaviour and failure boundaries. Reuse unit tests for validation, SQL tests for permissions and invariants, integration tests for promotion/export, and browser or generated-output checks for user journeys. Keep real and sensitive research data outside committed test fixtures.

`mise exec -- just verify-static` runs static checks, types, unit tests and both application builds. `mise exec -- just verify` also runs database verification and generated-type checks. Full database verification resets the local test database; use a disposable local stack with no research data to preserve. For website changes, run `mise exec -- pnpm --filter @mosa/website test` and `mise exec -- just website-build`; the build also verifies generated output. Run the production HTTP checks documented in the [website README](../apps/website/README.md) when routes, redirects or serving behaviour change.

Release migrations before code that depends on them. Keep existing v1 imports and read-only explorer views working unless an explicit migration replaces their contract. Test repeat imports after write-path changes. Do not apply fixture SQL or local reset procedures to staging or production.

## Decisions to resolve at the relevant step

| Decision | Responsible participants | Required before |
| --- | --- | --- |
| Authoring app boundary | Maintainer | Step 2 |
| Pilot dossier and permitted content | Researcher and relevant publication authority | Real pilot capture/publication |
| Authentication and permission assignments | Maintainer and research team | Step 2 |
| Private source storage, retention and capture limits | Maintainer and source contributors where applicable | Step 3 |
| Public fields, editorial naming and translation authority | Editorial team and relevant collaborators | Step 6 |
| Required withdrawal deadline and operational owner | Publication authority and maintainer | Step 9 launch |
| External AI processing permissions and provider | Research team and relevant source authority | Step 10 |
| Case access and operational workflow | Community representatives and case workers | Step 12 |

These decisions do not block documenting or developing with synthetic examples. Do not infer permission for real material from a successful technical test.
