# Roadmap

## Live verification

Existing records report an empty withdrawal release verified on 2026-09-21 and
research deployment confirmed by the owner on 2026-09-22. The committed public
snapshot contains Hoa Hakananaiʻa. None establishes today's deployed revision or
successful hosted sign-in/Storage. Recheck the actual services before claiming those outcomes.

- [ ] Confirm the deployed research revision and complete migration history.
- [ ] Demonstrate invited email-code sign-in and saving/reopening a private draft.
- [ ] Import one small real bundle, reopen its preserved source and retry the same
  bundle without duplicating drafts or losing edits. Verify cross-user denial.
- [ ] Verify the actual served public release using `just collection status` and
  the gated deployment evidence when a release is authorised.
- [ ] With explicit publication authority, demonstrate a real second object and
  individual withdrawal while retaining the existing approved record.
- [ ] Agree and rehearse the complete withdrawal deadline, including review,
  commit/merge, pinning, deployment and caches. The old timed empty-release
  rehearsal measured only part of that process.

## Open delivery work

| Outcome | Dependencies | Acceptance boundary |
| --- | --- | --- |
| Reconcile PDF/CSV inventory | Preserved documents | Raw rows, inherited context and joined regions remain traceable; selected reconciled entries become leads/proposals without AI |
| Shared research campaign | Existing private preparation/import | Explicit membership/submission, retained contribution history, revision checks and revocation; unrelated private work stays private |
| Selected batch review | Shared campaign | Inspect evidence, select candidates explicitly, accept each transactionally; item-level errors and resumable retries without duplicate acceptance |
| Correct accepted research | Existing acceptance | Separate correction from disagreement, preserve earlier evidence/history, reject stale/unauthorised changes and invalidate affected publication candidates |
| Extend public finding catalogue | Reviewed dossier publication and current deployment gate | Public search and downloads, per-excerpt authority, and editorial language review across every public surface |
| Expand within one catalogue | Local discovery and demonstrated review capacity | One permitted API/catalogue adapter, exact upstream IDs, finite budgets, checkpoint/resume and no duplicate counting |
| Review a changed source | Preserved versions and correction | Refresh creates a new immutable version when changed; review a diff without overwriting accepted claims or human edits |

Correction and further publication work can proceed before campaigns or shared batch review.
Keep manual preparation usable without model credentials.

### Inventory reconciliation requirements

The original private PDF is the citation; the supplied CSV is its derivative,
not independent corroboration. Previous inspection recorded 179 CSV data rows,
CP850 encoding and inventory pages 12–19. Verify those properties against the
actual supplied files before implementing reconciliation; use synthetic equivalents
in committed tests and never require private files in CI.

Preserve all raw cells, blanks and source anomalies. Keep interpreted values
separately as explicit, inherited, unspecified or ambiguous. Record source page,
region/bounding box and donor-cell locators for inherited institution/location.

- Inherit only within visually confirmed blocks, including checked page
  continuations. Repeated headers need a continuation check; section changes
  reset context. A new institution's missing location stays unresolved.
- Do not inherit object descriptions by default. Seven institution-only entries
  recorded on page 19 remain leads. Do not collapse similar rows or groups.
- Join the recorded page 17–18 split description of a 23 cm stone ending in
  `hombre pajaro`, retaining both regions and CSV records 147/148 (header counted
  as record 1). This known transcription split is not proof that other rows match.
- Preserve anomalous source wording, such as a reported museum/location pairing,
  separately from proposed researched corrections. Never silently fix geography.
- Keep many-to-many row/entry/candidate links, reconciliation revisions and review
  decisions. Report raw rows, logical entries, distinct accepted objects and public
  objects separately. Reprocessing must retain reviewed decisions.

A compilation can be evidence directly without a museum match when identity can
be distinguished and the selected wording is authorised. A discovered catalogue
record remains another attributed source. An institution association at an unknown
date does not establish current custody. Vague groups remain leads, not invented items.

### Shared preparation, identity and review

Retain separate identities for seed observations, source records, candidates and
canonical objects, including many-to-many links and match reasons. Catalogue URLs,
names and image resemblance generate possibilities; exact verified identifiers
are stronger signals. Institutional succession or spelling changes need evidenced
mapping and do not automatically establish continuous custody or identity.

Keep unsupported observations and a small mapping-gap list tied to the user
question each gap blocks. Do not invent predicates, Concept entities or migrations
in response to a failed mapping. Record original wording, source version, locator,
evidence relationship, asserting agent or unknown attribution, preparer/method and
reviewer separately. A copied aggregator is not independent corroboration.

Shared campaigns require database and Storage access enforcement, not only UI
filtering. Private drafts enter a campaign only by explicit authorised submission.
Separate preservation, model-processing and publication permissions. Restricted
material and its counts must not leak through shared search or exports.

Review should expose source evidence beside proposals and explain missing or
ambiguous fields in plain language. Start selected batch review with at most 20
candidates. Edits invalidate review; stale revisions fail individually. Record
per-candidate decisions and recover from partial batches. Human review of each
canonical candidate remains required; sampling or a second model pass cannot
replace it. Retain hand-off history without duplicating sources or candidates.

### Corrections and expanded publication

Correction supersedes a selected assertion with history; disagreement preserves
both accounts. Acceptance and supersession must be atomic and idempotent. The
served snapshot remains unchanged until a separate authorised deployment succeeds.

The version 2 contract permits a reviewed classification or description as a
display label without turning it into `has_name`. It retains the label basis and
attribution; holder, identifier, image or translation can be absent. Future
editorial work should distinguish source-check date from custody date in public
presentation when both are available.

Document citations and reviewed excerpts publish without private storage URLs.
Future permission controls should authorise claims, citations, excerpts, files
and translations at their own scope. A private file does not become public because a claim cites it.
Original-language material must remain identifiable; future research translations
need source-revision links and their own publication authority.

The exporter, ledger, parser, website and synthetic three-record release now
cover a document-backed description without a holder/identifier and a legacy
card. Preserve existing approvals without silently approving changed
dependencies. Extend single-item withdrawal checks to search and any future
downloads, with no restoration through stale exports.
Unresolved groups may later have a separately labelled leads view, not object counts.

### Discovery and source refresh

Select one adapter based on actual permitted access and observed yield. Local
sessions need finite scope, request/time/cost limits and recorded stopping reasons;
account/API credentials stay out of source metadata and committed bundles.
Keep failed, blocked, ambiguous and no-match outcomes. Do not bypass challenges or
substitute snippets/reconstructed content for preserved responses.

A future persistent run must checkpoint progress, retain completed work on pause,
resume without duplicate candidates and stop acquisition when review capacity is
exhausted. This requirement does not select a new hosted worker or provider.
Refresh must preserve earlier evidence, compare observations and leave unavailable
sources inspectable from saved captures. Re-extraction should reuse saved content
when only a parser/prompt changes. Unchanged content must not create duplicate proposals.

Measure useful distinct objects reviewed per hour of total human work, correction
rates, unresolved backlog, source diversity and cost per accepted object. Evaluate
clear, ambiguous and negative cases with human adjudication; model confidence and
raw page totals are not quality measures. Earlier 30-candidate evaluation and
50–100-object ambitions are planning targets, never reasons to lower evidence rules.

## Human decisions

| Question | How to resolve it |
| --- | --- |
| Who owns the mailbox, backup coverage, privacy notice, retention and response target? | Assign operational owners and verify receipt/reply; do not adopt example retention periods or a five-day promise |
| Which Spanish/English wording and Rapa Nui terminology/orthography are approved? | Complete [editorial review](website-content.md#pending-translation-and-review-work) with the relevant collaborators |
| Are Dutch outputs required by the grant? | Inspect the award letter and approved communication plan before adding a locale |
| What withdrawal deadline applies to a proposed public cohort? | Agree the deadline with its publication owner and measure the entire release path; add runtime enforcement if static delivery cannot meet it |
| Is a contributor-facing CMS needed, and under what hosting/control constraints? | Demonstrate an editing problem and trial representative tasks with actual editors before selecting a product |

No CMS was selected or trialled. Retain file-based editing unless a task deliberately
changes that decision. A future pilot should test bilingual editing, one event
reused across pages, authenticated preview, author/publisher separation, featuring
approved research by stable ID, withdrawal and export/restore. Decide required
revision review explicitly; do not reintroduce website approval gates from the
superseded CMS comparison. Current vendor recommendations need fresh research.

## Follow-ups triggered by demonstrated need

- Authorised downloads and images with credit, access controls and withdrawal.
- OCR, browser-only catalogues, reference-only archival entry and additional source formats.
- General interactive provenance and restitution authoring beyond local dossier packets.
- Opt-in scheduled refresh, multi-party correction/governance and foregrounding history.
- Research coverage states distinct from visibility: not researched, in progress,
  documented and researched-but-not-established; no exposure of private activity.
- First-class Concepts only through the competency criteria in
  [ADR 013](adrs/013-foreground-claims-and-defer-first-class-concepts.md).
- Contact forms only if observed barriers justify reconsidering
  [ADR 015](adrs/015-use-email-for-public-contact.md).
