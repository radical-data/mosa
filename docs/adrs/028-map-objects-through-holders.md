# 028: Map objects through their holders

## Status

Accepted and implemented.

## Context

MoSA's sources report who holds an object with `held_by` claims and can report
an associated location with `located_at` claims. These are attributed textual
accounts; they can preserve historical names and locations, and do not assert
ownership, consent or cultural authority. Before this decision, they did not
provide a reusable, reviewed geographic point for the Visit page.

Geocoding every object separately would repeat the same institutional address
for many objects and make corrections costly. The ordinary case is simpler:
resolve the reported holder once, record its mapped location once, and derive
the object's map position through that association. Some objects need
an explicit exception because evidence conflicts, an object is known at a
branch or on loan, or the evidence identifies only a locality.

The Visit page is a public invitation and an account of dispersal. Its map must
show the best current assessment supported by the collection, while making
historical clues, uncertainty, approximate precision and unknown locations
legible. A pin for a museum indicates its mapped institutional place; it does
not prove that a particular object is in that building or on public display.

## Decision

Add a small, versioned holder register to the Git-backed collection. Resolve
an attributed `held_by` claim to a stable holder ID without replacing the
claim's wording, source, qualifier, locator or local ID. Holders can be
institutions, private collections, congregations or other holding agents. A
holder can embed an optional mapped `location` with a name, precision,
longitude, latitude and reference. Coordinates use WGS84. The reference
identifies the evidence used to establish the mapped location.
An optional holder `countryCode` records the reviewed country of its site or
base for catalogue grouping, independently of coordinates. It uses an assigned
ISO 3166-1 alpha-2 code and is omitted when no single country is supported.

The default map path is:

```text
object → source-attributed held_by claim with holderId → holder.location
```

Coordinates belong to the holder's mapped location, not the object. When an
object's holding claims resolve unambiguously to one holder with a mapped
location, derive its map position through that holder. Multiple claims
resolving to the same holder do not create duplicate object markers. Holder
aliases support reviewed authoring and reconciliation; website rendering must
not fuzzy-match raw claim text. Holders do not list their objects, and
locations do not maintain reverse references to holders or objects.

Add an optional object-level location assessment only when needed. It embeds a
location when `located_at` evidence exists without a resolvable holder, or
records a genuine exception to the holder's mapped location, such as a
documented branch or loan. It can also record an unknown result. Do not create
an assessment merely to repeat the location embedded on an unambiguous holder.
Conflicting holders must not be resolved by source order, capture date or an
automatic string match. Preserve the source claims and cite the evidence behind
the assessment. An assessment records MoSA's review date, which does not change
the date or currentness of its evidence.

Location assessments distinguish `reported`, `historical`, `uncertain` and
`unknown`. Historical and uncertain assessments can appear on the map with a
short attributed or authored explanation and appropriate language metadata.
Unknown or ungeocoded locations remain in the collection list without a point.
Do not manufacture precision: a locality, region or country point must be
labelled at that level. A holder's mapped location is an institutional map
reference, not a claim that every object is in a particular room or even
available to visit.

Retain the object-location projection for collection research. The Visit page
uses a separate holder projection: one destination for each holder referenced
by a resolved `held_by` claim, with distinct objects and their source evidence
as supporting detail. Multiple institutions in one locality stay separate.
Object-location exceptions do not reposition their holders.

Present holders as MoSA's “satellite museums”, including closed institutions
and private collections. Public access is not an inclusion criterion. Holders
without coordinates remain in the named list. Optional `visitUrl` values link
to verified official visitor information; they do not assert opening status.
Use one colour and one unnumbered point per mapped holder, with no clustering,
even at overlapping coordinates. The alphabetical list provides access to all
holders, and object evidence is expandable beneath each destination.

Use MapLibre GL JS and bundle the runtime assets and geographic data with the
static website. The page must not depend on external tile, style, font or
geocoding services; a map failure must leave the list available. The map draws
no undocumented movement routes.

## Consequences

One reviewed holder location can place many objects on the map, and a holder
location correction updates all inherited positions. Object-level assessments
make holderless location evidence and genuine exceptions explicit. The
registers add authoring and validation work, and the map may distinguish an
institutional address from a known object site only through precision and
explanation.

The model does not establish present custody from a historical source, public
access, display status, object-level coordinates, ownership or restitution
status. It does not add a general-purpose place authority or provenance-event
model.

## Implementation and commit strategy

Keep each commit independently valid. Use lowercase, scoped Conventional Commit
subjects:

| Commit | Contents |
|---|---|
| `docs(collection): define holder-based location mapping` | This ADR and matching authoring guidance. |
| `feat(collection): resolve holders to mapped locations` | Holder records with embedded locations, claim references, optional exception assessments, validation, projection, coverage report, tests and implemented authoring guidance. |
| `feat(collection): map holders and resolve location exceptions` | Reviewed holder identities and locations, claim links, object exceptions and research outcomes. |
| `feat(website): add the visit map with maplibre` | Local MapLibre assets and geography, bilingual Visit content, map/list behaviour and website guidance. |

Stage explicit paths or hunks, inspect each staged diff and preserve unrelated
work. Keep tests with the behaviour they verify, run the checks appropriate to
each commit, and allow repository hooks to run. Split collection data into
coherent batches only when needed for review; each batch must pass validation.
Run documentation checks for this ADR commit, collection checks and relevant
tests for model/data commits, and `just verify`, production image and HTTP
checks after website integration. Deployment remains separate.
