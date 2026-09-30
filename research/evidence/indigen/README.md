# IndiGen evidence migration

## What this preserves

On 2026-09-30, the existing local register was copied into
[shared progress](../../progress/indigen-recollecting-rapa-nui-gallery.json).
Its version, revision 45, one inventory, 44 batches, original dates, searches,
checks, commits, object outcomes, stage references and source hashes are
unchanged. Only batch evidence locations and optional limitation notes changed.
This preserves historical reports; it does not repeat or independently verify
the museum research.

The original register remains unchanged in ignored local storage. Its SHA-256
is `0274f1a8d52a9fa35c5f148b4fe7870bc9b3e80a49b2792e6241220e9c019988`.
The shared register is now the authoritative copy; do not update the local one.

## Evidence selection

The register referenced 182 distinct local evidence files. This bounded review
examined those references, not every file in local research:

- 30 local files were byte-identical to tracked material: 21 HTML captures,
  one PDF capture and eight published images. References now reuse those files.
- [Historical notes](historical-notes.md) condense 14 useful authored audits.
  They preserve search scope, findings and obstacles, with explicit dates.
- The [Chile candidate searches](chile-candidate-searches.json) retain attempted
  URLs and identifiers, omitting scraped record bodies. The originating batch
  treated these as unreviewed candidates.
- The other 137 local files remain local: raw extracts, screenshots, downloads,
  detailed intermediate audits, headers and build logs. The relevant batches
  state their evidence limitations. No new binary evidence was shared.

Existing tracked evidence and public URLs remain referenced. Where a batch otherwise had only local evidence, its shared evidence list now
points to collection sources already named in its original source hashes.
Those batches explicitly record this substitution and the absent original
audits. Successful-retrieval logs, import summaries and duplicated catalogue
fields were not copied merely to create another account of published work.
No source, claim, object, image, hash or historical outcome was changed to make
this migration pass.

The retained notes are historical documents, not an additional maintained
status system. Their original filenames identify local audit provenance;
those labels do not promise access to the local files. Use the register's
latest outcomes and next actions to resume work. When private supporting
material is needed, supply it separately or repeat the specific check and
record a new batch. Missing shared evidence is still an error; an acknowledged
local evidence limitation is reported separately from completion totals.

## Verification

The original and shared registers were compared field by field, allowing only
batch evidence and limitation changes. Status parity checks cover all stage
counts, institutions, active and inactive entries, batches and completed totals.
At migration, there were 417 active entries, 90 complete within their recorded
four-stage scope, and no source drift. These figures are a dated snapshot,
not a maintained programme dashboard.

Run `just research-check` for repository consistency. It checks references and
historical commits, not the truth of past research or the content of remote
pages. Source captures have their own content check when hydrated.
