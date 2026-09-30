# Collection authoring and publication

Every tracked record in `collection/` is public material. Git history supplies
authorship and rollback. Agents can work directly on public museum material;
no separate publication approval or reviewer sign-off is required.

## Add or edit an object

Create `collection/objects/<object-id>.json`. The file name without `.json` is
the object ID and public URL handle:

```json
{
  "name": "Concise navigation name",
  "foregroundedClaims": ["example-source/example-claim"]
}
```

Use lower-case ASCII letters, digits and single hyphens between words. Choose a
recognisable handle once and do not automatically derive it again when a name
changes. Preserve established handles because they form public URLs. The `name`
is an editorial navigation label; put names asserted by sources in `has_name`
claims.

## Add a source, claims and images

For a complete import from a supplied museum, archive or collection page, use
the [incorporate source skill](../.agents/skills/incorporate-source/SKILL.md).
It coordinates source capture, object identification, claim extraction and
image review. For object reconciliation on its own, use the
[identify objects skill](../.agents/skills/identify-objects/SKILL.md).

Create `collection/sources/<source-id>.json`. The file name without `.json` is
the source ID:

```json
{
  "author": "Named person or institution",
  "reference": "https://example.org/catalogue/123",
  "language": "en-GB",
  "objectIds": ["example-object"],
  "claims": [
    {
      "id": "classification",
      "objectId": "example-object",
      "predicate": "classified_as",
      "value": "Moai / Living Ancestor"
    }
  ],
  "images": [
    {
      "objectId": "example-object",
      "file": "example-object/front.jpg",
      "alt": "Front view of the object",
      "credit": "Institution or photographer",
      "rights": "Rights statement",
      "originalUrl": "https://example.org/catalogue/123"
    }
  ]
}
```

Use `objectIds` to publish a source that documents an object before any claims
or images are extracted. Do not repeat an object ID when a claim or image in the
same source already links that object. A source can still use `objectIds` for one
object while its claims or images link different objects.

Use `null` for an unknown author rather than inventing one. Use a BCP 47
language tag such as `es-CL`, `en-GB`, `rap` or `und`.

Claim IDs are unique only within their source. Use short labels such as `name`,
`material` or `city`. Add object context when a source describes several
objects, and add a useful distinction when a predicate occurs more than once.
Outside the source, refer to a claim as `<source-id>/<claim-id>`. Reordering an
array must not change its claim IDs.

Use optional `locator` text to identify a checked passage, for example
`"locator": "Página 14, tabla 2, fila 6"`. Write it in the source's language;
it appears beside the claim. Omit it when unknown and keep uncertainty in
`value`. Existing claims do not need backfilling. Exact capture/version details
can stay in the extraction audit.

Use optional source `notes` for MoSA's research and transcription decisions:

```json
"notes": {
  "text": "Blank holder cells repeat the preceding holder within the same institution block.",
  "language": "en-GB"
}
```

The non-empty `text` and its BCP 47 `language` remain versioned with the source.
The website does not render these notes or include them in collection search.
They describe MoSA's method, not claims attributed to the source author.
Tracked JSON remains publishable repository content; keep confidential research
in `research-local/`.

### Extract claims from an existing source

Use the [claim extraction skill](../.agents/skills/extract-claims/SKILL.md) for
repeatable extraction batches. Read the source itself and keep passage locators,
proposed mappings and deferred entries in `research-local/claim-extraction/`.
Public source notes record concise methodological decisions; caveats needed to
understand a claim belong in its value because notes are not rendered on the site.
Validate each batch and review the affected object pages in both language routes.

### Extract a source table

Transcribe and visually review the complete table before assigning claims. Keep
the raw cells, page and row references, interpretation decisions and deferred
entries in `research-local/`. Record a concise explanation of decisions such as
blank-cell inheritance in the source's `notes`. The public source reference
should identify the table and its page range; do not infer an author or date.

For museum inventories, use `held_by` for the reported museum or collection and
`located_at` for the associated stated location. These claims reproduce the
source's account, not independently verified present custody. Preserve apparent
errors and historical names as source wording rather than silently correcting
them.

Blank museum and location cells can mean “same as above” within an institution
block, including across page breaks. Verify that convention against the layout.
Do not inherit a previous institution's location when a new institution starts,
or treat section headings as locations. Never fill down the object column.
Join wrapped cell text and descriptions continued over page breaks; distinguish
these from separate rows with identical wording.

Interpret the object cell rather than assigning one predicate to the whole
column. Use `has_name` for an individual designation and `classified_as` for an
explicit object type. A cell can supply both. When a type includes descriptive
qualifications, extract the type and preserve the complete cell as `described_as`.
Keep uncertainty, dimensions and unusual wording intact; use only `described_as`
when no narrower interpretation is secure. Parenthetical common type names are
not automatically individual names. Normalise layout whitespace only.

For the *Arte en la cultura rapanui* table extraction, import individually
described entries and defer plural, counted, collective and ambiguously grouped
entries in the private audit. Its final museum/research section is audit-only.
Do not invent individual objects from counts or assign research notes as
locations. Similar names, types or institutions alone do not establish identity
with an existing catalogue record. Keep separate repeated rows distinct and
retain established handles when the prior extraction identifies the same entry.

### Research museum records

Keep candidate URLs and unsuccessful searches in the relevant shared
[campaign](research.md#files-and-responsibilities), not in `collection/`.
Use `research-local/` for downloads, private evidence and working drafts.
Record the historical holder and description, candidate URL and accession number when available, supporting and
contradictory evidence, the date checked and the evidence still needed. Use
explicit statuses such as `verified`, `ambiguous`, `blocked` and `not found`;
`not found` means only that the recorded searches did not locate a match.

Reuse successful holder lookups across objects and imports. The identification
skill maintains [holder lookup recipes](../.agents/skills/identify-objects/references/holder-lookups.md)
for observed accession URL templates, search parameters, identifier formatting
and fallbacks. A substituted URL supplies a candidate, not a verified match;
check its displayed accession and supporting object details. Record a new
successful method there and each actual attempt in the campaign or register below.

For repeatable follow-up work on existing source-linked objects, use the shared
progress register at `research/progress/<source-id>.json`. It is seeded
from objects linked by that source's claims, images or `objectIds`; it does not
replace a raw page or gallery inventory. Initialise or reconcile it with:

```sh
just research init <source-id>
just research sync <source-id>
just research status <source-id>
just research check <source-id>
```

`just research check` (without a source ID), also available as `just research-check`,
checks every shared register. `just verify` includes this check. It does not
inspect local-only registers. Clone the full Git history to resolve historical
commit references; LFS pointer files suffice for this metadata check.

`init` is safe to repeat for shared registers. `sync` snapshots changes to the
seed source and adds or removes its current entries while retaining recorded history. A changed
institution, catalogue identifier or object type resets the displayed progress
for that entry to pending; earlier batches remain as history. A later change to
promoted source metadata is shown as stale until a new reviewed batch records
the current state. `status` reports drift and a limited actionable queue;
`check` fails on drift, broken current collection references, missing evidence
files or commits from any batch, or failed checks in batches supplying current
outcomes. Superseded collection references remain historical: deleting a claim
after a newer reviewed batch replaces it does not invalidate that earlier batch.
Neither command fetches live pages or changes collection records. Filter the status queue with
`--institution`, `--stage`, `--status`, `--object` or `--limit` (default 30).
Institution matching is a case-insensitive substring search over the source's
holder wording; spellings are not silently merged. Counts describe the whole
register and `matching` describes the filtered queue. Use `--object` to include
that object's previous batches, searches and evidence, even after it leaves the
active inventory. Local metadata hashes detect repository changes, not changes
to a live museum webpage. Continue to use source capture checks for file content.
The `completed` count means all four stages are resolved within their recorded
scope. `unavailable` counts as resolved; pending, partial, blocked and deferred
work does not. It does not imply that every possible claim or image was reviewed.

The register keeps four independent outcomes for each object: identity,
preservation/capture, claims and images. Identity uses `pending`, `verified`,
`ambiguous`, `not-found`, `blocked` or `deferred`; the other stages use
`pending`, `complete`, `partial`, `blocked` or `deferred`, with `unavailable`
also available for claims and images after that scope has been reviewed. Each
outcome has a status, short note, evidence references and, when follow-up is
needed, a next action. Verified/complete/partial outcomes require evidence;
ambiguous, not-found, blocked, deferred and partial outcomes require a next
action. `unavailable` requires a reason and means the reviewed scope yielded no
usable claims or publishable images, never that the stage was skipped.

Displayed stage state derives from append-only dated batches; do not rewrite
earlier outcomes to make the latest state look current. Record reviewed work in
dated batches that preserve attempted searches, their queries and results,
evidence locations, check results and commit IDs. For example, prepare a
private JSON batch and record it against the displayed revision:

```sh
just research record <source-id> --file research-local/batch.json --revision 3
```

For example, a failed catalogue search can be recorded without changing the
capture, claims or image stages. Replace these illustrative identifiers, date,
URL and query with the actual attempt:

```json
{
  "id": "example-catalogue-search-2026-09-30",
  "checkedAt": "2026-09-30",
  "scope": "Search the museum catalogue for the source accession.",
  "searches": [
    {
      "url": "https://example.org/catalogue",
      "query": "AB 123",
      "result": "No result for the exact accession or its documented variant."
    }
  ],
  "evidence": ["research/evidence/example-search.md"],
  "checks": [],
  "commits": [],
  "updates": [
    {
      "objectId": "example-object",
      "identity": {
        "status": "not-found",
        "note": "The recorded searches found no match; this does not establish absence.",
        "refs": [],
        "nextAction": "Check the museum's digitised inventory for the former accession."
      }
    }
  ]
}
```

All top-level fields above are required; unknown fields are rejected.
An optional `evidenceLimitations` array of non-empty notes records evidence that
cannot be shared or reproduced. It is reported separately from stage totals and
does not waive missing files or count as evidence. Batch evidence can reference
HTTP(S) URLs or files under `collection/`, `source-files/` and `research/`.
Review files before sharing them; keep private material in `research-local/`.

`checks` contains `{ "command": "just collection-check", "result": "passed", "note":
"Reviewed batch validates." }` entries when checks have actually run. Results
can be `passed` or `failed`; the register records them and does not execute
commands. `commits` holds existing Git commit hashes and may be empty before a
commit. Append another dated batch to record later checks or commits, repeating
only the stage outcomes that the new review supports. `checkedAt` is the date
the evidence was checked; the tool separately records when it was entered.

Omitted stages retain their earlier history. Reusing a batch ID with the same
content is idempotent; reusing it with
different content is an error. The command validates object-specific evidence
references and the existence of local capture/image files. Use source/claim references for
claims, source/image-file references for images, source IDs for captures, and
HTTP(S) URLs for identity evidence. The register revision prevents a stale
batch from overwriting another update; inspect current status and retry against
the new revision when it conflicts. When delegating research, assign disjoint
object lists and have subagents return batch JSON. One coordinator reviews and
records those batches sequentially; the lock prevents lost writes but does not
reserve objects or prevent two researchers from doing the same search.

Keep raw extraction inventories as separate private working material when
needed. The progress register is a resumable audit of follow-up work on the
existing source-linked objects, not a replacement for entry-level identity
reconciliation or specialist capture, claims and image review. It does not
establish claim truth, rights, consent or current custody, and does not promote
a candidate into the public collection by itself. Writes are local and
concurrency-safe; if a stale lock remains, first confirm that no register
command is still running before removing it.
The shared register is authoritative when present. An older register under
`research-local/progress/` can be inspected with a warning, but cannot be
initialised, synced or written until its reviewed evidence and register have
been migrated. Keep that local original as a backup; never update both copies.
Git restores shared history, while private staging still needs its own backup.
A fresh `init` inventories the collection but does not infer reviewed work.
For Git conflicts, reconcile both batches, re-read status and record subsequent
work against the resulting revision; do not choose a side silently.

A candidate is not a collection source. Promote it only when evidence identifies
the specific object, for example through the same accession or former catalogue
number, a documented transfer, a unique name or inscription, or a photograph
and multiple distinctive physical or provenance details. Object type and
institution alone are insufficient. Prefer the museum's own record or an
authoritative successor-institution record over aggregators and search-result
snippets.

Prioritise candidates that already have a stable identifier, transfer evidence
or distinctive measurements. When public records cannot resolve a strong
candidate, ask the institution a precise identity question and retain the
correspondence in `research-local/`. Do not publish private correspondence or
convert a probable identification into a certain claim without permission and
appropriate attribution.

When a candidate becomes verified, create or update its source and add the
object through a claim, image or `objectIds` as appropriate. Record the decisive
identity evidence in source `notes`, preserve any material caveat, and remove
the promoted candidate from the active follow-up queue while retaining the
research history.

### Preserve source files

Keep capture metadata in the source's optional `captures` array and the files in
`source-files/<source-id>/`. These files are repository reference material, not
website assets. Repository access exposes them; confidential or unauthorised
material stays in `research-local/`. A source without captures remains valid.

Use the [source capture skill](../.agents/skills/source-capture/SKILL.md) for the
agent workflow. Install dependencies with `just install`, then check prerequisites:

```sh
just source doctor
just source capture mapse-aringa-erua --url https://www.patrimoniocultural.gob.cl/en/regional-museums/easter-island-anthropological-museum/aringa-erua-moai-moai-two-faces
```

The command prints JSON with a staging path and capture time. It does not modify
the source. Open the saved HTML and check the catalogue number, relevant passages
and essential images. Expand relevant sections before capture; use `--wait 3000`
for a bounded delayed retry (maximum 30000 ms). For page interactions, add
`--script research-local/source-captures/prepare.js` to run a reviewed script
that clicks the relevant controls, then captures their rendered state. Use a
bounded timer so controls have time to load; do not paste untrusted page code.
Reject error pages, cookie walls and empty records.

Register only a reviewed file (substitute the actual staging path and timestamp):

```sh
just source register mapse-aringa-erua --file research-local/source-captures/reviewed.html --method singlefile --captured-at 2026-09-29T20:00:00.000Z --original-url https://www.patrimoniocultural.gob.cl/en/regional-museums/easter-island-anthropological-museum/aringa-erua-moai-moai-two-faces
just source check --content
just format
```

Place supplied files in ignored `research-local/` staging first.
For a supplied PDF or image, use `--method supplied-file --captured-at null` if
its original retrieval date is unknown; `--name original.pdf` selects a readable
filename. Preserve original bytes. Capture filenames otherwise use UTC timestamps.
Registration reuses identical content within the source and refuses to overwrite
different bytes. Keep source attribution, claims and object links unchanged.

Capture fields are `file` (the filename within `source-files/<source-id>/`), optional `originalUrl`,
`archiveUrl` (an exact timestamped Wayback URL), `capturedAt` (UTC or null),
`method` and optional `note`. Git records when a capture is added.
Omit `originalUrl` when the source `reference` is already that URL; registration
does this automatically. Retain it when the reference is bibliographic text or
the captured URL differs. When changing a source URL, retain the previous URL on
any earlier capture that relied on it. At least `file` or `archiveUrl` is required. The method is `singlefile`, `download`, `supplied-file`
or `browser-pdf`. A saved webpage PDF is a derivative, not an original download.
An archive-only entry can be edited into source JSON and checked with
`just source check`. It is an explicit exception to obtaining a local copy.

Use one ordinary capture and one adjusted attempt before checking Wayback. Prefer
a local SingleFile capture of a usable archive page; retain both URLs and describe
its historical timestamp in `note`. Do not invent dates for imported captures or
claim that today's copy establishes yesterday's content. Record unresolved blockers
in the task handover and commit message. Do not submit pages to external archives automatically.

Capture checks accept valid LFS pointers for builds. `just source check --content`
requires hydrated files and checks their signatures and available Git LFS hashes.
Use `git lfs pull --include="source-files/**" --exclude=""` before that check on a
checkout without archive content. Capture metadata is not rendered or indexed by
the public website. Archiving a file does not prove its claims or promote a
candidate museum match.

### Add images

Use the [collection images skill](../.agents/skills/collection-images/SKILL.md)
for the agent workflow.

Download only images MoSA is authorised to publish. Put each binary at
`collection/images/<file>`; the repository's Git LFS rules track supported
image formats. A normal checkout restores the image before Astro and Docker
optimise it. Do not use remote museum image URLs as the only production asset:
they can change, block hotlinking or disappear. Keep the original URL in the
image record for provenance.

Stage downloads in `research-local/` and inspect the actual image before adding
it. Confirm the depicted object, view, resolution and image-specific reuse
terms; a webpage's text licence does not necessarily cover its photographs.
Prefer the original downloadable file over a thumbnail, and preserve its bytes.
Record credit, the licence name and URL, and any changes in the image metadata.
The `originalUrl` can identify the image's description page when that page supplies
its attribution and licence. Retain the direct download URL and checksums in the
private batch audit. Leave uncertain rights or object matches in staging.
Write image prose in the source record's declared language; the gallery and
collection previews mark that language explicitly. Gallery interface labels
are translated for each route.

Astro optimises website copies with the direct `sharp` dependency. Run a full
build after adding images so decoding and optimisation are checked as well as
the metadata. Review the gallery on both language routes.

## Add an editorial

Create `collection/editorials/<id>.md`:

```markdown
---
objectId: example-object
title: Editorial title
author: Named author
language: es-CL
---

Editorial text in Markdown.
```

The Markdown file name without `.md` is the editorial ID.

Use `author: null` only while authorship is genuinely unresolved. An editorial
can be in one language; the page marks its language rather than pretending it is
translated. Claims made in the prose do not automatically become structured
claims.

## Foreground a perspective

Add the chosen qualified claim reference to the object's `foregroundedClaims`
array. The claim must refer to that object. Keep the source visible and choose
foregrounding through editorial discussion: it is MoSA taking a position, not
a technical calculation.

## Validate and review

Run:

```sh
just collection-check
just build
```

Review the affected object page in both routes. Check attribution, source
language, image rights and alt text, foregrounding, and whether the canonical
navigation name obscures a source account.

## Deploy and withdraw

Merging collection changes does not deploy automatically. Follow the
[release procedure](operations.md#release-the-website-and-collection) to run the
Website workflow on `main` with `deploy` enabled. Collection and website content
are built and released together; there is no separate database publication step.

To withdraw material, delete its editorial, image reference, claim, source or
object as appropriate, review links, and deploy the new commit. Preserve the Git
history. For an urgent rollback, revert the responsible commit and deploy that
revert.
