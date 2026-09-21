# Deliver the collection through successive vertical slices

## Objective and status

Implement the [agreed collection workflow](collection-workflow.md) through small, usable releases. Each slice completes a user task across the required data, permissions and interface layers. Implement only the infrastructure that task needs.

Status: slice 1 is implemented and production publication is configured. The empty release has been verified live and the approved Hoa Hakananaiʻa export is committed; the publication ledger records which release is live. Later slices are planned. Updated 2026-09-21. This sequence replaces the previous plan's nine preparatory steps before a first manual release. The product direction remains source capture, identity confirmation, claim review, research dossiers and authorised public presentation. The delivery sequence starts with existing research data so that the website becomes useful sooner.

## Baseline

The baseline is `main` at `a9000f6`. It already contains:

- A [transactional importer](../scripts/lib/object-dossier/import.ts), [identity resolution](../scripts/lib/object-dossier/resolve.ts), [validation](../scripts/lib/object-dossier/validate.ts) and [v1 packet contract](../schemas/object-dossier-packet.schema.json).
- A [read-only explorer](../apps/explorer/) and research projections.
- A [static website](../apps/website/), with a [collection adapter](../apps/website/src/data/site.ts), [collection page](../apps/website/src/templates/collection.astro) and [institution listing](../apps/website/src/templates/visit.astro).
- [Foregrounded-claim selection](../supabase/migrations/20260831120000_create_foregrounded_claims.sql), which does not establish publication permission.
- [Bootstrap dossiers](../packets/bootstrap/README.md), which are neither proof of a production import nor publication approval.

## Delivery rules

1. Finish a slice with a demonstrable user outcome and its correction or removal path. A schema, exporter or authentication shell alone is not a completed slice.
2. Use existing tools for tasks that do not yet need a new interface. Maintainer-run commands are acceptable in slice 1; researchers stop needing packets for the bounded task in slice 2.
3. Keep claim acceptance, editorial foregrounding and publication authorisation distinct from the first release. The same person can perform those actions, but one action does not imply another.
4. Restrict each slice to its stated content types and operations. Do not build a general workflow engine, role designer, source processor or ontology editor in anticipation of later slices.
5. Preserve working slices while extending contracts. Add permissions, source types and publication fields when a delivered task requires them.
6. Use synthetic content for development and tests. Release real content only after the responsible person has authorised the particular public material.

## Release sequence

| Slice | User outcome | New capability |
| --- | --- | --- |
| 1 | A visitor can identify one real object, its reported holder and its source. | Existing research dossier to a public collection card; withdraw it. |
| 2 | A researcher can add another object from a catalogue URL without writing JSON. | One authenticated capture, identity and manual review flow feeding the same publication path. |
| 3 | A researcher can correct or add a conflicting account; a visitor can inspect the evidence. | Ongoing dossier review and a public item page. |
| 4 | A researcher can use a local document, photograph or archival reference. | Preserved source versions and non-URL evidence through review and publication. |
| 5 | A researcher can explain one reported removal or transfer. | One provenance event from entry to public timeline. |
| 6 | A researcher can review machine-proposed claims instead of transcribing every field. | AI proposals through the established manual review path. |
| 7 | A case worker can record a restitution request and the next action. | A bounded private restitution workflow and an optional authorised public update. |

This is the default order. Slices 5, 6 and 7 can be reprioritised after slice 4 from actual research needs. Restitution does not depend on AI or a complete provenance history.

## Slice 1 — Put one real object on the collection page

Implementation and operation: [publication runbook](collection-publication.md). The project owner has authorised the bootstrap dossiers. Canonical research imports and deployment credentials are configured; the committed export contains only the selected Hoa Hakananaiʻa fields.

### User task

A visitor opens the existing collection page, sees one research-backed record, identifies its reported holder and catalogue number, and follows its source. A maintainer can remove that record from every public collection surface.

This is the smallest useful release. It does not require a new item page, authoring UI, login system, AI, uploaded files or images. It proves the real database-to-website connection and the publication boundary using the existing importer and deployment process.

### Scope

Choose one uncomplicated, publication-authorised dossier with an existing URL source. Hoa Hakananaiʻa is a possible candidate because a bootstrap packet exists; do not assume its claims or imagery are approved. Verify whether the record is already imported. If necessary, use the existing importer after review, then verify that repeating the import produces a no-op.

Publish only:

- Stable item identity.
- One explicitly selected, attributed name and its language, when known.
- One reported holding institution, with its authorised label and attribution.
- One institutional identifier and its namespace.
- The permitted source link or links supporting those displayed statements.

Do not infer a geographical location from the holder. Do not export origin, images, source excerpts, translations of research statements, classifications or provenance in this slice. Existing interface copy remains in Chilean Spanish and British English; the same original name appears in both versions.

### Implementation order

1. Define a small, versioned public-card schema and one synthetic example. Reference the exact claims, evidence, related labels and identifiers used to produce the card. Reject unknown fields rather than passing through whole database rows.
2. Add a maintainer-run command that prepares a private candidate from those explicit research records. Use existing authorised research access for preparation; do not give that access to the website. Do not select an arbitrary display label or export all active/foregrounded claims.
3. Add a durable publication manifest in a private, access-controlled location outside public output. Record the selected record IDs, an exact content fingerprint including dependencies, decision-maker, UTC time, basis of publication authority, and active/withdrawn status. The maintainer records the actual decision; a hash alone does not establish permission. Store the reviewed snapshot immutably. The manifest selects and authorises content; it is not a hand-maintained copy of catalogue facts.
4. Separate candidate preparation from approval and export. The trusted export operation emits only a snapshot matching an active manifest and unchanged selected research dependencies. Changed dependencies require a new review; no silent refresh of an approved card. Export generation itself does not require broad database access beyond the trusted validation boundary.
5. Feed that JSON into the existing website collection adapter. Render a text-only card with attribution, catalogue identifier and source links. For this release, the public research list consists of the selected record; remove the six design reference records from the public catalogue rather than silently mixing them with research output. Keep design fixtures in development/test examples if useful.
6. Update every consumer of the collection adapter, including the institution listing and search/count data. Omit unavailable locations and hide unsupported concept/type filters. Reconcile homepage links into those filters so that they do not promise unsupported results. Leave unrelated editorial pages unchanged.
7. Build and preview both language versions, then use the existing manual deployment path. Record which snapshot is live. Gate promotion on a current manifest check and serialise publication/withdrawal operations so that an older build cannot overwrite a withdrawal. Audit rollback and alternate deployment paths for the same rule.
8. Implement withdrawal by marking the manifest withdrawn, rebuilding the permitted remainder and deploying it. Verify that the card, institution entry and search data are removed. A valid empty collection is required; never fall back to reference records or a stale snapshot. A missing or invalid export is a build error, not an empty collection.

### Demonstration and acceptance

- A visitor can answer “What is this object, who reportedly holds it, and which record supports that?” without JavaScript.
- Both language routes retain their navigation and language-switch behaviour. Source wording and proper names are not automatically translated.
- The public build contains only the selected fields. A restricted name, private note and unselected claim seeded in the test dossier are absent from HTML, JSON, search and logs shipped to the browser.
- The card has no broken image, invented location, fabricated classification or implied ownership statement.
- Changing a selected claim or its displayed dependencies makes the old approval ineligible for a new deployment. The currently served snapshot does not disappear until a replacement or withdrawal is deployed; document that limitation.
- Withdrawing the record removes it from the served collection and all derived listings. A concurrent old build and a rollback to the old snapshot are rejected. Report removal as complete only after checking the served output.
- Agree a removal deadline with the publication owner before public release and demonstrate that the existing deployment path meets it. If it cannot, keep the pilot private until the serving path can enforce withdrawal in time.

**Release evidence:** one authorised card live, its supporting research references, the live snapshot identity, a successful withdrawal rehearsal and a short maintainer runbook. Application accounts, source storage workers and a general publication UI are not release prerequisites.

## Slice 2 — Add another object from a URL

**User task:** a researcher adds a catalogue URL, confirms the object identity, enters a name, holder and identifier with evidence, reviews the proposed record and submits it for publication through slice 1.

1. Add one authenticated capture/review flow in the research application. Confirm the application boundary before coding; extending `apps/explorer` is the default proposal. Keep the reader routes working.
2. Persist a small private draft containing the URL, retrieval/check time, provisional workspace label, optional institution/identifier and lead note. Record proposal and review revisions. Do not add canonical preferred-name or notes columns.
3. Search exact identifiers and known source references. Show candidates with names, institution, identifiers and match reason. Let the researcher link, create or defer. Names never cause a silent merge.
4. Let the researcher enter `has_name` and `held_by` proposals with source relationship, locator, excerpt and asserting agent when known. Create required agent labels contextually. Use a source link and recorded excerpt initially; full webpage capture and automatic fetching are deferred to slice 4.
5. Provide accept, edit, reject and defer actions in the same small flow. Generate validated packets internally and reuse the canonical write logic. Refactor the importer boundary so canonical writes and the promotion record commit together; `runImport` currently owns its transaction, so an outer transaction alone is insufficient.
6. Audit broad authenticated database policies and enforce server and direct-access permissions for this operation. An ordinary capture user cannot publish. Use revision checks and request identities to prevent stale overwrites and duplicate promotion.
7. Display the accepted dossier in the existing explorer and prepare its public candidate through slice 1. The publication decision can remain maintainer-run. Rejection and deletion of unpromoted drafts do not alter canonical research.

**Acceptance:** a researcher adds the second object without editing JSON or seeing UUIDs. A duplicate identifier does not create a duplicate object. A deferred identity creates no canonical object. Rejected proposals create no claims. Retrying an acceptance creates one claim/evidence set. An unauthorised direct request cannot read drafts, promote claims or publish. The resulting card can be published and withdrawn through the existing path.

**Not in this slice:** a general review queue, all predicates, a new permissions management UI, automatic extraction or public item pages.

## Slice 3 — Correct a dossier and show competing accounts

**User task:** a researcher adds another source, corrects an error or records a conflicting account. A visitor follows a collection card to understand the permitted accounts and evidence.

1. Extend the existing draft/review flow to an existing item. Distinguish correction/supersession from another attributed account; preserve both histories.
2. Add origin and current-place proposals using the existing `made_at`, `found_at` and `located_at` meanings. Keep missing values valid. “Removed from Orongo” alone does not support `found_at` or `made_at`; defer the event until slice 5.
3. Add research coverage metadata for the questions now shown. Separate not researched, in progress and researched but not established. Visibility and disagreement are separate concerns; do not infer or expose private research activity through empty states.
4. Add a stable public item route in each supported site language and link cards to it. Use the ADR 011 origin, current location, documents and provenance sections; label gaps in the public record without revealing restricted material.
5. Extend the explicit public contract and review manifest only for the new fields. Preserve competing authorised accounts and their individual evidence. Reuse foregrounding for editorial selection, add actor/time history, and intersect it with publication permission. A claim's acceptance or prominence still does not publish it.
6. Add authenticated preview using the export's projection rules. When a reviewed translation is added, link it to the original revision; source changes require renewed translation review. Publish original wording when no translation is available.
7. Publish the correction and exercise withdrawal of the item page, its card, search/sitemap entries and dependent translations.

**Acceptance:** a correction does not erase the earlier research record, and disagreement does not silently overwrite a claim. A visitor can distinguish two published accounts and follow their sources. The page supports missing origin and absent imagery. Private evidence, labels and counts remain excluded. A changed revision cannot inherit approval; withdrawing a dependency invalidates its public derivatives.

## Slice 4 — Use a local document or archival source

**User task:** a researcher adds a file, photograph or archival reference, reviews a claim against it and publishes only the permitted account or excerpt.

1. Add private file storage and immutable source versions with hash, media type, capture time, original reference and access conditions. Add archival references that explicitly record when no digital copy is held.
2. Extend the versioned import contract for non-URL sources and version-linked evidence. Preserve the meaning and repeatability of v1 imports; do not fabricate public URLs for private files.
3. Add source viewing and manual page, timestamp or visual locators to the existing review flow. A replaced file creates a new version; earlier evidence continues to target the earlier version.
4. Add webpage preservation for URL captures using the same versioned-source path. Separate draft saving from background capture; show failures and retry without losing the draft. Restrict fetch destinations and redirects, and configure file-size, media-type and timeout limits.
5. Extend publication decisions to distinguish claims, citations, excerpts and files. A public claim does not grant access to the whole supporting document. Add public media derivatives and contextual alternative text only when permitted and useful for this pilot.
6. Complete publication and withdrawal for the permitted excerpt or derivative, including removal of obsolete files and applicable caches.

**Acceptance:** a local file and a reference-only source each support a reviewed claim without a public URL. An unauthorised request cannot retrieve the private original. Repeated capture does not duplicate an identical version. A failed capture retains the draft. Withdrawing a source version removes its dependent public outputs without deleting the private research history.

Deliver this slice before expanding automated extraction or bulk institutional imports. The short URL-only path in slice 2 is an incremental release, not the long-term definition of admissible evidence.

## Slice 5 — Explain one removal or transfer

**User task:** a researcher records one source-reported event; a visitor sees the authorised account in the item's provenance section.

1. Extend the write contract for an event anchor, structured date, role claims and evidence, using the existing provenance model.
2. Build one event form for what happened, when, places, participants and source characterisation. Compile its records internally.
3. Keep relocation distinct from transfer, uncertain dates distinct from exact dates, and movement origin distinct from findspot. Preserve descriptions such as “removed” or “gifted” as attributed claims.
4. Review, select, authorise and render the event through the existing dossier/publication path. Correct and withdraw event claims without withdrawing unrelated authorised item fields.

**Acceptance:** one evidenced event travels from the form to a public timeline. Partial dates retain precision. A transfer does not imply title, consent or physical movement. Unresolved accounts remain separate until explicitly reconciled. Withdrawing event content removes its public timeline entry and dependent search text.

## Slice 6 — Review AI suggestions from one source

**User task:** a researcher selects an eligible source, reviews suggested name or custody claims and publishes the accepted result through the existing process.

1. Confirm permission for the source's external processing before choosing or invoking a model. Storage permission does not imply permission to send material to an AI provider.
2. Start with the summary predicates already supported by the manual form. Generate proposals referencing source versions and exact evidence locators.
3. Record model, prompt version, method and extraction time separately from the source speaker. Give the worker no authority to merge identities, accept claims, publish or alter cases.
4. Reuse the existing accept/edit/reject/defer actions and publication path. Keep manual entry available after model failure or abstention.
5. Evaluate names, identifiers, conflicting accounts, ambiguous origin, colonial removal wording and sensitive sources before routine use. Treat document instructions as untrusted content, never application authorisation.

**Acceptance:** suggestions remain private proposals until reviewed; every accepted claim has source evidence. Ambiguous “from” wording does not silently become a manufacture or discovery claim. One reviewed suggestion becomes a published record and can be corrected or withdrawn. Report observed extraction errors rather than storing model confidence as factual authority.

## Slice 7 — Record a restitution request and next action

**User task:** an authorised case worker records a request, source document and next action; an optional authorised public update appears on the item page.

1. Review the existing Phase 3 case model with a case worker. Choose one real task and define access to parties, contacts and correspondence.
2. Add the smallest forms and validated operations for the case, relevant parties, one action, linked document and next action. Reuse the current case constraints. Add workflow states only when the chosen task demonstrates a need and their meaning is documented.
3. Keep case material private by default. Publish a selected update only through an explicit extension of the public contract and publication decisions.
4. Demonstrate correction and withdrawal of that update without changing historical custody/provenance claims or disclosing correspondence.

**Acceptance:** a case worker can answer what was requested and what happens next. An unauthorised user cannot retrieve documents through direct requests. Public output contains only the authorised update. Case status does not imply moral or legal validity. This slice requires neither AI nor complete provenance.

## Verification and release discipline

Each slice includes the migrations, contract changes, interface, tests and operational instructions needed for its user task. Do not move the slice's publication or removal work into an unspecified later release.

Use unit tests for validation, SQL tests for permissions/invariants, integration tests for promotion/export, and generated-output or browser checks for the visible journey. Test boundary failures relevant to the slice: duplicate identity, stale review, partial writes, restricted values, stale export and withdrawal. Keep real or sensitive material outside committed fixtures.

Run `mise exec -- just verify-static` for static checks, types, unit tests and application builds. For website changes, also run `mise exec -- pnpm --filter @mosa/website test`; the website build verifies generated output. Use the [website HTTP checks](../apps/website/README.md) when serving or routes change.

`mise exec -- just verify` also runs database verification and generated-type checks. It resets the local test database: use a disposable stack without research data to preserve. Never apply fixture SQL or local reset procedures to staging or production.

Publish migrations before dependent application code. Keep v1 imports and existing reader views working while extending the write contract. New public fields require explicit schema and publication review; never expose them automatically because they appeared in a research query.

Before each real release, demonstrate the user journey, check the served output, record its snapshot identity, and rehearse removal. When private source storage arrives, verify backup restoration in an isolated environment including source-version links and decision history.

## Decisions at the point they matter

| Decision | Required before |
| --- | --- |
| Pilot object, specific permitted fields and publication authority | Slice 1 public release |
| Private manifest location, maintainer access and withdrawal deadline | Slice 1 public release |
| Authoring app boundary, authentication and capture/review permissions | Slice 2 |
| Editorial naming and translation authority for new dossier content | Slice 3 |
| Source storage, retention, capture limits and permitted file access | Slice 4 |
| External AI processing permissions and provider | Slice 6 |
| Case access and the first operational restitution task | Slice 7 |

The unresolved decisions do not prevent implementation with synthetic data. Neither a successful build nor an existing bootstrap packet establishes permission to publish real material.
