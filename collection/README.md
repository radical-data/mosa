# MoSA collection

The public collection is part of the website build. Every tracked file is
publishable. Authored MoSA publications live separately under `../articles/`.

## Structure

- `objects/`: one JSON file per collection object.
- `sources/`: one JSON file per documentary source, including required
  navigation `title` and `kind`, claims, relationships and image records.
- `holders/` and `locations/`: records for mapping objects through resolved
  holders, governed by [ADR 028](../docs/adrs/028-map-objects-through-holders.md).
- `images/`: local collection images tracked with Git LFS.
- `schema/`: JSON Schemas for object and source files.

Object and source file names establish their IDs. Use lower-case
ASCII letters, digits and single hyphens between words. JSON object and source
records do not repeat the file ID.

Create an object only for particular material whose displacement MoSA
investigates. A catalogue page and its independently identifiable photograph
are sources, including when the photograph documents a site or has no reusable
local image file.

Claim IDs are short labels unique within one source. References outside that
source use `<source-id>/<claim-id>`. Image records belong to the source that
represents the image. Photograph sources use `depicts` relationships to link
objects; a publishing source uses `reproduces` to link an independent
photograph. The image record itself has no object ID.

The map model keeps an optional mapped location on each holder. A
resolved `held_by` claim connects an object to that holder's map point.
Object-level location assessments embed a separate location only for
holderless `located_at` evidence or genuine exceptions; see [ADR
028](../docs/adrs/028-map-objects-through-holders.md).

Source indexes and detail pages are public at `/en/sources/` and `/es/fuentes/`.

Run `just collection-check` before committing collection changes.
