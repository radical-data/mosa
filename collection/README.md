# MoSA collection

The public collection is part of the website build. Every tracked record is
publishable.

## Structure

- `objects/`: one JSON file per collection object.
- `sources/`: one JSON file per documentary source, including required
  navigation `title` and `kind`, claims, relationships and image records.
- `editorials/`: optional Markdown articles with YAML front matter.
- `images/`: local collection images tracked with Git LFS.
- `schema/`: JSON Schemas for object and source files.

Object, source and editorial file names establish their IDs. Use lower-case
ASCII letters, digits and single hyphens between words. JSON object and source
records and editorial front matter do not repeat the file ID.

Create an object only for particular material whose displacement MoSA
investigates. A catalogue page and its independently identifiable photograph
are sources, including when the photograph documents a site or has no reusable
local image file.

Claim IDs are short labels unique within one source. References outside that
source use `<source-id>/<claim-id>`. Image records belong to the source that
represents the image. Photograph sources use `depicts` relationships to link
objects; a publishing source uses `reproduces` to link an independent
photograph. The image record itself has no object ID.

Editorial files use this front matter followed by ordinary Markdown:

```markdown
---
subjects:
  - type: object
    id: example-object
  - type: source
    id: example-source
title: Example title
author: Example author
language: en-GB
---

Editorial text.
```

`subjects` is optional and can name multiple objects or sources. Editorial files
without subjects are general articles. Editorial prose does not create
structured claims. Put foregroundable statements in a source JSON file.

Source indexes and detail pages are public at `/en/sources/` and `/es/fuentes/`;
editorials have paired indexes and detail pages under `/en/editorials/` and
`/es/editoriales/`.

Run `just collection-check` before committing collection changes.
