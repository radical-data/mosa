# Architecture

## Applications and data flow

| Component | Responsibility | Boundary |
| --- | --- | --- |
| `apps/explorer/` | Reader routes plus invited sign-in, private sources, drafts, catalogue administration and acceptance | Separate server-side reader and writer connections |
| `packages/object-dossier/` | Validate packets, resolve identities and import dossiers transactionally | Shared by CLI and accepted research drafts |
| Local research bundle tooling | Preserve PDF/HTML/JSON sources and prepare complete dossier proposals | Discovery stays local; import creates owner-private drafts, not accepted records |
| `scripts/publish-collection.ts` | Prepare, approve, export, withdraw and deploy public snapshots | Restricted maintainer connection to the private publication ledger |
| `packages/public-collection/` | Validate versioned public snapshots | Version 2 permits up to 1,000 selected records; older approvals retain the version 1 contract |
| `apps/website/` | Static bilingual presentation of approved cards and dossier pages | No database connection or private source access |

The flow is source → private proposal → identity review → accepted research →
separate publication decision → static export → verified deployment. Manual URL
entry remains available without archiving; PDF upload and bundle import preserve
source bytes. Local sessions may use AI, but the hosted app has no active
search/model worker or queue delivery. See [ADR 017](adrs/017-local-research-bundles.md).

## Domain model

### Entities, claims and evidence

`entities` contains items, agents, places, sources, external identifiers and the
catalogue namespace registry. `knowledge.claim` connects a subject to exactly
one entity or literal value. Claims retain status, attribution and language;
conflicting accounts can coexist. `knowledge.claim_evidence` relates claims to
sources with a relationship, locator and, where applicable, excerpt.

An object is not its catalogue record. A source can describe several objects.
An ancestral person is an agent; physical remains or a documented museum holding
are an item linked through `physical_remains_of`. That representation does not
determine care, access or cultural authority.

Entity rows do not store generic names, working labels or narrative notes.
Display labels derive from attributed names, identifiers, source references or
structured event claims. Private draft labels and administrative catalogue/case
titles have their own scope; they are not canonical object descriptions.
See [ADR 010](adrs/010-derive-entity-display-labels.md).

[Predicates](predicates.md) defines claim and evidence meanings.

### Provenance

`provenance.event` extends an entity with a broad operational event kind. Event
details use ordinary claims and evidence. Events are research anchors rather
than declarations that a preferred account is true. Unresolved event identities
remain separate anchors.

Movement and transfer are distinct. An event can contain both when supported,
but transfer does not itself establish physical movement. Current custody can
remain a direct item claim without inventing an ongoing event. Preserve exact,
approximate, ranged and alternative dates; presentation order does not assert a
complete chronology. Do not restore explicit event-chain ordering or infer
missing participants and endpoints.

The local dossier bundle and human review can import sourced event anchors and
claims. A general interactive provenance editor remains future work.

### Restitution

Restitution case storage, fixtures, SQL tests and read-only case pages are
implemented. This is operational case management, separate from historical claims.
`restitution` owns cases, case-item links, parties, actions, action participants,
documents and many-to-many action-document links. Cases and actions need not be
entity rows. They reuse item and agent identities from the other modules.

Cases currently have `open` or `closed` operational status. Party roles describe
participation, not legal standing, ownership or community representativeness.
A case may be institution-initiated and may have several requesters or recipients.
Outreach, request, engagement, recommendation, decision and handover are separate
actions. Closure is separate from those actions and from a judgement of success.

Routine case facts are stored directly, not as `knowledge.claim` rows. A case
document is not automatically claim evidence. Actions preserve partial or unknown
dates; requests are described rather than assigned canonical remedy categories.
A handover does not update custody, location or provenance automatically.
No direct case/action-to-provenance-event relationship is implemented.

Item pages link to cases. Case pages show minimal metadata, parties, actions and
their documents, followed by remaining case-level documents. There are no generic
case summary/notes fields. No recorded decision or handover means unrecorded,
not refusal. Reviewed local dossiers can import case administration; general
interactive case authoring, deadlines, task assignment, eligibility rules and
multi-stage approvals remain outside the current interface.

### Presentation

Item pages present origin, current location, documents and provenance before
remaining claims, restitution links and metadata. Missing information remains
visible; these sections are projections, not canonical columns.
See [ADR 011](adrs/011-object-information-hierarchy.md).

`presentation.foregrounded_claim` selects claims for prominence. The active
projection excludes withdrawn/superseded claims. Selection records neither a
truth ranking nor publication permission. The current one-column relation has
no actor, rationale, ordering or audit history. First-class Concepts remain
deferred under [ADR 013](adrs/013-foreground-claims-and-defer-first-class-concepts.md).

## Identity and write contracts

The [packet schema](../schemas/object-dossier-packet.schema.json) and
[shared importer](../packages/object-dossier/import.ts) govern canonical dossier
writes. PostgreSQL creates canonical IDs. Dataset bindings connect symbolic packet
keys to canonical records. Per-dataset locking and transactions prevent partial
imports; successful checksum replay is a no-op.

Bindings resolve first. Exact namespace/value identifiers can resolve objects;
exact source references resolve sources. Name matches are warnings, not merges.
The research interface offers source-linked candidate objects for review, but a
shared source URL is not an exact object match. The reviewer confirms identity.

| Packet version | Scope |
| --- | --- |
| 1 | Original summary predicates and URL sources; preserve existing replay semantics |
| 2 | Adds `classified_as` and `described_as`; URL-only drafts use this version |
| 3 | Adds immutable source/evidence-version references; preserved-source drafts use this version |
| 4 | Adds the implemented claim predicates, structured dates, event anchors and restitution case administration for reviewed local dossiers |

Packet v4 covers the implemented ontology while preserving the narrower v1–v3
contracts and their replay. Retain observations that cannot be represented rather
than coercing them into another predicate. Source `refers_to` links are derived by
the importer.

The importer skips already bound claims/evidence. Editing a packet and importing
it again does not correct those records. Accepted drafts are immutable; controlled
correction and supersession are roadmap work. See [ADR 012](adrs/012-object-dossier-ingestion.md).

## Access and publication

| Access | Intended use |
| --- | --- |
| `explorer_reader` | Research read projections, with read-only database transactions |
| `capture_writer` | Invited researcher's private drafts, sources and validated acceptance |
| `collection_publisher` | Maintainer publication ledger and authorised export/deployment |

Reader routes retain their existing visibility; signing in protects the private
workspace, not every explorer route. Accepted research is readable through the
research reader. Original private files remain protected. Consent to enter
research is separate from permission to publish or send material to a model.
Do not accept sensitive material on the assumption that all research pages
require sign-in.

The allowlist, row-level policies, source file access and private Storage work
together. Authentication alone grants no general canonical write permission.
Contributor/preparer metadata is distinct from source authorship and the actual
signed-in reviewer. Bundle-supplied attribution is not verified authorship.

Acceptance, foregrounding and publication are independent operations. Legacy
cards still require an evidenced name, holder, identifier and attribution. A
complete dossier can be published with a sourced name, classification,
description or identifier while retaining unknowns. Publication includes the
reviewed claims, citations, provenance and restitution facts selected in the
approved snapshot. Original private files and images remain excluded.

The website build/container has no database access. Its trusted deployment job
does: it checks the publication ledger, pinned commit, hosting job and served
snapshot. Desired, pending and verified live releases are distinct. Only the
[publication runbook](collection-publication.md) defines release and withdrawal.

## Competency coverage

| Cases | Requirements |
| --- | --- |
| [01](test-cases/01-hoa-hakananai-a.md), [02](test-cases/02-mpe-32571.md), [03](test-cases/03-moai-curvo-identity.md), [04](test-cases/04-ancestral-remains.md) | Identity, claims, evidence and ancestral remains |
| [05](test-cases/05-mamari-provenance.md) | Movement and unresolved accounts |
| [06](test-cases/06-te-papa-moai-kavakava-provenance.md) | Qualification and alternative dates |
| [07](test-cases/07-hoa-hakananai-a-provenance.md) | Multiple perspectives and place roles |
| [08](test-cases/08-la-serena-moai-provenance.md) | Sparse movement without invented agents/endpoints |
| [09](test-cases/09-benin-ama-provenance.md) | Military removal and evidence scope |
| [10](test-cases/10-aberdeen-head-of-an-oba-restitution.md) | Closed institution-led process |
| [11](test-cases/11-hoa-hakananai-a-restitution.md) | Open joint request without inferred refusal |

`foregrounded-claims.test.sql` checks presentation selection. Provenance competency
fixtures do not yet establish a direct `contradicts` example; use a precise source
conflict before extending coverage, rather than relabelling qualification.

## Generated types

Type generation covers `entities`, `knowledge`, `provenance`, `restitution` and
`presentation`. Capture, ingestion and publication services use explicit SQL.
