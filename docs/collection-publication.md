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

A publication or catalogue we have examined can be registered with its known
attribution, reference and language, empty `claims` and `images`, and no
`objectIds` or `captures`. For an unlinked source, use `notes` to explain its
relevance to the investigation and why no object relationship is established.
This records the source without inventing object identities or requiring a
shareable copy of the original.

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
`value`. Existing claims do not need backfilling. Keep capture/version details in
capture metadata or source `notes` when needed.

Use optional source `notes` for source relevance, interpretation and transcription
decisions. Keep campaign scope, search attempts, processing progress and next
actions in the campaign, not in `notes.text`:

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
repeatable extraction batches. Read the source itself and put passage locators
on claims where known.
Use a working extraction list only when it helps a complex batch; keep useful
unresolved work with the source or campaign, and private scratch files local.
Public source notes record concise methodological decisions; caveats needed to
understand a claim belong in its value because notes are not rendered on the site.
Validate each batch and review the affected object pages in both language routes.

### Extract a source table

Choose and state the table scope; visually review the rows and layout before
assigning claims. Use a working transcription when it prevents omissions or
repeated work, and keep restricted extracts local. A selective batch need not
transcribe the entire publication. Record a concise explanation of decisions
such as blank-cell inheritance in the source's `notes`. The public source reference
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
entries. Its final museum/research section supplies research leads, not object
claims. The [campaign](../research/campaigns/arte-en-la-cultura-rapanui.md) links
the useful unresolved work; the original local audit remains historical context.
Do not invent individual objects from counts or assign research notes as
locations. Similar names, types or institutions alone do not establish identity
with an existing catalogue record. Keep separate repeated rows distinct and
retain established handles when the prior extraction identifies the same entry.

### Research museum records

Use existing sources and the relevant
[holder lookup recipe](../.agents/skills/identify-objects/references/holder-lookups.md)
before repeating a search. URLs and internal record IDs generate candidates;
verify the displayed accession and supporting details. Match conservatively:
institution-scoped identifiers, documented transfers and distinctive physical
or provenance evidence can establish identity; type and institution alone
cannot. Keep established handles and unresolved matches separate.

An examined publication or catalogue can have a source record before individual
objects are reconciled. A search hit or speculative URL is only a lead. Adding
a source does not assert a match, current custody or permission to share its
files. Create object links and attributed claims only when supported.

Record decisive source-specific reasoning and caveats in source `notes`.
Unresolved work can stay in an existing campaign when it helps continuation.
The [research guide](research.md) owns campaign and optional-register guidance;
an ordinary import requires neither. Do not maintain a second account of facts,
checks or successful imports already recorded in the collection and Git.
Contact institutions only when the user authorises it; private correspondence
stays in local staging.

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

For discovery before a source ID exists, `just source capture --url URL` stages
an anonymous capture in ignored local staging and prints its path and capture
time. It creates or changes no collection source. Inspect the file, then register
it under the established source ID once the substantive source is identified.
The source-ID form above retains its existing behaviour.

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

Place supplied files in ignored `research-local/` staging first. Capture or
staging is not permission to commit a file; use `research/evidence/` only under
the retention rule in the [research guide](research.md#retaining-research-evidence).
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
its attribution and licence. When the download URL differs, keep it in source
`notes` with any useful rights review context. Git LFS records the file checksum; do not duplicate routine
metadata in a separate audit. Leave uncertain rights or object matches in staging.
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
