# Research

## Default workflow

Research is primarily carried out by agents. Optimise for reliable execution
and low maintenance. Additional steps and structured tracking are worthwhile
when they prevent repeated research, lost decisions or conflicting updates.
Keep each fact in one authoritative place and each tool's responsibility clear,
so another agent or human can resume without reconstructing the conversation.

For systematic discovery of Rapa Nui cultural material held outside Rapa Nui,
including mainland Chile, use a focused campaign to coordinate scope, search
coverage, candidate outcomes and remaining integration. The campaign is a plan
and continuation aid; collection records remain the maintained account of
sources, objects, claims and images. The [incorporate source skill](../.agents/skills/incorporate-source/SKILL.md)
owns the end-to-end procedure. This guide owns research strategy and campaign
coordination; [collection authoring](collection-publication.md) owns record and
publication rules.

The default outcome for an in-scope candidate is complete integration: establish
or link its source, reconcile supported object identities, record faithful
attributed claims and add images only when their reuse is cleared. Object
creation alone does not complete integration. A narrower pass is valid when its
scope is explicit, such as a catalogue search or identity-only batch; record
what remains for a later pass in the campaign. An examined publication can
have a source record before any objects are reconciled.

Add a research artefact only when it helps someone resume work or understand a
consequential decision. A campaign, inventory, evidence note and progress
register are not mandatory reports for every source. Source queries are search
activity, not collection sources. Substantive publications, catalogues or
records may be registered as sources even before an object link is established;
use source `notes` for relevance and source-specific interpretation. Keep
operational search logs out of source notes, and do not duplicate them as
campaign inventories. [ADR 026](adrs/026-share-research-plans-and-evidence.md)
records this boundary.

## Files and responsibilities

| Location | Owns |
| --- | --- |
| `collection/sources/` | Source identity, attribution, claims, image metadata and source-specific research notes |
| `source-files/<source-id>/` | Shareable original files and captures; their metadata belongs in the source |
| `research/README.md` | Campaign links and priorities |
| `research/campaigns/` | Focused questions, scope, unresolved work and next actions |
| `research/evidence/<campaign-id>/` | Optional ordinary research files retained only when they materially help future researchers |
| `research/progress/` | Optional registers for substantial recurring follow-up; retained historical records |
| `research-local/` | Restricted originals, private correspondence and disposable working files |

There is no separate research source catalogue, evidence schema or manifest.
Use source `notes` for interpretation, extraction methods and source-specific
decisions; use a campaign for wider strategy, dated search coverage, candidate
outcomes and next actions. Do not copy catalogue fields, bibliographies,
accepted claims, object inventories or routine command results into campaign
reports. A real publication or catalogue is a source; a query we ran is not.

An inventory is a working list for processing a source, not a new record type.
Create one only when a multi-entry source needs it. If it saves repeated work,
a shareable list can live under `research/evidence/<campaign-id>/`, named for its task
and linked to the existing source. It has no separate source identity or
required schema. Published facts belong in the collection; keep only useful
unresolved work active. Do not create objects just to give uncertain entries
somewhere to live.

## Focused campaigns

Start from the [programme index](../research/README.md), which owns sequencing
and current priorities. A campaign needs a question, rationale, scope, search
plan and next useful action. Record coverage by institution or catalogue
department, search terms and spelling variants, pagination or other result
boundaries, and the date checked. Summarise candidate dispositions and link
their source or object records; list any remaining integration work. The
[template](../research/campaigns/template.md) supports this without requiring a
copied inventory or a fixed report format. Account for every candidate within
the stated pass: new object, existing object, unresolved identity, or excluded
with a reason. A concise grouped outcome is enough when all entries share the
same disposition. Link the authoritative records instead of repeating their facts.
Record geographic provenance, cultural or maker attribution and representation
or documentary role separately from identity disposition. These dimensions and
their evidence thresholds are defined below; “from” and “about” can overlap.
Distinguish identity outcomes from integration: preserved source, reviewed
claims and image rights, and any blocked, deferred or unavailable material.
“Unavailable” means the relevant scope was examined; “blocked” means it could
not be examined or used. Completion applies only to the stated scope.

When delegating, assign disjoint candidates or stages and name the shared files
one contributor will own. The coordinating agent reviews identity, attribution,
captures and remaining work before marking the batch complete.

Add YAML frontmatter with `started: "YYYY-MM-DD"` using the earliest documented
campaign work. Date search coverage and consequential candidate outcomes as
they are recorded; no event-by-event activity log is needed.

Link collection records for completed imports. Update a campaign when its
question, direction, obstacle or next action changes, not after every object.
Record unsuccessful searches when they define coverage or prevent substantial
repeat work. Keep only search coverage and useful outcomes in the campaign; do
not duplicate accepted claims, source fields or full entry inventories. Use
either the campaign or an existing register for coordination, not both.

## Discovery strategy

Investigate Rapa Nui cultural material held outside Rapa Nui, including
mainland Chile. The default discovery strategy is catalogue-first: establish
the relevant digital catalogue scope at an institution, then systematically
cover its relevant departments, record types and search routes before starting
thematic deep dives. This broad baseline reduces repeated partial searches and
shows where object-level evidence is concentrated. The [programme index](../research/README.md)
owns which catalogue is next; this guide does not maintain a second priority
queue.

Define why an institution and its catalogue are in scope. Reuse documented
APIs, exports, catalogue recipes and known query routes where available, and
inspect how filters and record relationships behave before choosing a method.
Search relevant language, place-name, historical spelling, maker, collector,
identifier and material variants. Follow all result pages, load-more controls,
and relevant record variants within the defined catalogue scope. Record the
queries, filters, departments, page or result boundaries, access limits and
date checked so coverage can be resumed without repeating failed work. A
failed route should be tried again only when a specific change in access,
method or evidence makes success more likely.

Keep two kinds of work distinct. Exact-object follow-up resolves a known
candidate or identifier and may be narrower than the catalogue baseline;
record its exact query and what identity, claims, source preservation or image
review remains. Exploratory coverage seeks candidates across the agreed
catalogue scope; do not present a small sample as coverage of that scope.
Pagination and relevant variants are part of the scope, not optional extras.
Work in manageable batches so candidates can be reconciled and integrated as
they are found, while keeping the ambition at the full agreed catalogue scope.
Choose batch order by expected supported new objects, source and evidence
enrichment, and information gain per unit of effort, accounting for existing
MoSA records and prior search outcomes. Source enrichment can improve identity,
attribution or context without adding an object record. Search-hit volume alone
is not a measure of progress.

Assess three independent dimensions for each candidate, alongside whether its
identity is new to MoSA:

- **Geographic origin or provenance:** supported Rapa Nui origin, supported
  origin elsewhere, or unresolved. Base island origin on evidence for
  manufacture, findspot or collection provenance; a Rapanui cultural or maker
  attribution alone does not establish geographic origin.
- **Cultural or maker attribution:** record the source's explicit attribution
  and uncertainty separately from geographic origin. This matters especially
  for contemporary Rapanui work and replicas. Modernity does not exclude work
  from discovery, and authorship does not determine where it was made.
- **Evidence role:** artefact, representation or documentary source, or both.
  A photograph made on Rapa Nui can be both geographically from Rapa Nui and
  about it. A representation or document about Rapa Nui can be a valuable,
  attributable collection source linked to one or more objects. Preserve its
  authorship, perspective and uncertainty; do not count it as another physical
  artefact from Rapa Nui merely because it documents one.

“From Rapa Nui” and “about Rapa Nui” are useful descriptions of these
dimensions, not mutually exclusive classes. An item's aboutness does not make
it irrelevant or exclude it from collection research. Keep uncertain
geographic origin unresolved. Use existing attributed claims and campaign
decision prose to preserve these distinctions; no ontology change is needed.

Inspect candidate records and preserve usable evidence before reconciliation.
Distinguish historical displacement from present location, return and unknown
whereabouts. Include archaeological and everyday material alongside carvings
and contemporary Rapanui work. Counts, groups, fragments, replicas and
depictions need interpretation before they become individual object records.

Useful routes beyond the original PDF table and IndiGen gallery include:

- Institutional catalogues across archaeology, ethnology, art and archives,
  including entries without photographs.
- Underrepresented materials and functions, using place-name, language and
  spelling variants. Distinguish Rapa Nui from Rapa Iti and incidental mentions.
- Collectors, expeditions, former holders and documented transfers. Nearby
  accession numbers generate leads, not matches.
- Publication tables, appendices and illustrations, retaining locators and
  uncertainty. Revisit unresolved entries when new evidence appears.

Campaign rationale, dated coverage, candidate dispositions and remaining
integration belong in campaigns. Programme priorities belong in the index.

## Retaining research evidence

The default staging area is ignored `research-local/`. Retain a file under
`research/evidence/<campaign-id>/` only when a future researcher needs it to
assess an unresolved candidate or consequential decision, recover otherwise
fragile evidence, or avoid substantial repeated work. Routine queries,
screenshots, copied catalogue entries and command output normally need only a
concise campaign outcome, if anything. Capturing a file does not imply committing
it. Every tracked file under `research/` is shared repository content.

Link each retained file from its campaign with its purpose, origin, known date
and limitations. Do not add a manifest or a second source catalogue. Reuse
existing captures. If retained evidence becomes a substantive collection source,
register its usable capture under `source-files/<source-id>/`, update references
and remove the redundant research copy. Source metadata then owns that capture.
Registered source captures are durable verification evidence, not disposable
campaign scratch.

When resuming or closing a campaign, remove encountered research files that are
superseded or no longer useful; no separate audit schedule is required. Keep the
concise consequential decision. Deleting a tracked file does not erase Git
history, so restricted material must never be committed in the first place.

## Supplied and restricted material

A human can supply a blocked page or PDF in local staging and tell the agent its
path. Ask in the conversation for the exact missing page, section or file and
its original URL when known. Inspect what was supplied and continue the same work. There is no handover record or
additional approval stage. Stage captures locally before review; registering a
capture preserves evidence for later verification and is separate from the
anonymous staging command. A source without a capture is valid.

Keep restricted originals, page images and raw OCR local. Our reviewed factual
transcriptions and findings are considered separately: a restriction on sharing
a PDF does not automatically make our identifier list private. Honour any
specific restrictions on the information itself. Preserve known retrieval
information; an unknown date stays unknown. Shared files are visible to
repository readers even when excluded from the website.

## Optional progress registers

The register is useful for repeated, multi-object follow-up, such as
[IndiGen](../research/campaigns/indigen-follow-up.md). Do not initialise one for
an ordinary import. It records what was reviewed within a stated scope and
what remains unresolved; it does not duplicate the collection or establish
truth, rights, consent or custody.

```sh
just research init <source-id>
just research status <source-id> --stage identity --limit 10
just research sync <source-id>
just research record <source-id> --file research-local/batch.json --revision 3
just research check <source-id>
```

Read status first. Use `sync` only when resuming after the seed source changes.
It snapshots the source-linked object list; it does not infer that new work was
reviewed. Shared registers are authoritative. An older local-only register can
be inspected with a warning but must be migrated before further writes; never
update both copies.

`status` derives queues and totals. Filter with `--institution`, `--object`,
`--stage`, `--status` and `--limit`; institution matching is a case-insensitive
substring search. `--object` also includes that object's batch history. The
legacy `completed` total means all four stages were resolved within recorded
scope; it is not a campaign target. Use the relevant stage queue for a narrower
investigation. File or claim presence alone does not mean its scope was reviewed.

Source changes produce advisory review warnings, not automatic re-review work
or failed validation. Assess their relevance when continuing that investigation;
record another batch only after actual research. Research checks are explicit
and do not gate website verification. Malformed registers and missing cited
files remain errors in `just research check`. `just research-check` checks all
shared registers; it does not inspect ignored local-only registers or fetch
remote pages. Git LFS pointers suffice for reference checks. Historical commit
IDs are optional context and do not require a full Git-history checkout.

### Record a batch

Record only stages you reviewed. Identity outcomes are `pending`, `verified`,
`ambiguous`, `not-found`, `blocked` or `deferred`. Capture, claims and image
outcomes use `pending`, `complete`, `partial`, `blocked` or `deferred`; claims
and images also accept `unavailable` after that scope has been reviewed.
Verified, complete and partial outcomes require references. Ambiguous,
not-found, blocked, deferred and partial outcomes need a useful next action.
`not-found` needs recorded searches; it never establishes absence.

For example, replace the illustrative identifiers, date and URL below with an
actual reviewed attempt. No separate evidence note is required:

```json
{
  "id": "example-search-2026-09-30",
  "checkedAt": "2026-09-30",
  "scope": "Exact accession search in the museum catalogue.",
  "searches": [{
    "url": "https://example.org/catalogue",
    "query": "AB 123",
    "result": "No match within this search."
  }],
  "evidence": ["https://example.org/catalogue"],
  "updates": [{
    "objectId": "example-object",
    "identity": {
      "status": "not-found",
      "note": "No match within the recorded query.",
      "refs": [],
      "nextAction": "Check the former accession in the digitised inventory."
    }
  }]
}
```

Batch evidence can reference HTTP(S) URLs and files under `collection/`,
`source-files/` or `research/`. Optional `evidenceLimitations` explain unavailable
supporting material; they do not waive missing shared files or change historical
outcomes. Stage references use URLs for identity, source IDs for captures,
qualified claim IDs for claims, and source/image-file references for images.
The CLI validates those links before recording new work.

Legacy `checks` and `commits` remain readable but are optional. Git and CI own
change and validation history; do not append batches merely to copy their logs.
Omitted stages retain their history. An identical batch ID and content is
idempotent; changed content requires a new ID. Record against the displayed
revision so concurrent work cannot silently overwrite an update. Reconcile Git
conflicts and inspect status before continuing; preserve differing conclusions.
The lock prevents simultaneous writes, not duplicate research assignments.
