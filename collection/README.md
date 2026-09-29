# MoSA collection

The public collection is part of the website build. Every tracked record is
publishable.

## Structure

- `objects/`: one JSON file per collection object.
- `sources/`: one JSON file per source, including its claims and image records.
- `editorials/`: optional Markdown articles with YAML front matter.
- `images/`: local collection images tracked with Git LFS.
- `schema/`: JSON Schemas for object and source files.

Object, source and editorial file names establish their IDs. Use lower-case
ASCII letters, digits and single hyphens between words. JSON object and source
records and editorial front matter do not repeat the file ID.

Claim IDs are short labels unique within one source. References outside that
source use `<source-id>/<claim-id>`. Image records use their source, `objectId`
and `file` relationship and have no separate ID.

Editorial files use this front matter followed by ordinary Markdown:

```markdown
---
objectId: example-object
title: Example title
author: Example author
language: en-GB
---

Editorial text.
```

Editorial prose does not create structured claims. Put foregroundable statements
in a source JSON file.

Run `just collection-check` before committing collection changes.
