# IndiGen register migration history

This is frozen supporting history for the existing IndiGen register, retained
from the first shared-workspace migration. It is not a template, source record,
current research dashboard or document to update after imports. Current work
belongs in the [campaign](../campaigns/indigen-follow-up.md) and optional
[register](indigen-recollecting-rapa-nui-gallery.json). The former research
archive directory has been removed; original source captures stay in
`source-files/` with metadata in their collection sources.

## What this preserves

On 2026-09-30, the existing local register was copied into
[shared progress](indigen-recollecting-rapa-nui-gallery.json).
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
- [Historical notes](#historical-search-notes) condense 14 useful authored audits.
  They preserve search scope, findings and obstacles, with explicit dates.
- The [Chile candidate searches](#recorded-chile-candidate-searches) retain attempted
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
batch evidence and limitation changes. Status parity passed for all stage counts, institutions, active and inactive
entries, batches and completed totals. A clean clone of the migration commit
passed the same checks with no `research-local/` directory and with Git LFS
pointers instead of evidence payloads.
At migration, there were 417 active entries, 90 complete within their recorded
four-stage scope, and no source drift. These figures are a dated snapshot,
not a maintained programme dashboard.

Use `just research-check` when reviewing this register. It validates its
structure and references. Changes since review are advisory; historical Git
commits are retained as context, not required dependencies. Source captures
have their own content check when hydrated.

## Historical search notes

These are dated observations, not current catalogue coverage. Keep unresolved
searches unresolved: an access block, index miss or partial public database does
not establish absence. Accession matches do not establish ownership, consent,
cultural authority or present location. The notes below retain reasoning and
follow-up that are not a second record of completed imports. Later register
batches may resolve these historical obstacles; read current status before
acting on them. This is frozen migration evidence, not a log to maintain.
Exact queries, accession lists and object outcomes remain in the
[register](indigen-recollecting-rapa-nui-gallery.json); the named
batches below identify the relevant history.

### Te Papa image rights

Source: `image-reviews/2026-09-30/te-papa/audit.md`.

For Ua OL000353/2, the [official item page](https://collections.tepapa.govt.nz/object/180647)
showed the image but explicitly said “All Rights Reserved” while the copyright
holder was being sought. Public display and the object's credit do not grant
image reuse. Keep the image unavailable unless item-specific reusable terms or
permission are documented. The caption's “unknown” is the maker field, not a
photographer credit.

### Met pilot

Source: `museum-pilot/met/2026-09-30.md`.

The accession match was the identity test, not independent verification of
museum statements. The attributed medium accounts already live in the
[Met source](../../collection/sources/met-moai-papa-1979-206-1478.json) and
[IndiGen source](../../collection/sources/indigen-recollecting-rapa-nui-gallery.json);
consult those records rather than maintaining another transcription here.

### Museum Fünf Kontinente, Munich

Source: `museum-pilot/munich/2026-09-30-audit.md`.

The legacy MoSA entry `kava-kava-munchen` has no museum inventory number or
distinctive details. The museum search surfaced three plausible records—193,
94-317 747 and 94-317 758—so the older entry cannot be assigned among them. Keep
it separate and ambiguous until evidence distinguishes it. For exact lookup,
use the museum's [Sammlung Online](https://onlinedatenbank-museum-fuenf-kontinente.de/)
“Inventar-Nr.” field and verify the number on the detail page. No image-specific
reuse grant was established in this pass.

### Museum der Kulturen Basel

Source: `museum-rollout/europe-other/basel-audit.md`.

The old Vc 1686 detail URL mistakenly queried Vc 1514. Do not reuse it when
resuming from the local audit. The distinction between accession and entry
numbers and the current search recipe belong in the
[holder lookup guide](../../.agents/skills/identify-objects/references/holder-lookups.md).
Use batch `basel-reviewed-records-2026-09-30` and source capture metadata for
reviewed records and preservation results; early capture failures in the local
audit are not current stage outcomes.

### Canterbury, Tūhura Otago and National Museums Scotland

Source: `museum-rollout/nz-scotland/research-audit.md`.

Batch `nz-scotland-museum-follow-up-2026-09-30` records the exact search scope
and per-object results. Canterbury, Otago and NMS presented human-verification
challenges during parts of the work. Records not reached were unreviewed,
not absent. The NMS publication includes bibliography-only accession mentions;
those must not be treated as descriptions of the corresponding objects.
Institution-wide publication counts also do not measure the assigned batch.

### Völkerkundemuseum Zürich

Source: `museum-rollout/resume/europe-other/zurich-audit.json`.

The [availability statement](https://www.musethno.uzh.ch/de/Ueber_uns/aktuell/box-by-box.html)
said on 30 September 2026 that a collection database was planned by 2028 and
individual artefacts were not yet visible. [Box by Box](https://musethno-collections.ch/)
was schematic, not an item catalogue. This explains the access limitation in
batch `europe-resume-zurich-2026-09-30`; retry when individual records become
available.

### Museo Fonck catalogue discovery

Source: `museum-rollout/resume/fonck/research-audit.md`.

This was institution-level discovery, not an exhaustive accession search.
Only one exact-string portal search completed; batch
`fonck-catalogue-discovery-2026-09-30` preserves that attempt and its scope.
The unresolved assignments remained deferred rather than "not found".

The actionable library lead is the 1986 *Catálogo de la colección pascuense,
Museo Sociedad Fonck* (Viña del Mar). The museum's 7 November 2023 article about
José Miguel Ramírez and a public procurement record identify the title; no
readable authorised digital copy was found. Its contents and relation to the
assigned accessions remain unverified. A 2017 procurement line received no
offers and does not establish a holding at Biblioteca William Mulloy. No
enquiry or purchase was made.

### Final four Lower Saxony records

Source: `museum-rollout/resume/germany/final-four-search-audit.json`.

Batch `germany-lower-saxony-final-four-2026-09-30` records the searches and
matched sources. The positive control returned an unrelated shelfmark: it
showed that the search could return results, not that the museum objects were
fully indexed. The portals are partial inventories, so negative results do
not establish absence.

### Lübeck and Frankfurt exact-search follow-up

Source: `museum-rollout/resume/lubeck-frankfurt/parent-review.json`.

Exact and numeric-variant searches were checked against saved result text,
with positive controls checked separately. Batch
`lubeck-frankfurt-10-first-pass-2026-09-30` retains the query ledger; the later
`lubeck-frankfurt-dependent-stages-2026-09-30` batch defers work that depends
on a verified identity. Neither public catalogue was established as a complete
inventory, so the negative results do not establish absence.

### Museo de Historia Natural de Valparaíso — final two

Source: `museum-rollout/resume/mhnv/final-two/audit.json`.

Batch `mhnv-final-two-bounded-outcomes-2026-09-30` distinguishes a supported
record match without an original capture from an unresolved identity after
access failures. A preservation failure must not undo a supported identity;
an inaccessible candidate must not become a "not found" conclusion.

### MHNV publication comparison

Source: `museum-rollout/resume/mhnv/review.json`.

The [publication source notes](../../collection/sources/ramirez-2017-coleccion-mhnv.json)
already explain the numbered-caption scope, unresolved date and measurement
differences, unmapped testimony and image-rights limits. Those notes are the
maintained account of that review.

### Source-addition audit and 17-192 capture limitation

Source: `museum-rollout/resume/source-audit/a574f74-to-head.md`.

The [source notes and capture metadata](../../collection/sources/chile-patrimonios-02sdc-17-192.json)
identify which evidence supplied the catalogue number and which fields the PDF
preserves. The register records the capture follow-up; this audit adds no
separate collection correction or status requirement.

### Linden-Museum Stuttgart search

Source: `museum-rollout/resume/stuttgart/search-audit.json`.

An early UI locator did not apply its search filter. Those attempts were
discarded and repeated with visible active-filter checks and a known positive
control. Batch `stuttgart-remaining-search-2026-09-30` preserves the actual
queries and outcomes. Check that the filter took effect before interpreting a
future negative result.

### Germany discovery access findings

Source: `museum-rollout/germany/lookup-audit.json`.

The original access audit predates later successful follow-up, especially for
MARKK and Bremen. It must not be used as their current status. The shared
[holder recipes](../../.agents/skills/identify-objects/references/holder-lookups.md)
retain useful search methods; the register holds the later object outcomes.

Göttingen's official portal presented an Anubis browser-verification challenge.
That remains an access lead for an ordinary-browser retry or a privately
supplied record, not an absence conclusion. The old audit named Köln, Lübeck
and Frankfurt without documenting findings for them; do not infer that merely
being listed meant their catalogues had been searched.

## Recorded Chile candidate searches

Historical search metadata only; these were unreviewed candidates in the
originating batch. Later register batches may resolve them. This retained
attachment is not another collection source.

```json
{
  "migrationNote": "Selected search metadata from the historical local audit. Scraped record bodies omitted. Candidates were not verified in this batch; later register batches may resolve them.",
  "checkedAt": "2026-09-30",
  "recipe": "Candidate template only: official Chile Patrimonios /ficha?doi=05SDC-{series}-{accession}, grounded in verified fiches 05SDC-17-299 (MAPSE) and 05SDC-4-1915 (MHNV). The resulting page is checked for institution, linked SURDOC number, type, description and dimensions. For a missing or mismatching page, fallback to the official exact-identifier search /resultados?Recursos=on&s={accession}; follow its returned fiche and compare details. Template is a candidate, never proof of identity.",
  "results": [
    {
      "objectId": "ao-valparaiso-mhnv-76-registro-surdoc-4-1956",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 76 Registro surdoc 4-1956",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1956",
          "reason": "Observed accession template candidate",
          "status": 200
        }
      ]
    },
    {
      "objectId": "ika-valparaiso-mhnv-47-registro-surdoc-4-1936",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 47 Registro surdoc 4-1936",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1936",
          "reason": "Observed accession template candidate",
          "status": 200
        }
      ]
    },
    {
      "objectId": "moai-kavakava-rapa-nui-17-303",
      "holder": "Museo Antropológico Padre Sebastián Englert (MAPSE)",
      "accession": "17-303",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-17-303",
          "reason": "Observed accession template candidate",
          "status": 404
        },
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-17-303",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-kavakava-rapa-nui-17-296",
      "holder": "Museo Antropológico Padre Sebastián Englert (MAPSE)",
      "accession": "17-296",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-17-296",
          "reason": "Observed accession template candidate",
          "status": 404
        },
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-17-296",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-kavakava-rapa-nui-17-309",
      "holder": "Museo Antropológico Padre Sebastián Englert (MAPSE)",
      "accession": "17-309",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-17-309",
          "reason": "Observed accession template candidate",
          "status": 404
        },
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-17-309",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-kavakava-rapa-nui-17-192",
      "holder": "Museo Antropológico Padre Sebastián Englert (MAPSE)",
      "accession": "17-192",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-17-192",
          "reason": "Observed accession template candidate",
          "status": 404
        },
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-17-192",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-kavakava-rapa-nui-17-10",
      "holder": "Museo Antropológico Padre Sebastián Englert (MAPSE)",
      "accession": "17-10",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-17-10",
          "reason": "Observed accession template candidate",
          "status": 404
        },
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-17-10",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-kavakava-valparaiso-mhnv-15-registro-surdoc-4-1993",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 15 Registro surdoc 4-1993",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1993",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-kavakava-rapa-nui-17-326",
      "holder": "Museo Antropológico Padre Sebastián Englert (MAPSE)",
      "accession": "17-326",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-17-326",
          "reason": "Observed accession template candidate",
          "status": 404
        },
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-17-326",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "ika-valparaiso-mhnv-64-registro-surdoc-4-1947",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 64 Registro surdoc 4-1947",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1947",
          "reason": "Observed accession template candidate",
          "status": 200
        },
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1947",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-kavakava-valparaiso-mhnv-19-registro-surdoc-4-2213",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 19 Registro surdoc 4-2213",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-2213",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-kavakava-valparaiso-mhnv-2-registro-surdoc-4-1985",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV-2 Registro surdoc 4-1985",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1985",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-kavakava-valparaiso-mhnv-21-registro-surdoc-4-2214",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 21 Registro surdoc 4-2214",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-2214",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-kavakava-valparaiso-mhnv-26-registro-surdoc-4-1922",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV-26 Registro surdoc 4-1922",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1922",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-kavakava-valparaiso-mhnv-27-registro-surdoc-4-1924",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 27 Registro surdoc 4-1924",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1924",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-kavakava-valparaiso-mhnv-35-registro-surdoc-4-1927",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 35 Registro surdoc 4-1927",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1927",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-kavakava-valparaiso-mhnv-49-registro-surdoc-4-1937",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 49 Registro surdoc 4-1937",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1937",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-kavakava-valparaiso-mhnv-5-registro-surdoc-4-1987",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV-5 Registro surdoc 4-1987",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1987",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-kavakava-valparaiso-mhnv-52-registro-surdoc-4-1939",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 52 Registro surdoc 4-1939",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1939",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-kavakava-valparaiso-mhnv-53-registro-surdoc-4-1997",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 53 Registro surdoc 4-1997",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1997",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-kavakava-valparaiso-mhnv-55-registro-surdoc-4-1940",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 55 Registro surdoc 4-1940",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1940",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-kavakava-valparaiso-mhnv-56-registro-surdoc-4-1941",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 56 Registro surdoc 4-1941",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1941",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-kavakava-valparaiso-mhnv-57-registro-surdoc-4-1942",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 57 Registro surdoc 4-1942",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1942",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-kavakava-valparaiso-mhnv-58-registro-surdoc-4-1943",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 58 Registro surdoc 4-1943",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1943",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-kavakava-valparaiso-mhnv-60-registro-surdoc-4-1944",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 60 Registro surdoc 4-1944",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1944",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-kavakava-valparaiso-mhnv-62-registro-surdoc-4-1945",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 62 Registro surdoc 4-1945",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1945",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-kavakava-valparaiso-mhnv-63-registro-surdoc-4-1946",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 63 Registro surdoc 4-1946",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1946",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-kavakava-valparaiso-mhnv-9-registro-surdoc-4-1915",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV-9 Registro surdoc 4-1915",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1915",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-pa-apa-a-rapa-nui-17-259",
      "holder": "Museo Antropológico Padre Sebastián Englert (MAPSE)",
      "accession": "17-259",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-17-259",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-pa-apa-a-rapa-nui-17-9",
      "holder": "Museo Antropológico Padre Sebastián Englert (MAPSE)",
      "accession": "17-9",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-17-9",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-tangata-rapa-nui-17-332",
      "holder": "Museo Antropológico Padre Sebastián Englert (MAPSE)",
      "accession": "17-332",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-17-332",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-tangata-rapa-nui-17-335",
      "holder": "Museo Antropológico Padre Sebastián Englert (MAPSE)",
      "accession": "17-335",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-17-335",
          "reason": "Observed accession template candidate",
          "status": 404
        },
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-17-335",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-tangata-rapa-nui-17-295",
      "holder": "Museo Antropológico Padre Sebastián Englert (MAPSE)",
      "accession": "17-295",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-17-295",
          "reason": "Observed accession template candidate",
          "status": 404
        },
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-17-295",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-tangata-valparaiso-mhnv-10-registro-surdoc-4-1991",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 10 Registro surdoc 4-1991",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1991",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-tangata-valparaiso-mhnv-11-registro-surdoc-4-1916",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 11 Registro surdoc 4-1916",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1916",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-tangata-valparaiso-mhnv-22-registro-surdoc-4-1920",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 22 Registro surdoc 4-1920",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1920",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-tangata-valparaiso-mhnv-3-registro-surdoc-4-1914",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 3 Registro surdoc 4-1914",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1914",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-tangata-rapa-nui-17-416",
      "holder": "Museo Antropológico Padre Sebastián Englert (MAPSE)",
      "accession": "17-416",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-17-416",
          "reason": "Observed accession template candidate",
          "status": 404
        },
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-17-416",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-tangata-valparaiso-mhnv-4-registro-surdoc-4-1986",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 4 Registro surdoc 4-1986",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1986",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-tangata-valparaiso-mhnv-50-registro-surdoc-4-1938",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 50 Registro surdoc 4-1938",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1938",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-tangata-valparaiso-mhnv-6-registro-surdoc-4-1988",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 6 Registro surdoc 4-1988",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1988",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-tangata-valparaiso-mhnv-67-registro-surdoc-4-1998",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 67 Registro surdoc 4-1998",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1998",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-tangata-valparaiso-mhnv-7-registro-surdoc-4-1989",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 7 Registro surdoc 4-1989",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1989",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-tangata-valparaiso-mhnv-8-registro-surdoc-4-1990",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 8 Registro surdoc 4-1990",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1990",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "paoa-valparaiso-mhnv-1-registro-surdoc-4-1984",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 1 Registro surdoc 4-1984",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1984",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "moai-tangata-valparaiso-mhnv-34-registro-surdoc-4-1926",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 34 Registro surdoc 4-1926",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1926",
          "reason": "Observed accession template candidate",
          "status": 200
        },
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1926",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "reimiro-rapa-nui-17-30",
      "holder": "Museo Antropológico Padre Sebastián Englert (MAPSE)",
      "accession": "17-30",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-17-30",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "reimiro-valparaiso-mhnv-28-registro-surdoc-4-1994",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 28 Registro surdoc 4-1994",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1994",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "reimiro-valparaiso-mhnv-38-registro-surdoc-4-1995",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 38 Registro surdoc 4-1995",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1995",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "tangata-manu-valparaiso-mhnv-40-registro-surdoc-4-1931",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 40 Registro surdoc 4-1931",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-1931",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "tangata-manu-valparaiso-mhnv-54-registro-surdoc-4-358",
      "holder": "Museo de Historia Natural de Valparaíso",
      "accession": "MHNV 54 Registro surdoc 4-358",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-4-358",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    },
    {
      "objectId": "ua-rapa-nui-17-194",
      "holder": "Museo Antropológico Padre Sebastián Englert (MAPSE)",
      "accession": "17-194",
      "attempted": [
        {
          "url": "https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-17-194",
          "reason": "Retrieval error",
          "error": "TimeoutError: The operation was aborted due to timeout"
        }
      ]
    }
  ]
}
```
