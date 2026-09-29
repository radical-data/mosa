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
