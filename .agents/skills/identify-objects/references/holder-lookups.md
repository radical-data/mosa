# Reuse holder catalogue lookups

Consult the relevant holder entry before researching another object. These are
retrieval recipes, not object matches or image permissions. Last checked:
2026-09-30. Keep attempted object URLs and outcomes in the private progress
register; maintain successful, non-sensitive methods here across imports.

For each new holder, record its official catalogue, tested method and example,
identifier formatting, fallback search, and access limitations. Distinguish a
catalogue accession from an internal database ID. Record which parts of a URL
are substitutable, including required URL encoding, rather than replacing every
number in the URL. Retest a recipe when it stops working; retain useful failure
information without treating temporary access failures as permanent absence.

When a verified record URL contains the accession, substitute the next object's
accession using the observed formatting. Treat the resulting URL as a candidate:
check the returned page's institution, displayed identifier, type and supporting
physical or provenance details. A redirect, HTTP 200 or plausible slug is not
verification. A miss calls for the holder's search and documented identifier
variants, not an immediate `not-found` outcome. Never use internal numeric IDs
as if they were catalogue numbers.

## Museum Rietberg

- Catalogue: <https://rietberg.ch/sammlungen/sammlung-entdecken>.
- Accession template observed for RPO records:
  `https://rietberg.ch/sammlungen/rpo-{number}`. Example: RPO 318 →
  <https://rietberg.ch/sammlungen/rpo-318>.
- Lower-case the RPO prefix and replace its separating space with a hyphen.
  Other accession families need their own observed example.
- Fallback: use the catalogue's `search` query parameter with the full accession,
  URL-encoded, and `search-by-inventory-number=1`.
- Verify `Inventarnummer`; definition lists contain labelled catalogue fields.
  Expand provenance and other relevant sections when preserving the page.
- Image reuse requires separate review of the record and rights notice.

## Museum of Archaeology and Anthropology, Cambridge

- Search: `https://collections.maa.cam.ac.uk/objects/?query={accession}`.
  URL-encode the full displayed accession, retaining letter suffixes and spaces.
- Example: `1931.341` search returns
  <https://collections.maa.cam.ac.uk/objects/510269>.
- The detail URL uses an internal ID. Obtain it from a search result; do not
  substitute an accession into that numeric position. Verify `Accession No`.
- Record fields and dated `Events` can disagree. Preserve dated contributions
  and named knowledge holders rather than flattening the event history into
  the current description. Review image-specific rights and policy exceptions.

## Canterbury Museum

- Catalogue: <https://collection.canterburymuseum.com/explore>.
- Search: `https://collection.canterburymuseum.com/objects?query={accession}`.
- Example: `E150.1137` returns
  <https://collection.canterburymuseum.com/objects/60929/dance-paddle-ao>.
- The detail URL contains an internal ID and title slug, not the accession.
  Follow search results and compare `Catalogue number` and former identifiers.
- Direct HTTP requests returned 403 during this research; the ordinary browser
  search and repository SingleFile capture succeeded. Check that normal route
  before recording an access blocker. Respect any actual access challenge.
- Classification dates and machine-generated subject tags are not manufacturing
  dates or necessarily curated classifications. Per-record image rights apply.

## The Metropolitan Museum of Art and Te Papa

Existing imported records provide examples to reuse, but their URL numbers are
internal record IDs: Met accession `1979.206.1491` maps to
<https://www.metmuseum.org/art/collection/search/313680>; Te Papa registration
`FE008597` maps to <https://collections.tepapa.govt.nz/object/83717>. Search by
accession to obtain another internal ID. Reuse the successful catalogue or API
search method from the private audit, and verify the returned registration.
Do not substitute accession numbers into these object-ID paths.

## Ethnologisches Museum, Staatliche Museen zu Berlin

- The old catalogue home redirects to <https://search.smb.museum/>. Its public
  pages contain rendered search results and labelled catalogue fields.
- Search: `https://search.smb.museum/?q={accession}`. URL-encode the complete
  institution-scoped accession, for example `VI 4950`.
- Follow the returned internal record link, for example
  <https://search.smb.museum/object/obj-998470>. Prefer the record's explicit
  permalink, <https://id.smb.museum/object/998470>, as the source reference.
- Compare `Ident. Nr.`, the collection and dimensions. These URL IDs are not
  accessions. The geographic-relations field is not an explicit making place.
- In six reviewed IndiGen entries, appended `- A` or `- B` corresponded to
  photograph views; the museum displayed the base accession. Searches including
  the hyphen returned unrelated results. Removing the view suffix located the
  record, and all dimensions matched. Apply this fallback only with supporting
  evidence; do not strip meaningful sub-accessions indiscriminately.
- Each gallery photograph has its own `Fotonachweis` and rights text beside its
  original-file link. Preserve that image's photographer credit and licence,
  rather than assigning another view's credit or assuming an institutional
  blanket licence. Twenty-seven selected images explicitly carried CC BY-NC-SA
  4.0 during this batch.

## SKD Dresden and GRASSI Leipzig

- Catalogue: <https://skd-online-collection.skd.museum/Search>. The extended
  search has a dedicated inventory-number field. Its submitted URL is
  `https://skd-online-collection.skd.museum/Result/Index?page=1&inv={accession}&smode=And`.
- Preserve accession prefixes and leading zeroes; URL-encode spaces. `Po 00447`
  returns <https://skd-online-collection.skd.museum/Details/Index/1589333>.
  The detail route uses an internal ID, not an accession.
- Verify both `Inventarnummer` and the member museum. The same digits can return
  records belonging to a different SKD collection.
- After an exact miss, search `Rapa Nui` or `Osterinsel` in the full-text field
  and compare accession numbers in the results. One exact miss is insufficient
  to establish that the record is absent.
- Reviewed records labelled images `Freier Zugang – Rechte vorbehalten`.
  Public viewing does not establish permission to republish those photographs.

## Linden-Museum Stuttgart

- Catalogue: <https://sammlung-digital.lindenmuseum.de/en/object>. Use its
  advanced search's full-text field for an accession, then `Rapa Nui` as a
  fallback if the accession returns no result.
- The observed record <https://sammlung-digital.lindenmuseum.de/en/object/staff_13736>
  displays inventory number `004567`. The trailing route number is an internal
  ID; the six-digit accession includes leading zeroes missing from IndiGen.
- Verify the displayed accession, object type, dimensions and provenance.
  Preserve the named author of descriptive passages and inspect the individual
  photograph's credit and licence; this record displayed CC BY-SA 4.0.

## Swedish National Museums of World Culture (Carlotta)

- Use the correct collection: Etnografiska museet uses
  <https://collections.smvk.se/carlotta-em/web/>; Världskulturmuseet uses
  <https://collections.smvk.se/carlotta-vkm/web/>.
- The observed search route is
  `perform/free_search?FreeSearch_TEXT_OPERAND=CONTAINS&FreeSearch_TEXT_VALUE={accession}`
  under that collection's `web/` root. URL-encode the complete accession,
  preserving leading zeroes and dot separators.
- Searches can return photographs and fuzzy matches. Open a result of type
  `Objekt` and verify `Inventarienummer`, plus supporting descriptive fields.
- Example: Stockholm `1909.10.0021` is
  <https://collections.smvk.se/carlotta-em/web/object/1587472>.
  Detail routes use internal IDs, which cannot be generated from accessions.
- Keep catalogue uncertainty and dated corrections. Review rights on the
  specific photograph; an icon elsewhere on the record is insufficient.

## Wereldmuseum Leiden

- The catalogue is a browser-rendered application. A raw HTML application shell
  is not evidence that the catalogue is inaccessible.
- Enter the complete accession in the visible search field and select `Zoeken`.
  Search is fuzzy: `RV-510-17` returned eight results. Open the plausible object
  and verify its displayed `Inventarisnummer` and dimensions.
- Use the record's stable handle, for example
  <https://hdl.handle.net/20.500.11840/661771> for `RV-510-17`.
  The handle number is an internal identifier, not a substitutable accession.
- Review image credit and licence on each record; this example displayed
  CC BY-SA 4.0. Do not apply that example's rights to other photographs.

## Chile Patrimonios and SURDOC

- Tested candidate template:
  `https://www.chilepatrimonios.gob.cl/ficha?doi=05SDC-{series}-{number}`.
  Verified examples are `05SDC-4-1915` (Museo de Historia Natural de Valparaíso)
  and `05SDC-17-299` (Museo Antropológico Padre Sebastián Englert).
- The DOI prefix varies by record. A `05SDC-` miss is not a missing accession:
  the official search for `17-303` returned `02SDC-17-303` instead.
- Fallback search:
  `https://www.chilepatrimonios.gob.cl/resultados?Recursos=on&s={accession}`.
  URL-encode the accession. Results can match substrings: `17-10` returned
  114 results, including the exact `02SDC-17-10` record.
- Verify the institution, title, descriptive fields and linked SURDOC
  `surdoc.cl/registro/{series}-{number}` identifier. The accession is distinct
  from the portal's DOI prefix.
- A browser navigation timeout was followed by a fully rendered page. Inspect
  current page state after a timeout before recording an access blocker.

## Museum der Kulturen Basel

- Catalogue: <https://onlinecollection.mkb.ch/>. Search the full accession in
  the visible `Suche` interface. Open the object entry and verify `Objektnummer`;
  results also include photographic-archive records with the same number.
- `Einlaufnummer` is a separate field. The `/query/<uuid>` fragment identifies
  a catalogue query/view; neither its UUID nor the surrounding query is an
  accession substitution template. Keep the observed URL and recheck its record.
- Four object links reopened correctly in the ordinary browser, but isolated
  SingleFile captures saved the default catalogue even after a rendering wait.
  Inspect captures for the accession and cited text rather than trusting success.
- The catalogue's `PDF` control successfully exported the selected record with
  `Detaillierte Informationen pro Datensatz`. Verify the first/last record
  selection, download, inspect the PDF and register its original bytes using
  the source-capture procedure. One export contained a logo placeholder instead
  of a photograph; record such preservation limitations.
- The explicit CC BY 4.0 notice covers the dataset. Do not infer clearance for
  an individual photograph from that data licence alone.
