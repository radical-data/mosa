# Supabase collection migration

This report records the conversion from the final Supabase export taken on
2026-09-29. The private SQL export, Auth records, uploaded source documents and
original bundle proposals remain under the ignored `research-local/` directory.

## Result

- 17 canonical objects became object JSON files.
- 3 unaccepted drafts became separate object JSON files for later review. The
  Hoa Haka Nana Ia draft remains separate from the existing Hoa Hakananaiʻa
  object; the migration does not assert that they are the same record.
- 33 active claims about canonical objects became source claims.
- 7 external identifiers became `catalogue_number` claims.
- 3 draft name proposals became source claims.
- 12 entity-name claims provide readable values for agents and places rather
  than becoming independent collection claims.
- 19 structural `refers_to` claims are represented by claims and images carrying
  an `objectId` rather than copied as public claims.
- No active canonical claim was omitted for lacking evidence.
- The database contained no foregrounding selections, provenance events or
  restitution records, so the migration did not invent any.
- The source archive contained 3 PDFs and 3 HTML captures. These remain private
  evidence and are not presented as object images.
- Two supplied Spanish editorials were added for Mamari and Hoa Hakananaiʻa.
  Their authors were not recorded in the supplied files and remain `null`.

## Object reconciliation

| Object | Previous state | Git record |
| --- | --- | --- |
| Hoa Hakananaiʻa | Visible legacy publication | `077f88f1-278a-4d76-90e3-a9276953b387` |
| Aroukou Kurenga | Visible reviewed dossier | `9060635b-5c72-4030-a6a8-1e1740a57fde` |
| Rei miro de concha | Visible reviewed dossier | `f2532418-8f48-4e66-a087-d7b345b0f72d` |
| Rei miro con caras humanas y figura incise al centro | Visible reviewed dossier | `bc103cff-9ee0-4233-bb5d-984dcb109637` |
| Tahonga simple con incrustaciones | Visible reviewed dossier | `f69dc677-465b-41d3-9abe-62aefb1900e2` |
| Figura humana con boca circular | Visible reviewed dossier | `2c84d7bd-edcd-4035-b3e8-db968f343414` |
| Kava kava de doble cabeza | Visible reviewed dossier | `03e36844-7240-4318-abcb-2419eed4e3a5` |
| Rei miro de gallo | Visible reviewed dossier | `a3fd565a-c691-413d-9944-7f78fbe58ae2` |
| Piedra almohada con petroglifos (ngaru’a) | Visible reviewed dossier | `d020b17d-3aa1-4df5-aeda-b61d220e3f88` |
| Tangata Manu con signos rongo rongo | Visible reviewed dossier | `cdf42f48-1371-4e4b-88b3-fd33158e3cf9` |
| Ao pintado | Visible reviewed dossier | `3cad86a5-9e69-435f-a5d5-a8ff1b736674` |
| Moai de piedra con sombrero | Visible reviewed dossier | `0ad35cd6-b197-4f6b-bfe7-7a7c38ec9029` |
| figure ('moai kavakava') | Accepted draft without a visible publication | `0ee63e63-d7b8-4287-b373-54ca77d0bd15` |
| Mamari | Canonical bootstrap object without a visible publication | `588adff0-0fe0-4ed5-9fbf-1f95c3211c7a` |
| moai kavakava | Canonical bootstrap object without a visible publication | `a1a3b544-a63a-4346-9e6c-f97dd31a70d8` |
| МАЭ № 736-205 | Canonical bootstrap object without a visible publication | `e81ffe0f-d12c-458b-a334-18c57a48c438` |
| Plaque depicting an Oba with mudfish legs and two leopards | Canonical bootstrap object without a visible publication | `ef2fd3c5-7715-48f5-9e52-bfc0e4505ddb` |
| Ao (Dance paddle) | Unaccepted draft | `6c2c0808-a209-4767-b463-270db9f8d285` |
| Ua (staff or club) | Unaccepted draft | `f3914957-34ed-41e9-8ee2-57f4d0dddd64` |
| Hoa Haka Nana Ia | Draft under review | `41a6aec8-37e1-4853-aae9-cb2b8bafdfaf` |

## Readable identifier migration

On 29 September 2026, the collection replaced its internal UUIDs with readable
file handles before the website's first public release. The migration preserved
all records and relationships. It did not merge records, add claims or change
source wording. The historical reconciliation table above retains the UUIDs
assigned during the Supabase migration.

### Objects

| Previous ID | Current ID |
| --- | --- |
| `03e36844-7240-4318-abcb-2419eed4e3a5` | `kava-kava-doble-cabeza` |
| `077f88f1-278a-4d76-90e3-a9276953b387` | `hoa-hakananai-a` |
| `0ad35cd6-b197-4f6b-bfe7-7a7c38ec9029` | `moai-piedra-sombrero` |
| `0ee63e63-d7b8-4287-b373-54ca77d0bd15` | `moai-kavakava-british-museum` |
| `2c84d7bd-edcd-4035-b3e8-db968f343414` | `figura-boca-circular` |
| `3cad86a5-9e69-435f-a5d5-a8ff1b736674` | `ao-pintado` |
| `41a6aec8-37e1-4853-aae9-cb2b8bafdfaf` | `hoa-haka-nana-ia` |
| `588adff0-0fe0-4ed5-9fbf-1f95c3211c7a` | `mamari` |
| `6c2c0808-a209-4767-b463-270db9f8d285` | `ao-te-papa` |
| `9060635b-5c72-4030-a6a8-1e1740a57fde` | `aroukou-kurenga` |
| `a1a3b544-a63a-4346-9e6c-f97dd31a70d8` | `moai-kavakava-te-papa` |
| `a3fd565a-c691-413d-9944-7f78fbe58ae2` | `rei-miro-gallo` |
| `bc103cff-9ee0-4233-bb5d-984dcb109637` | `rei-miro-caras-humanas` |
| `cdf42f48-1371-4e4b-88b3-fd33158e3cf9` | `tangata-manu-rongorongo` |
| `d020b17d-3aa1-4df5-aeda-b61d220e3f88` | `ngaru-a` |
| `e81ffe0f-d12c-458b-a334-18c57a48c438` | `kunstkamera-736-205` |
| `ef2fd3c5-7715-48f5-9e52-bfc0e4505ddb` | `oba-mudfish-plaque` |
| `f2532418-8f48-4e66-a087-d7b345b0f72d` | `rei-miro-concha` |
| `f3914957-34ed-41e9-8ee2-57f4d0dddd64` | `ua-te-papa` |
| `f69dc677-465b-41d3-9abe-62aefb1900e2` | `tahonga-incrustaciones` |

### Sources

| Previous ID | Current ID |
| --- | --- |
| `04ec617f-94a9-4c7a-b4da-c6e004ebe6f1` | `bm-hoa-hakananai-a` |
| `2399cd84-07f7-450e-b97d-407096e5b5a6` | `kunstkamera-736-205` |
| `3b795721-162d-53d7-a237-f20d05a0ba26` | `arte-en-la-cultura-rapanui` |
| `545a3ac6-439d-4172-aa9d-bb437af0dbd9` | `sscc-mamari` |
| `619934a3-b259-40fc-a7ef-9fb746503a05` | `arte-en-la-cultura-rapanui` |
| `61f7f90c-2957-4bcc-8fb6-8163db1ed0dc` | `bm-oba-mudfish-plaque` |
| `68c6e53b-292c-4320-bbb0-76cbdb2db846` | `bm-moai-kavakava` |
| `7160b42c-6e58-5c45-a226-73c86907a5b2` | `te-papa-ao` |
| `a1b8f204-3e6f-5945-a743-43e82c33e595` | `te-papa-ua` |
| `bc3cde94-bdd0-406b-bfe0-8b19a0e74aa4` | `te-papa-moai-kavakava` |
| `beb63880-5ad6-49ec-8d1d-37ce0da1bb43` | `arte-en-la-cultura-rapanui` |
| `e9a5a8ed-0ae0-432a-938f-daf2f08bd84a` | `quai-branly-aruku-kurenga` |
| `f6d18f15-bacc-4ee9-ad2a-1bfc60829322` | `wikipedia-mamari` |

### Claims

| Previous ID | Current qualified reference |
| --- | --- |
| `00372e1c-e0e1-46a8-a585-5a53f37289f0` | `bm-hoa-hakananai-a/room` |
| `2352d5b7-89f3-4d79-8f24-f0fdc777f0ed` | `bm-hoa-hakananai-a/found-at` |
| `526a21c3-7272-4ce7-8703-4a4c18df64b5` | `bm-hoa-hakananai-a/catalogue-number` |
| `961ecabd-ccab-46d8-bf70-e16c765cd21c` | `bm-hoa-hakananai-a/holder` |
| `a3440928-134a-4639-89d3-2788502b23fe` | `bm-hoa-hakananai-a/made-at` |
| `b320b554-93cc-4f70-8fa5-febd282e155a` | `bm-hoa-hakananai-a/city` |
| `c72ce908-12f2-4005-90fc-74943d248636` | `bm-hoa-hakananai-a/aoa-catalogue-number` |
| `facf257e-d059-4605-a846-413f60beb70c` | `bm-hoa-hakananai-a/name` |
| `6d565776-6eac-4e9c-9757-2d77a0d9bb12` | `kunstkamera-736-205/holder` |
| `d7829885-2d48-42b9-9f2b-52d46a904d51` | `kunstkamera-736-205/catalogue-number` |
| `dc5208a4-9101-461b-b07e-33ff55cb54dd` | `kunstkamera-736-205/city` |
| `41a6aec8-37e1-4853-aae9-cb2b8bafdfaf-name` | `arte-en-la-cultura-rapanui/hoa-haka-nana-ia-name` |
| `f6e5b69b-f23e-49c8-977f-3cef7eab05af` | `sscc-mamari/catalogue-number` |
| `b2452727-0168-4626-9a64-5765d0be6c8f` | `arte-en-la-cultura-rapanui/kava-kava-doble-cabeza-type` |
| `8a2452df-ef75-4772-98f3-830b97fdc0ef` | `arte-en-la-cultura-rapanui/moai-piedra-sombrero-type` |
| `a4f36683-bef9-4336-a6f4-0f1e97c0e1c1` | `arte-en-la-cultura-rapanui/figura-boca-circular-type` |
| `8113ead4-e50b-4838-845f-59bafa5169c4` | `arte-en-la-cultura-rapanui/ao-pintado-type` |
| `35840dbf-bddf-4208-b6fb-ba22783d8e4a` | `arte-en-la-cultura-rapanui/rei-miro-gallo-type` |
| `b0420b9a-c7f5-4cf2-a533-9937db513b9c` | `arte-en-la-cultura-rapanui/rei-miro-caras-humanas-type` |
| `33bd8a81-4844-4c96-8c43-d342e98fdc69` | `arte-en-la-cultura-rapanui/tangata-manu-rongorongo-type` |
| `98a83dd1-e1c4-4eb3-ab00-a1f84df515f3` | `arte-en-la-cultura-rapanui/ngaru-a-type` |
| `ba4ac2fe-59ab-450b-9c3b-41330ce13ea1` | `arte-en-la-cultura-rapanui/rei-miro-concha-type` |
| `71dcd615-cf80-4564-9e4f-6367f287d424` | `arte-en-la-cultura-rapanui/tahonga-incrustaciones-type` |
| `7acb632e-3a3b-4b20-8a73-d918950bf33c` | `bm-oba-mudfish-plaque/name` |
| `8723a9d2-3f2e-4c34-90f1-909303c57602` | `bm-oba-mudfish-plaque/catalogue-number` |
| `e2bd8339-a84d-41b2-a31e-7fe8e58e3b0f` | `bm-oba-mudfish-plaque/made-at` |
| `ea01a833-3ed9-4c26-b32a-8abfca9eff88` | `bm-oba-mudfish-plaque/holder` |
| `4d8d6625-9136-48f3-b783-7286a601e2fa` | `bm-moai-kavakava/catalogue-number` |
| `e13b6078-291e-4dea-af07-6b21668309f6` | `bm-moai-kavakava/holder` |
| `e2f51df2-0c05-4c62-85fb-0cacf576c514` | `bm-moai-kavakava/name` |
| `6c2c0808-a209-4767-b463-270db9f8d285-name` | `te-papa-ao/name` |
| `f3914957-34ed-41e9-8ee2-57f4d0dddd64-name` | `te-papa-ua/name` |
| `13392755-1aa0-48e9-adac-3b1314f27f85` | `te-papa-moai-kavakava/catalogue-number` |
| `26abc563-3aff-4253-9e31-4c5eefc42b2e` | `te-papa-moai-kavakava/name` |
| `8744f71d-e22b-4dae-a249-6309fe2b19ce` | `te-papa-moai-kavakava/city` |
| `9414ac1a-8f9a-473b-8f67-41d1addc779e` | `te-papa-moai-kavakava/holder` |
| `6a2fe440-abd5-4518-9c6d-96e49eb66597` | `arte-en-la-cultura-rapanui/aroukou-kurenga-name` |
| `0848f31f-6074-4814-a4a5-304ae2a1fe18` | `quai-branly-aruku-kurenga/description` |
| `42c46593-e25e-45a6-a163-3031c163c783` | `quai-branly-aruku-kurenga/name` |
| `464c962a-7b1f-4432-bdac-68b6edcfc0c1` | `quai-branly-aruku-kurenga/type` |
| `bd08307c-b156-415c-b4e0-40d8583ea54c` | `quai-branly-aruku-kurenga/material` |
| `7c77ba64-b866-49ce-b702-c9963609fb12` | `wikipedia-mamari/name-text-c` |
| `fe0cd6e8-b40a-48b5-9b64-de3634a88707` | `wikipedia-mamari/name-mamari` |

The editorial IDs `hoa-haka-nana-ia` and `la-tablilla-mamari` were already
readable and did not change. Their redundant front-matter IDs were removed. The
collection had no image records to migrate.

The three Supabase source records mapped above were later reconciled as one
source after confirming that all 12 claims came from the same supplied PDF,
*Arte en la cultura rapanui*. The consolidation did not merge claims or alter
their predicates or wording.

## Deliberately retained outside the collection

The `arte-escultura-ten-objects` bundle proposed 50 claims. Review accepted 10
of those claims into canonical records. The other 40 remain in the private
bundle and were not silently promoted during migration.

Evidence relationships, locators and excerpts remain in the private export.
The reduced public model preserves the source, predicate and value but does not
claim that a source author personally made every quoted or reported assertion.
