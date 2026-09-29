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
