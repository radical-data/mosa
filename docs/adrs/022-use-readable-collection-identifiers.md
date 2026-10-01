# 022: Use readable collection identifiers

## Status

Accepted and implemented. Extends
[ADR 020](020-use-a-git-backed-public-collection.md).

The image-relationship parts of this decision were superseded by
[ADR 027](027-distinguish-displaced-objects-and-documentary-sources.md).
Images remain identified by their asset paths, but their photograph source owns
the metadata and a `depicts` relationship now links that source to each object.
ADR 027 also clarifies that editorials are authored publications rather than
collection records. Their readable file identities and typed subject links are
unchanged, while their files now live under top-level `editorials/`. The original
decision text below records the terminology and model used at the time.

The owner confirmed on 29 September 2026 that the website has not been released
to the public. This migration can replace existing object URLs without redirects
or UUID aliases. That instruction supersedes the UUID-preservation constraint
for this migration.

## Context

The collection contains 20 objects, 13 sources, 43 claims, 2 editorials and no
image records at the time of this proposal. Objects and sources use UUIDs;
claims use UUIDs or UUID-derived strings. Editorials already use readable IDs.
The validators already accept readable identifiers, but authoring still
requires copying opaque references and repeating file identities inside files.

Source boundaries matter. One source describes 10 objects. Another gives Mamari
two names. The British Museum account of Hoa Hakananaiʻa contains two locations
and two catalogue identifiers. Neither an object ID nor a predicate can uniquely
identify a claim.

## Decision

Use readable file names for independent records and short local IDs for claims.
Store an identity only where another record needs to refer to it.

| Record | Identity | Example |
| --- | --- | --- |
| Object | JSON file name without extension | `mamari` |
| Source | JSON file name without extension | `wikipedia-mamari` |
| Claim | Source ID plus local claim ID | `wikipedia-mamari/name-mamari` |
| Editorial | Markdown file name without extension | `la-tablilla-mamari` |
| Image asset | Path relative to `collection/images/` | `mamari/front.jpg` |

### File names establish record identity

`collection/objects/mamari.json` establishes the object ID `mamari`. Remove the
stored `id` field from object JSON, source JSON and editorial front matter.
The loader derives each ID from the actual file name and supplies `id` to the
application's runtime records. Keep `objectId` on claims, images and editorials
because those fields express relationships.

Objects, sources and editorials have separate namespaces. An object and an
editorial can both be called `mamari`. Each namespace remains flat; directories
inside `objects/`, `sources/` and `editorials/` are not part of this design.

### Choose a readable handle once

File IDs and local claim IDs use lower-case ASCII letters, digits and single
hyphens between words: `^[a-z0-9]+(?:-[a-z0-9]+)*$`. A slash is reserved for
joining a source ID and a claim ID. IDs are exact and case-sensitive; validation
rejects invalid spelling rather than silently normalising references.

- Objects use a recognisable navigation handle: `mamari`, `hoa-hakananai-a`.
- Sources use a short reference label: `wikipedia-mamari`,
  `bm-hoa-hakananai-a`, `arte-rapanui-table`.
- Editorials keep their existing readable file names.
- When labels collide, add a useful distinguishing word. If no reliable
  distinction is available, use a numeric suffix such as `figure-2`.
- For an unnamed object, use an unoccupied handle such as `object-1` rather
  than inventing a name or classification.

An editor chooses the handle. The system does not continuously derive handles
from names, titles, authors, catalogue numbers or claim values. Changing any of
those fields leaves the ID unchanged. Human-readable handles still make an
editorial choice, but they carry no additional assertion of ownership, identity
equivalence or preferred source wording. Display the original Unicode names
and values; ASCII handles are only references.

Keep the same handle in both language routes. Do not translate IDs. Avoid
renaming established handles for cosmetic consistency. Never reassign a retired
handle to a different record. A deliberate rename changes identity references
and requires a coordinated edit; after public release, a public object rename
also requires a URL-compatibility decision.

### Claims need only local IDs

Keep claims as arrays inside their sources. Each claim has an explicit local
`id`, unique within that source. Typical IDs are `name`, `material`, `room` and
`city`. For a source that describes several objects, use labels such as
`mamari-name` and `ao-type`. Authors choose those labels; the validator does not
parse meaning from them.

A repeated predicate gets separate IDs: `name-text-c` and `name-mamari`, for
example. If useful labels collide, add `-2`, `-3` and so on. These suffixes are
assigned labels, never array positions. Reordering, inserting or deleting a
claim does not change another claim's ID. Do not reuse a deleted claim's ID for
an unrelated assertion.

Outside the source, always refer to a claim as `<source-id>/<claim-id>`.
`foregroundedClaims` contains these qualified references in presentation order.
No bare-ID fallback or object-local resolution is permitted. A source rename
therefore requires updating its qualified claim references.

The validator resolves a qualified reference to exactly one source and one
claim, then checks that the claim refers to the foregrounding object. The
runtime claim index uses qualified references rather than local IDs as keys.
Two sources can both contain a claim called `name` without colliding.

### Images do not need another ID

Remove `id` from image records. Existing relationships already identify the
source, object and asset through the containing source, `objectId` and `file`.
Within a source, reject duplicate `(objectId, file)` pairs. Allow the same asset
in different source accounts or for different objects; retain each account's
credit, rights and caption independently.

Use readable asset paths such as `mamari/front.jpg`. The path does not determine
which object the image depicts; `objectId` remains authoritative. No image
record is currently referenced independently. Introduce an image-record ID only
if a concrete future feature requires one.

## Authoring example

This example uses the existing Mamari name claims and source metadata. The
foregrounding selection is illustrative, not an editorial decision to publish.

`collection/objects/mamari.json`:

```json
{
  "name": "Mamari",
  "foregroundedClaims": ["wikipedia-mamari/name-mamari"]
}
```

`collection/sources/wikipedia-mamari.json`:

```json
{
  "author": "Wikipedia contributors",
  "reference": "https://en.wikipedia.org/wiki/Rongorongo_text_C",
  "language": "en",
  "claims": [
    {
      "id": "name-text-c",
      "objectId": "mamari",
      "predicate": "has_name",
      "value": "Text C"
    },
    {
      "id": "name-mamari",
      "objectId": "mamari",
      "predicate": "has_name",
      "value": "Mamari"
    }
  ],
  "images": []
}
```

The existing editorial is now `editorials/la-tablilla-mamari.md`. Its front
matter identifies `mamari` as an object subject and omits `id`; ADR 027 later
moved authored MoSA publications outside the collection directory.

The object routes become `/es/coleccion/mamari/` and `/en/collection/mamari/`.
The collection links, canonical metadata and language switch use the same ID.

## Alternatives considered

| Alternative | Assessment |
| --- | --- |
| Sequential IDs such as `o17`, `s8`, `c3` | Easy to dictate, but authors still need a lookup to recognise a record. Global sequences also create allocation conflicts between branches. |
| Short random IDs | Shorter strings retain the recognition problem and still require generation. |
| Readable aliases alongside UUIDs | Two identities and a mapping preserve complexity without a current compatibility need. |
| Object name or catalogue number as an automatically derived ID | Name corrections change identity; catalogue numbers belong to sources and do not establish object equivalence. |
| Globally unique descriptive claim IDs | Authors repeat source context inside every claim even though the containing file already provides it. |
| Predicate or array position as claim ID | Repeated predicates already exist; positions change when authors reorder claims. |

The main cost of readable handles is choosing names and resolving occasional
collisions. For this Git-authored collection, that cost is smaller than handling
opaque IDs everywhere. No central allocator, generated registry, UUID service
or new dependency is required. If two branches introduce the same handle for
different records, resolve the collision during Git review before merging.

## Implementation

The migration was implemented across the collection, application, validators,
schemas, tests and authoring guides. The audit mapping is appended to the
[collection migration report](../../collection/migration-report.md#readable-identifier-migration).
No compatibility aliases or UUID routes remain.

## Subsequent identity reconciliation

Later source review established that `hoa-haka-nana-ia` duplicated
`hoa-hakananai-a`, and that `ao-national-museum-new-zealand` duplicated
`ao-te-papa`. Their attributed claims were moved to the established identities
and the duplicate object files were removed. The earlier mappings remain below
as an audit of the migration rather than as supported aliases or routes.

This does not change the migration rule against merging on name similarity
alone. Both reconciliations use an exact museum record plus object-specific
evidence. The possible `ua-national-museum-new-zealand` and `ua-te-papa`
relationship remains unresolved because the available records do not identify
which of several ua the table row describes.

## Migration boundary

Implement this as one reviewed migration of the file contract, collection and
readers. Do not introduce a permanent dual-format reader.

1. Prepare a reviewed mapping of every existing object and source ID to a file
   handle, and every existing claim ID to its qualified reference. Retain the
   mapping with the migration report as an audit record, outside runtime loading.
2. Rename files and update all relationships. Remove redundant top-level IDs
   and editorial IDs. Preserve the two existing editorial file handles.
3. Preserve every record as a separate identity. In particular, the canonical
   Hoa Hakananaiʻa record and the former draft labelled Hoa Haka Nana Ia remain
   separate, with distinct handles. Similar names or shared references do not
   authorise merging objects or sources.
4. Preserve source metadata, names, claim wording, predicates, editorial prose,
   foregrounding selections and their order. The migration adds no foregrounding.
   Preserve historical IDs in the previous migration report; append the mapping
   rather than rewriting the historical account.
5. Update JSON Schemas, parsing, cross-reference validation, collection loading
   and editorial loading together. Both the command-line validator and Astro
   build derive identities from real file paths. Validate file names before
   indexing records; reject stored top-level `id` fields under the new contract.
6. Update routes, links, search, tests and documentation that depend on IDs.
   Include object IDs in collection search so typing a known handle finds the
   object. Search results continue to display the full navigation name.
7. Replace the authoring instructions in the collection guide and README, and
   update the architecture summary and `AGENTS.md` UUID-preservation rule.
   Leave the current guides describing implemented behaviour until then.

No deployment is part of the design or migration. New builds omit the old UUID
routes; no redirects, compatibility aliases or database are required.

## Acceptance criteria

- Every pre-migration object, source, claim and editorial has exactly one mapped
  counterpart. Counts remain 20, 13, 43 and 2 respectively if the collection has
  not changed in the meantime. Compare complete record contents after applying
  the mapping; counts alone cannot establish preservation.
- The Mamari source accepts both name claims. Separate sources accept the same
  local claim ID. Repeating a local ID inside one source fails validation.
- Reordering claims or editing a name, title or value leaves all IDs and valid
  foregrounding references unchanged.
- Missing sources, missing claims, malformed qualified references, duplicate
  foregrounding references and claims about another object fail validation.
  Diagnostics identify the authoring file and offending reference.
- Invalid file handles, stored top-level IDs, missing object references and
  duplicate image `(objectId, file)` pairs fail validation. Reusing an image
  asset across different accounts remains valid.
- Both the standalone validator and the website build reject invalid identities
  and unresolved references. Neither reconstructs a supposed file name from a
  record's contents to bypass checking the actual file name.
- Both language routes render each object with its mapped sources and editorials.
  Collection links, canonical URLs and language switching use the readable ID.
  Existing UUID object paths return 404 in the production image.
- Run relevant unit tests, `just collection-check` and `just verify`. Build the
  production image with `just image`; run it on port 8080 and verify HTTP
  behaviour with `pnpm test:http http://127.0.0.1:8080`.
