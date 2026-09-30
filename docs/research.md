# Research

## Default workflow

Research is primarily carried out by agents. Optimise for reliable execution
and low maintenance. Additional steps and structured tracking are worthwhile
when they prevent repeated research, lost decisions or conflicting updates.
Keep each fact in one authoritative place and each tool's responsibility clear,
so another agent or human can resume without reconstructing the conversation.

Use [collection authoring](collection-publication.md) directly for ordinary
source imports. Record a source once in `collection/sources/`; keep its
attribution, claims and source-specific research decisions there. A publication
we have examined can have a source record before any objects are reconciled.
Preserve usable, shareable evidence through the existing
[source capture workflow](collection-publication.md#preserve-source-files).
A source record without a capture is valid when the original is restricted or
unavailable; record that limitation instead of silently omitting preservation.

Add a research artefact only when it saves work that the existing records do
not support. A campaign, inventory, evidence note and progress register are not
required companions to a source import. Small questions stay in conversation;
save an answer only where it helps someone resume or understand a decision.
[ADR 026](adrs/026-share-research-plans-and-evidence.md) records this boundary.

## Files and responsibilities

| Location | Owns |
| --- | --- |
| `collection/sources/` | Source identity, attribution, claims, image metadata and source-specific research notes |
| `source-files/<source-id>/` | Shareable original files and captures; their metadata belongs in the source |
| `research/README.md` | Campaign links and priorities |
| `research/campaigns/` | Focused questions, scope, unresolved work and next actions |
| `research/progress/` | Optional registers for substantial recurring follow-up; retained historical records |
| `research-local/` | Restricted originals, private correspondence and disposable working files |

There is no separate research source catalogue or evidence archive. Use source
`notes` for extraction methods and source-specific decisions; use a campaign
for a wider investigation. Do not copy catalogue fields, bibliographies, source
notes, import counts or command results into campaign reports.

An inventory is a working list for processing a source, not a new record type.
Create one only when a multi-entry source needs it. If it saves repeated work,
a shareable list can be an attachment beside its campaign, named for its task
and linked to the existing source. It has no separate source identity or
required schema. Published facts belong in the collection; keep only useful
unresolved work active. Do not create objects just to give uncertain entries
somewhere to live.

## Focused campaigns

Start from the [programme index](../research/README.md). A campaign needs a
question, a bounded scope and the next useful action. The
[template](../research/campaigns/template.md) is optional; omit sections that
add nothing. Completion depends on that scope: an identity investigation does
not need an image-acquisition phase.

Add YAML frontmatter with `started: "YYYY-MM-DD"` using the earliest documented
campaign work. Date substantive research outcomes where they are recorded;
no separate activity log is needed.

Link collection records for completed imports. Update a campaign when its
question, direction, obstacle or next action changes, not after every object.
Record unsuccessful searches when doing so prevents another contributor from
repeating them. Use either the campaign or an existing register, not both.

## Discovery strategy

Investigate Rapa Nui cultural material outside Rapa Nui, including mainland
Chile. Distinguish historical displacement from present location, return and
unknown whereabouts. Include archaeological and everyday material alongside
carvings and contemporary Rapanui work. Counts, groups, fragments, replicas and
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

Campaign priorities and concrete leads belong in the programme index and
campaigns, rather than a second queue in this guide.

## Supplied and restricted material

A human can supply a blocked page or PDF in local staging and tell the agent its
path. Inspect it and continue the same work. There is no handover record or
additional approval stage. Register a shareable capture through the existing
source commands when useful; a source without a capture is valid.

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
