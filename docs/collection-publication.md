# Collection authoring and publication

Every tracked record in `collection/` is public material. Git history supplies
review, authorship and rollback. There is no separate database publishing step.

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

Keep candidate URLs and unsuccessful searches in a dated register under
`research-local/`, not in `collection/`. Record the historical holder and
description, candidate URL and accession number when available, supporting and
contradictory evidence, the date checked and the evidence still needed. Use
explicit statuses such as `verified`, `ambiguous`, `blocked` and `not found`;
`not found` means only that the recorded searches did not locate a match.

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

Capture fields are `file` (relative to `source-files/`), `originalUrl`,
`archiveUrl` (an exact timestamped Wayback URL), `capturedAt` (UTC or null),
`method` and optional `note`. Git records when a capture is added. At least `file` or
`archiveUrl` is required. The method is `singlefile`, `download`, `supplied-file`
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

Download only images MoSA is authorised to publish. Put each binary at
`collection/images/<file>`; the repository's Git LFS rules track supported
image formats. A normal checkout restores the image before Astro and Docker
optimise it. Do not use remote museum image URLs as the only production asset:
they can change, block hotlinking or disappear. Keep the original URL in the
image record for provenance.

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

Merging collection changes does not deploy automatically. The manually
dispatched Website workflow builds the repository with Git LFS, deploys through
Coolify and verifies the exact commit and both language collection pages.

To withdraw material, delete its editorial, image reference, claim, source or
object as appropriate, review links, and deploy the new commit. Preserve the Git
history. For an urgent rollback, revert the responsible commit and deploy that
revert.
