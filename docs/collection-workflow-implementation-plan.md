# Deliver human and agentic discovery in working slices

## Objective and status

Implement the [human and agentic discovery design](agentic-collection-discovery.md) through narrow vertical slices. People and agents can both discover sources and prepare records. Both flows use the same evidence, human acceptance and canonical importer. Publication remains a separate decision.

Updated 2026-09-22. This is the current delivery and commit plan. It replaces the earlier manual-first expansion sequence, including the requirement to defer AI until a broad manual editor exists. The completed pilot remains the baseline. None of the new slices is implemented merely because its design or commit message exists.

The project owner authorised implementation of slices 1–5 and commits on 2026-09-22. Work runs on `codex/discovery-slices-1-5`. This authorises local demonstrations as the researcher; production publication remains separate.

## Existing baseline

Inspected checkout: `fcd5d80`, including `5dc44c3` capture/publication reliability fixes. The working tree also contains the discovery design and documentation links.

Already implemented:

- Invited sign-in, author-private URL drafts, manual preparation, identity confirmation and explicit acceptance in the research app.
- Shared validation, identity resolution and transactional canonical writes in `packages/object-dossier/`.
- Packet versions 1 and 2, including names, classifications and descriptions. Sources are HTTP(S) references; files and immutable evidence-version references are not yet supported.
- Research explorer, static public website, publication ledger, dependency checks and withdrawal. The public contract permits at most two records and requires an evidenced name, holder and catalogue identifier.
- Database, importer, application and publication regression checks.

Live evidence remains outstanding for researcher email-code sign-in, reopening a private draft and the real second-object publication/withdrawal demonstration. The project owner previously confirmed research deployment; that does not complete these checks. Use [source capture](source-capture.md) and [collection publication](collection-publication.md) for operations. Inspect existing configuration before provisioning anything again.

## Delivery and commit rules

1. Deliver one observable user task per slice, including its minimum persistence, access rules, interface and recovery behaviour. A migration, worker or screen alone does not complete a slice.
2. Use one feature commit per slice by default. Include its migration, types, application changes, tests and operating documentation. Do not separate tests from the behaviour they verify.
3. If a slice needs several commits, split it at another usable outcome and record that boundary before implementation. Avoid preparatory framework or schema-only commits without a concrete consumer.
4. Keep commits buildable. Apply additive migrations before deploying consumers; retain compatibility with the previously deployed app. Do not reverse data-bearing migrations as routine rollback.
5. Keep human preparation available without AI credentials, model calls or autonomous campaigns. Automated work can add proposals but cannot accept or publish them.
6. Preserve packet v1/v2 replay behaviour, identifiers and accepted evidence. Do not rewrite historical checksums or claim old URL evidence was archived.
7. Use synthetic files and records in committed tests. Keep Paula's PDF, CSV, private transcriptions and credentials outside Git.
8. Record source author, contributor, preparer, model/service and reviewer separately. Retain contribution history across hand-offs.
9. Keep the public snapshot and approvals intact unless a separately authorised publication operation changes them.

All planned subjects are lower case, scoped Conventional Commits under 72 characters. Reuse `research` for research contributions and `collection` for shared direction and public behaviour. Keep repository hooks enabled.

## Current implementation checklist

| Slice | Working outcome | Dependencies | Planned commit |
| --- | --- | --- | --- |
| 1 | Save and reopen an original PDF privately | Existing sign-in | `feat(research): preserve uploaded source documents` |
| 2 | Prepare and accept one object from that PDF | 1 | `feat(research): accept document-backed object records` |
| 3 | Preserve a catalogue page and cite its saved version | 2 | `feat(research): capture catalogue source versions` |
| 4 | Request AI preparation for one saved source | 3 | `feat(research): prepare claims from saved sources` |
| 5 | Find sources from one lead and prepare a review candidate | 4 | `feat(research): discover records from a research lead` |
| 6 | Reconcile PDF/CSV entries into traceable research leads | 2; uses 5 when available | `feat(research): reconcile inventory rows with source pages` |
| 7 | Share a campaign between researchers and an agent | 5 | `feat(research): share discovery campaigns for review` |
| 8 | Accept a selected batch with recoverable item outcomes | 7 | `feat(research): review selected candidate batches` |
| 9 | Correct an accepted statement without erasing history | 2 | `feat(research): correct accepted claims with history` |
| 10 | Search more than two approved records, including partial ones | 2 and 9 | `feat(collection): publish an expanded finding catalogue` |
| 11 | Find additional objects across one museum catalogue | 5 and 8 | `feat(research): expand discovery within a catalogue` |
| 12 | Review changes to an upstream record | 3, 4 and 9 | `feat(research): review changes to captured sources` |

Slices 1–5 are in implementation; slices 6–12 remain planned. Local checks and demonstrations use an isolated database, not the existing local research store. Production deployment has not been performed.

Local delivery evidence: slice 1 passes `just verify-static` (197 unit tests and both builds) and `just test-db` against the disposable `mosa-discovery-test` stack. Built-app checks exercise PDF upload/download, cross-user denial, checksum-preserving retry and interrupted finalisation. Storage/Auth HTTP substitutes are used; hosted Storage and production sign-in are not verified by this demonstration.

Start with slices 1–5 to establish both complete contribution flows. Slice 6 can follow slice 2 when inventory entry is the immediate need. Slices 9 and 10 can also follow slice 2: public usefulness must not wait for shared campaigns, batch review or catalogue expansion. These dependencies permit independent work; they do not require parallel agents or separate implementations.

Before the feature commits, group the design and plan into one documentation commit:

`docs(collection): plan human and agentic discovery slices`

That commit includes the discovery design, this plan and their README/workflow links. It records direction without claiming feature delivery.

## Slice 1 — Save and inspect an original document

**User task:** an invited researcher uploads a PDF, gives it a working citation and reopens the unchanged file from their private source list.

**Implement:** bounded PDF upload, private immutable storage, hash/media type, original filename, contributor/upload time, optional author/date fields, source list/detail pages and an authorised file response. Use existing research authentication. Begin with owner-private sources. Set an initial 20 MB request/file ceiling and document it. Validate the PDF signature and declared type. Serve uploaded content without application privileges.

**Done when:** reopening a synthetic PDF returns identical bytes; another researcher and an unauthenticated request cannot retrieve it; retrying the upload request returns the same source/version. Invalid or oversized uploads produce an error without a successful source record. Interrupted storage/database finalisation can resume or remove an unreferenced upload. The owner can hide an unused source without deleting referenced evidence.

**Scope:** research source routes/services, migration/policies, private Supabase storage integration, database types and capture runbook. No OCR, CSV reconciliation or canonical claim import is required.

**Commit:** `feat(research): preserve uploaded source documents`

## Slice 2 — Enter one object from a document without AI

**User task:** a researcher selects a saved PDF, transcribes a statement, cites its location, confirms object identity and explicitly accepts the record into research.

**Implement:** source selection, page/region locators and multiple regions for cross-page descriptions or inherited context. Add packet v3 for immutable source-version references and resolvable internal document references. Preserve v1/v2 behaviour. Reuse name/type/description choices and optional custody/identifier fields. Display accepted citations in the dossier.

**Done when:** a PDF-backed object with an evidenced description and no holder/identifier appears in research. Acceptance records the reviewed revision and evidence atomically; stale review fails; retry returns the original result. Unresolved identity remains a draft. Private files stay private after acceptance; only citation/excerpt content authorised for the research audience becomes visible. The complete task succeeds with AI unconfigured.

**Scope:** capture model/store/form, shared packet/schema/validator/importer, evidence-version migration and dossier evidence display. Do not fabricate public URLs for uploads. A source can describe several objects; source identity is not object identity.

**Commit:** `feat(research): accept document-backed object records`

## Slice 3 — Preserve one catalogue page

**User task:** a researcher submits a public catalogue URL, inspects the captured version and manually prepares an object using that version as evidence.

**Implement:** bounded background capture with visible queued/succeeded/failed status, response bytes, retrieval manifest, content hash and readable derivative. Start with ordinary HTML and JSON. Check public destinations and redirects, request duration and byte limits. A login page, challenge or empty application shell is a failed usable capture, even after HTTP 200. Show archived content inertly; retain references when capture fails.

**Done when:** a researcher can cite the saved version after the upstream page changes; a changed capture creates a new version; earlier evidence keeps its version. Duplicate attempts and worker restart do not duplicate results. Capture failure leaves existing manual reference-based work available. Private-network and redirect bypass tests fail closed.

**Scope:** source services/UI, a small worker entry point, durable job state, constrained fetch service and private storage. Add only the lease/retry behaviour required here. No browser automation, crawler or search provider is required.

**Commit:** `feat(research): capture catalogue source versions`

## Slice 4 — Request preparation for one saved source

**User task:** a researcher selects **Prepare with AI** on a saved catalogue source, then edits, rejects, defers or accepts its candidate through the existing review flow.

**Implement:** one configured model provider and bounded extraction. Produce validated proposals for the existing summary predicates, with quotations/field locators and source-version references. Retain unsupported observations. Record model, prompt, method and human edits. Check literal evidence against preserved content. Require permission for external-model processing before sending source material.

**Done when:** the proposal uses the same acceptance path as human preparation; unsupported or invented evidence cannot be accepted; failure leaves the source and human form usable. Worker credentials cannot write accepted claims or publication decisions. Re-extraction does not overwrite edits or duplicate accepted objects. Demonstrate a human-prepared and an AI-prepared record from the supported source format.

**Scope:** preparation action, worker handler, proposal validation and contribution history. Use synthetic captures and fixed model responses for tests, plus a recorded live provider demonstration. Open-ended discovery is not included yet.

**Commit:** `feat(research): prepare claims from saved sources`

## Slice 5 — Discover records from one lead

**User task:** a researcher enters an institution and object description, starts discovery and receives preserved sources and prepared candidates for review.

**Implement:** one search provider, a bounded agent loop and reuse of slices 3–4. Store queries, source references, match reasons and stopping reason. Require positive request, model-cost/token and elapsed-time ceilings; reject unbounded runs. Distinguish no match, ambiguity, blocked access, parsing failure and budget exhaustion. Limit preparation to supported formats. Use initiating-researcher access for this first run.

**Done when:** a live lead produces a reviewable candidate with preserved evidence; an ambiguous result remains unresolved. Pause prevents new work after the current bounded operation; resume uses saved progress. Restart/repeated results do not duplicate candidates or exact catalogue identities. Source instructions cannot expand permissions or trigger canonical writes. Demonstrate a hand-off in each direction without copying source or candidate records.

**Scope:** lead/status UI, worker orchestration and search adapter. No institution-wide crawling or automatic publication. By this slice both human-led and agent-led discovery-to-import journeys work.

**Commit:** `feat(research): discover records from a research lead`

## Slice 6 — Turn the PDF and CSV into reconciled leads

**User task:** a researcher attaches the CSV derivative to its original PDF, checks the interpretation and releases selected entries as research leads or human-prepared candidates.

**Implement:** private CSV upload, derivative lineage, encoding preview/selection, row identities and a reconciliation screen. Show raw cells beside interpreted values and PDF locators. Offer reviewer-controlled inheritance, grouping/splitting and cross-page joining. Record each inherited field's donor cell. Distinguish headings, notes, spacers and genuine blanks. Human-selected PDF regions are sufficient initially; general table recognition is not required.

**Done when:** all 179 supplied CSV rows remain addressable; joining the page 17–18 description preserves both rows and PDF regions; institution boundaries prevent location carry-over; seven institution-only entries remain leads. Repeated-looking entries are not automatically merged. Reprocessing preserves reviewed reconciliation and does not duplicate candidates. Display raw row, reconciled entry and accepted object counts separately. PDF and CSV contribute one evidence lineage.

**Scope:** derivative import, reconciliation records/UI and lead submission. Commit synthetic equivalents, with a private demonstration using Paula's files. The slice works without AI; **Discover records** becomes available when slice 5 exists.

**Commit:** `feat(research): reconcile inventory rows with source pages`

## Slice 7 — Share a campaign and hand off preparation

**User task:** a researcher shares selected work with an authorised collaborator, who continues preparation and reviews human or agent contributions in one inbox.

**Implement:** campaign membership and explicit submission of selected sources/candidates. Reuse records and versions. Enforce access to both records and files. Keep unrelated private drafts private. Record preparation, edit, assignment and review actors separately. Check revisions when collaborators act on the same candidate.

**Done when:** a collaborator can continue the campaign without seeing unrelated drafts or restricted content. Revocation blocks subsequent reads/writes. Hand-offs retain evidence and edits; concurrent review rejects stale revisions. Human contributions outside campaigns remain available.

**Scope:** campaign/inbox routes, membership/visibility policies, source access and worker campaign identity. Use a small fixed permission model. Do not grant a worker a researcher's acceptance authority.

**Commit:** `feat(research): share discovery campaigns for review`

## Slice 8 — Review a selected batch

**User task:** a reviewer inspects prepared candidates and accepts explicitly selected supported proposals without re-entering source information.

**Implement:** side-by-side evidence, readiness reasons, keyboard navigation and selected batch acceptance, initially up to 20 candidates. Uncertain claims remain unselected. Commit each candidate transactionally, store per-item outcomes and resume interrupted batches. Reuse institution/namespace decisions without bypassing object identity checks.

**Done when:** a mixed human/agent batch creates exactly the selected accepted records; deferred proposals remain available; a stale candidate fails individually; retry does not duplicate completed items. Measure preparation and review time on a small real cohort. Explain missing/ambiguous fields without using a confidence threshold as approval.

**Scope:** shared inbox, review UI and orchestration around existing acceptance. Do not introduce a second bulk importer or approve unseen future results.

**Commit:** `feat(research): review selected candidate batches`

## Slice 9 — Correct one accepted statement

**User task:** a researcher corrects a statement or adds another attributed account while retaining the earlier account and evidence.

**Implement:** explicit correction/disagreement choice, replacement proposal and controlled supersession. Preserve identity, evidence and reviewer history. Add only the write permissions this operation requires. Display current and previous statements. Changes to approved public content invalidate stale publication candidates and require a fresh publication decision.

**Done when:** correction supersedes the selected statement; disagreement preserves both; unauthorised/stale changes fail; retry returns the original result; acceptance and supersession roll back together on failure. A served snapshot is not reported as changed until separate publication or withdrawal succeeds.

**Scope:** capture/canonical-write services, narrow migration/permissions, dossier display and publication dependency checks. Consolidate duplicate claim-reading code only where this task touches it. No general graph editor is required.

**Commit:** `feat(research): correct accepted claims with history`

## Slice 10 — Publish an expanded finding catalogue

**User task:** a maintainer previews and approves a cohort, and visitors search useful partial records on the existing collection page.

**Implement:** a versioned public contract/exporter allowing more than two records, display labels with their name/classification/description basis, approved citations, optional identifiers and unresolved custody. Allow approved document citations without revealing private files or storage references. Extend existing collection rendering/search. Keep source wording and reviewed translations distinct. Permit individual withdrawal from larger releases.

**Done when:** a synthetic release contains at least three records, including a document-backed description without an identifier/holder and an existing v1-style card. Retain the existing card's approval without silently approving changed dependencies. Missing fields render honestly. Withdrawal removes one item from every current public collection/search surface while retaining others. Private excerpts/references do not leak through citations, search or counts. Demonstrate a real authorised release separately.

**Scope:** public contract, publication services/ledger compatibility, website collection adapter/template/search and integration checks. Preserve old snapshots or explicitly migrate them without inventing approval. Use the existing release operation. Public dossier routes, downloads and images remain separate follow-ups.

**Commit:** `feat(collection): publish an expanded finding catalogue`

## Slice 11 — Expand one museum catalogue

**User task:** a researcher selects a productive institution and obtains candidates beyond the original seeds.

**Implement:** one documented API or catalogue adapter with pagination, preserved upstream identifiers and checkpointed enumeration. Configure institution/query scope, budgets and review-backlog limits. Use exact catalogue identifiers as strong match signals. Preserve qualified associations and unsupported fields.

**Done when:** a run finds a relevant object absent from the seeds; resume continues enumeration; repeated pages/mirrors do not inflate object counts. Budgets or queue-capacity limits stop new acquisition. Every candidate retains its source and discovery path.

**Scope:** one adapter, campaign configuration and existing pipeline. Choose the catalogue after verifying access/coverage. Do not implement every institution or introduce a vector database for this task.

**Commit:** `feat(research): expand discovery within a catalogue`

## Slice 12 — Review a changed source

**User task:** a researcher refreshes a captured catalogue record, inspects changes and proposes a correction or another account.

**Implement:** explicit refresh, an immutable version when content changes, extraction against that version and an observation/proposal diff. Preserve earlier evidence and human decisions. Reuse slice 9 for accepted changes. Retain unchanged retrieval observations without duplicating content or claims.

**Done when:** changed content creates review work without rewriting claims; unchanged content creates no duplicate proposal; unavailable pages retain earlier captures and report failure; rejecting changes preserves the accepted account. Publication still requires separate approval. A refresh concurrent with human editing does not overwrite the human revision.

**Scope:** capture/extraction jobs, version comparison and changed-source review. Scheduled refresh is a later opt-in extension.

**Commit:** `feat(research): review changes to captured sources`

## Verification and release evidence

Include focused unit tests for parsing/contracts, database tests for access/revisions/writes, and built-app tests for the user task. Use model/search/fetch substitutes for deterministic failures. Live provider checks establish connectivity and usefulness, not acceptance or publication authority.

Run `mise exec -- just verify-static` for completed feature slices. Changes to database contracts/permissions also require database/type checks. Run `mise exec -- just verify` only against a disposable local database: it resets local data. Preserve local research first. Do not run reset suites concurrently against the same stack.

For publication changes, run existing publication integration checks and `mise exec -- just collection-website-verify` sequentially. The latter temporarily replaces the snapshot and rebuilds the site. Reuse passing checks for the same revision unless new changes or unresolved concerns justify rerunning them.

Record each slice's commit, checks, demonstration outcome, limitations and deployment status. Production release additionally requires affected migrations/configuration and live access checks. A local demonstration does not establish production deployment.

On failure, pause the affected new action/worker and retain sources, drafts and accepted records. Keep additive migrations in place. Use the existing publication withdrawal/recovery procedure for public changes. Rollback must not restore withdrawn content or broaden file access.

## Decisions to resolve when needed

- Before slice 1 deployment, verify private storage configuration and credentials. Local implementation and synthetic tests can proceed independently.
- Before slice 4 live extraction, select the model provider, limits and source-processing policy. Keep provider assumptions out of human preparation contracts.
- Before slice 5 live discovery, select a search provider and concrete lead; configure finite budgets and source scope.
- Before slice 10 live publication, identify the authorised cohort, decision-maker and withdrawal requirements. Upload does not imply publication permission.
- Before slice 11, choose a catalogue adapter from observed discovery yield and permitted access.

These decisions do not block the plan or unrelated slices. Record them in the relevant runbook when made.

## Follow-up slices triggered by demonstrated need

The twelve slices deliver both contribution flows, reviewed inventory growth, corrections and a broader public collection. Add separate later slices for public dossier pages/downloads, opt-in scheduled refresh, browser-only catalogues, OCR, reference-only archival entry and recurring ontology gaps such as provenance events. Each needs a named user task, acceptance checks and scoped commit. Do not bundle these into source upload or initial agent discovery.

### Slice 2 delivery evidence — 2026-09-22

Implemented document-backed preparation, packet v3 and exact evidence-version references. The synthetic PDF flow passed built HTTP acceptance with two page regions, no holder or identifier, explicit consent and idempotent retry. Legacy importer, publication, migration, database and unit checks pass. The claim page exposes the cited version to authorised source owners. No AI configuration is required.

### Slice 3 delivery evidence — 2026-09-22

Implemented a Supabase Postgres job queue, restricted worker login, private Storage snapshots, retrieval manifests, readable HTML/JSON and source-page progress/retry. Static checks and 202 unit tests pass. Database/import/publication regressions pass; focused worker and built HTTP checks pass, including immutable recovery, expired leases, changed versions and manual preparation from a captured page. Live museum access remains site-dependent; no hosted worker has been deployed.

### Lean Supabase execution — 2026-09-22

Following the owner's request, replace the standalone polling process with Supabase Queues and Supabase Cron invoking one bounded operation in the existing app. Remove the standalone executable and its command. Preserve source/job history and restricted runner credentials. This adds one usable refinement commit: `refactor(research): use supabase for background job delivery`. Scheduling remains a deployment operation, not a side effect of schema migration.
