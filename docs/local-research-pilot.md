# Local research pilot: Paula's inventory

Prepared on 22 September 2026 with Codex in a local research session.

The private working folder is `research-local/paula-pilot/`. Its packed
`bundle.mosa.json` contains three sources, three proposed records and ten research
outcomes. Original files and research material are excluded from Git and from
formatting/linting. The reusable workflow is in [Local research](local-research.md).

## Sources and preparation

- The supplied `arte-escultura_-_museos-1.pdf` is preserved unchanged. Its museum
  inventory appears on pages 12–19. Pages 15–18 were rendered and inspected for
  this batch. The compiler's full identity and document date remain unspecified.
- The supplied CSV was decoded as CP850 and used to locate rows. It is a derivative
  search aid. Source citations point to the original PDF.
- Two Te Papa HTML responses were captured with retrieval dates and checksums:
  [Ao, object 180901](https://collections.tepapa.govt.nz/object/180901) and
  [Ua, object 180647](https://collections.tepapa.govt.nz/object/180647).

The saved Te Papa HTML's readable text supports the page titles but omits much of
the catalogue detail shown by the rendered/indexed pages. No identifier, custody
or description was proposed from text absent from the saved copy. Raw HTML,
readable text and retrieval sidecars remain in the working folder.

Blank museum/location cells were interpreted only within visually checked table
blocks. For example, the Ao row on page 17 inherits its institution and location
from the preceding National Museum of New Zealand row. The distinct Ua and Ua (2)
rows were not collapsed into one object.

## Ten researched leads

| Lead from the PDF | Outcome of this bounded pass |
| --- | --- |
| British Museum: named Hoa Haka Nana Ia moai | Catalogue located; raw capture returned HTTP 403. Prepared a name proposal citing the PDF only. |
| British Museum: inscribed rei miro | More than one possible inscribed reimiro; no exact identity established. |
| British Museum: rapa | Located Oc.5849, whose record also refers to Oc.5848. The seed does not distinguish them. |
| British Museum: rongorongo tablet | Possible catalogue URL returned HTTP 403 through the web reader. No preserved record. |
| Wellington: ao | Preserved object 180901 and proposed its title. The seed-to-record identity remains unresolved. |
| Wellington: ua | Preserved object 180647 and proposed its title. The seed's Ua and Ua (2) entries require separate reconciliation. |
| Smithsonian: rongorongo tablet | Indexed record found, but web opening returned 404 and local capture returned 403. No reconstructed source was substituted. |
| Pitt Rivers: moko | No verified museum record in this pass. A scholarly pointer to 1905.2.1 remains for follow-up. A stone moai result was rejected as a different object type. |
| Dublin: moko | No verified museum record. An auction comparison points to 1880.1603 and a publication reference; these remain unverified leads. |
| Oslo: shell-ended rei miro | A scholarly table lists an Oslo reimiro, but does not establish the seed's distinguishing description. No exact match. |

The bundle retains search terms, inspected URLs, original page/row locators and
follow-up questions. “No match” describes this limited search, not absence from a
museum collection. Search snippets were never promoted into preserved evidence.

## Proposed records

1. The name **Hoa Haka Nana Ia**, preserving the PDF's spelling and citing its
   page 16 row. Review against the existing Hoa Hakananai'a entity before accepting
   anything; the pilot does not claim to discover a new object.
2. **Ao (Dance paddle)** from the preserved Te Papa title.
3. **Ua (staff or club)** from the preserved Te Papa title.

All three are proposals. Their holder, catalogue identity and attribution remain
for review. The generic seed entries are not asserted to identify the selected
Te Papa objects. No real records were accepted or published.

## Reproduce the local check

```sh
just research-bundle check research-local/paula-pilot/bundle.mosa.json
```

The built application successfully imported this real bundle into a disposable
local database: three preserved sources, three private drafts and ten research
outcomes. The HTTP regression harness checked the counts and review page without
accepting the real proposals. Set `RESEARCH_BUNDLE_TEST_FILE` to the packed bundle
to repeat that check. Ordinary CI uses synthetic fixtures and does not depend on
private source files or live museum services.

Verification also passed 209 unit tests, 294 database assertions, publication and
importer checks, and both application builds. After the Supabase CLI connection
timed out, the existing SQL tests were run through a direct PostgreSQL connection
against the freshly reset disposable database. The HTTP checks covered interrupted
imports, concurrent retries, ownership, immutable provenance, human edits and
acceptance of synthetic proposals.

Hosted sign-in, Storage and deployment need their own live check. Local storage
substitutes do not establish that the production configuration works.
