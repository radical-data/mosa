# From sources to research dossiers and the public collection

## Status and purpose

Agreed product direction, recorded on 2026-09-21. Slice 1 is implemented and production publication is configured. The empty release has been verified live and the approved Hoa Hakananaiʻa export is committed. Later slices remain planned. See the [publication runbook](collection-publication.md) for release evidence and live-status checks.

MoSA needs a collection that researchers can populate and maintain, communities can use to identify displaced objects, and the website can present with attribution and publication permission. Deliver this through successive vertical slices. The first milestone is one existing research object appearing on the collection page with an attributed name, reported holder, institutional identifier and source, plus a working withdrawal path. Later slices extend that working connection back through researcher-facing capture and review.

This document records the outcome of the [data-entry discussion](data-entry-efficiency-discussion.md) and the subsequent discussion about connecting the collection to the website. The [implementation plan](collection-workflow-implementation-plan.md) defines the delivery sequence and acceptance criteria.

## Repository baseline

The baseline is `main` at `a9000f6`. It contains the claim, evidence, provenance and restitution models; the object-dossier importer; bootstrap packets; the read-only research explorer; the public website; and the foregrounded-claim implementation.

The website is a separate static Astro app with six curated reference records, Chilean Spanish and British English routes, and client-side collection filters. Those reference records are not a public projection of the research database. The existing `presentation.foregrounded_claim` selection and its active-claim view implement editorial salience, not publication permission or a complete editorial audit history.

Source preservation, draft authoring and proposal review remain planned capabilities. Slice 1 implements private publication decisions, restricted public export and gated deployment. Existing importer bookkeeping does not establish research review or publication approval. Bootstrap packets are import candidates, not evidence of production deployment or permission to publish.

## Product decision

Data entry starts with sources and research decisions. The application produces the claim graph and import records behind that experience.

The complete journey is:

1. Capture a source.
2. Confirm the object identity, or defer that decision.
3. Create and review claim proposals.
4. Maintain the research dossier.
5. Select the public account and authorise its content.
6. Generate and deploy the public collection.
7. Correct or withdraw content when required.

Manual entry completes this journey before AI extraction becomes a dependency. AI later creates proposals in the same review interface. This is the target product journey, not a requirement to build every stage before releasing useful functionality. The first slice uses the existing importer and a maintainer-run publication process; the next slice introduces one bounded researcher-facing entry flow.

## Product surfaces

### Source inbox

The primary action is **Add source**. Accept a URL, uploaded file, photograph or archival reference. Ask for an institution and catalogue identifier when known, and allow a private research note. Do not require an origin, a complete provenance history or a canonical object name.

Saving creates a private draft dossier and a source capture record. A provisional workspace label belongs to the draft; it does not restore a preferred-name column on `entities.entity`. Preserve retrievable source material with its capture date and version. A reference-only archival source remains usable without pretending that a digital copy exists.

Show capture progress and failures separately from draft saving. The researcher can return to an unfinished capture without losing the reference or note.

### Identity confirmation

Show candidate objects with identifiers, institution, attributed names, linked sources and the reason for the match. The researcher explicitly links an existing object, creates a distinct object or defers the decision.

Names help discovery but do not silently merge identities. Preserve existing binding and exact-identifier checks. An unresolved draft can hold sources and proposals without creating a canonical object.

### Claim review

Display the source and its proposals side by side. Each proposal records the subject, predicate, value, asserting agent when known, evidence relationship, locator and original wording. For preserved material, attach evidence to the particular source version.

The researcher can create a proposal from a passage or visual locator, then accept, edit, reject or defer it. The same actions apply to AI proposals. Source text, including embedded instructions, is evidence to inspect; it cannot authorise application actions.

Acceptance records an attributed statement and its evidence. Acceptance does not declare the statement universally true. Keep a conflicting account as another claim. Distinguish correction or supersession from adding a disagreement, and retain the review history.

For example, “removed from Orongo” can support a movement origin, `moved_from`, when modelling the reported event. That wording alone does not establish a discovery location, `found_at`, or a place of manufacture, `made_at`. A summary-only form must defer the event proposal until the write path can represent it; it must not substitute a different predicate.

### Research dossier

The dossier brings together current whereabouts, institutional identifiers, attributed names, sources, provenance, conflicting accounts and research gaps. Researchers enter people and places contextually without managing junction records or packet keys.

Keep the object-facing origin, current location, documents and provenance sections from [ADR 011](adrs/011-object-information-hierarchy.md). Provide direct access to identification details and a separate restitution workspace for operational tasks. Task navigation does not reorder or silently replace the established object-page hierarchy.

Research coverage is explicit workspace metadata. Distinguish not researched, research underway, documented and researched but not established. Conflicting accounts can coexist with those states. Restricted access describes visibility, not research completeness; do not expose even the existence of restricted material without permission.

### Public dossier

Once public dossier pages are introduced, collection cards lead to them. The first slice links its card directly to the supporting source and does not require a new item route. A public dossier answers, where authorised information exists:

- What names are used for this object, and by whom?
- Where is it held, and which institutional identifiers locate its record?
- What is its reported origin?
- How did it leave, according to which sources?
- Which accounts disagree, and what remains undocumented in the public record?
- What restitution information has been authorised for public use?

Missing information and missing images do not prevent publication of a useful partial dossier. Public empty states must not reveal private research activity. A private evidence file does not become public because a claim cites it: approve the claim, citation, excerpt and file independently, and publish only the permitted combination.

Retain original-language wording. Keep reviewed translations linked to their source revision and distinguish translated text from the original. Use Chilean Spanish and British English for the existing website experiences without inventing missing translations or requiring every source to exist in both languages. Rapa Nui terminology and translation decisions require the relevant collaborators' authority.

Treat the existing website's concept and type filters as design choices to reconcile with the research model. Do not create Concept entities or classifications merely to fill those controls. Show filters only when their values have a defined, authorised basis.

## Three independent decisions

| Decision | Meaning | What it does not establish |
| --- | --- | --- |
| Accept a claim | Record a reviewed, attributed statement and evidence in the research store. | Universal truth, editorial priority or public access. |
| Foreground a claim | Select an account for the initial description or greater emphasis. | Greater factual certainty or permission to publish. |
| Authorise publication | Permit specified content revisions and media for public use. | Authority to disclose the rest of a dossier or publish later edits. |

Keep those decisions explicit and reversible, with the responsible actor and time recorded. A person can hold more than one application permission; the system still records distinct decisions. An application role does not establish cultural authority to publish particular knowledge. Record the basis and scope of that authority with the publication decision.

The public presentation can foreground an authorised community account while retaining other authorised accounts with their own attribution. Existing deterministic display labels are research conveniences, not automatic public editorial decisions.

## Architecture and boundaries

| Layer | Responsibility |
| --- | --- |
| Authenticated research workspace | Drafts, source captures, identity decisions, proposals, research coverage and review history. |
| Canonical research store | Entities, accepted claims, evidence, provenance and restitution records. |
| Publication process | Revision-specific decisions, permitted public fields, media derivatives, translations and withdrawals. |
| Public collection export | Versioned, validated JSON containing only content authorised for public use. |
| Static website | Collection cards, public dossiers, search and bilingual presentation built from the export. |

Reuse the [dossier importer](adrs/012-object-dossier-ingestion.md) as validated write infrastructure. Extend its contract deliberately for preserved sources, corrections and later provenance operations. An authenticated editor must not bypass its identity, evidence or transaction rules through a second unchecked write path.

The initial public connection is a versioned JSON export. The website does not reuse the explorer's broad database reader role. Keep database credentials in the trusted export service. Review every emitted value, including related entity names, identifiers, counts, source metadata, search text and media URLs, through the publication boundary.

The public export is generated output, not a second editable catalogue. Record the snapshot and content revisions used by each deployment. Distinguish publication authorisation, deployment in progress, live deployment and deployment failure.

Withdrawal invalidates the affected public content and its dependent translations, search entries and media derivatives. Rebuild and deploy the permitted remainder, remove obsolete assets and invalidate caches where applicable. Block deployments and rollbacks that would restore withdrawn content. Agree the required withdrawal time before launch; use runtime enforcement if a static deployment cannot meet it. Removal cannot retrieve copies already downloaded by other people.

## AI, provenance and restitution

AI extraction follows the manual workflow. Record extraction method, model, prompt version and time separately from the source's asserting agent. Permission to store a source does not imply permission to send it to an external model. AI failure or refusal to propose a claim leaves manual work available.

Add provenance through an event form that compiles into event anchors, role claims and evidence. Preserve uncertain dates, movement versus transfer, and attributed descriptions of removal. Do not infer ownership, legality or consent from custody or transfer.

Add restitution through a dedicated workspace for parties, authorised contacts, actions, documents, responses and next actions. Keep sensitive case information private by default. Operational changes do not silently rewrite custody or provenance. Detailed case stages remain a later design task; this decision does not replace the current status model with the illustrative list from the earlier discussion.

## Scope and trade-offs

The first release connects one existing dossier to a public collection card and proves withdrawal. It uses a small, explicit publication manifest and the existing manual deployment path. Researcher-facing entry, ongoing corrections and competing accounts, non-URL evidence, provenance, AI proposals and restitution then arrive as complete user journeys. File and archival-reference entry precede automated extraction and bulk expansion so institutional web records do not become the only practical source of knowledge.

A full CMS, general-purpose database editor, complete ontology browser, first-class Concepts, automated identity merging, exhaustive descriptive cataloguing and AI extraction are not prerequisites for the first release. Neither are application accounts, file storage or a public item page. The first slice still includes reviewed content, a visible website result and removal; an exporter alone does not complete it. Successive releases build towards the full research product.

Source preservation, review and publication add infrastructure. The benefit is that researchers can work with incomplete and conflicting material without exposing it automatically or learning the database's storage mechanics.

## Related decisions

- [Access and publication permissions](adrs/003-row-level-access-and-publication-permissions.md)
- [Preserve and version external records](adrs/005-preserve-and-version-external-records.md)
- [Derive display labels](adrs/010-derive-entity-display-labels.md)
- [Object information hierarchy](adrs/011-object-information-hierarchy.md)
- [Transactional dossier ingestion](adrs/012-object-dossier-ingestion.md)
- [Foregrounded claims](adrs/013-foreground-claims-and-defer-first-class-concepts.md)
- [Application boundaries and tooling](adrs/014-monorepo-and-task-tooling.md)
- [Predicate meanings and evidence relationships](predicates.md)

This document extends the product direction without claiming those planned capabilities already exist. Record any necessary changes to the accepted architecture decisions alongside their implementation.
