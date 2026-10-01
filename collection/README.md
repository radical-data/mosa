# MoSA collection

The public collection is part of the website build. Every tracked file is
publishable. Authored MoSA publications live separately under `../editorials/`.

## Structure

- `objects/`: one JSON file per collection object.
- `sources/`: one JSON file per documentary source, including required
  navigation `title` and `kind`, claims, relationships and image records.
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

Source indexes and detail pages are public at `/en/sources/` and `/es/fuentes/`.

Run `just collection-check` before committing collection changes.
