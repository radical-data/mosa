# Website content

The website publishes Chilean Spanish and British English routes from local
files. Collection data and articles follow their own language metadata; an
article does not need an invented translation.

## Page copy

Page copy lives in `src/content/pages/`. Each JSON file contains paired `es`
and `en` passages used by one shared template. Keep the same keys in both
languages. Interface messages live under `src/i18n/`.

Events live in `src/content/events/`, one bilingual JSON file per event.
Removing an event file removes it from the generated listing.

After editing copy, run `just typecheck` and the relevant website tests. Review
both routes in the browser, including language switching, keyboard navigation,
narrow screens, enlarged text and mixed-language passages.

## Language and authority

Use Chilean Latin American Spanish and British English. Preserve original names
and Rapa Nui wording rather than translating them automatically. Mark passages
with their actual language, including `rap`.

Rapa Nui collaborators determine terminology, orthography, translation and
foregrounding. AI-assisted or team-authored drafts still need named human
review. Obtain permission before sending private material to an external
service.

The local General Sans fonts do not cover every Rapa Nui character. The
`public/fonts/noto-sans-eng.woff2` subset supplies current additional
characters under the
[SIL Open Font License](../public/fonts/noto-sans-OFL.txt).

## Collection and publication presentation

Collection navigation names come from object JSON. Source-attributed names,
classifications and descriptions remain claims. Every source has a navigation
title and kind. Image
metadata belongs to the source that represents the image; independently
identifiable photographs have their own source records, linked to publishing
pages with `reproduces` and to depicted objects with `depicts`.

The collection contains objects and sources. Its subnavigation uses the label
“Documents and images” / “Documentos e imágenes” for sources. The site publishes
object and source indexes and detail pages.
Sources are listed at `/en/sources/` and `/es/fuentes/`; articles are listed
at `/en/articles/` and `/es/articulos/`, labelled “Articles” / “Artículos”.
Articles are authored MoSA publications rather than collection records. Their
source files live under `articles/`, and they appear through Resources and links
from the objects and sources they examine. Articles sit under Resources, outside the primary
navigation. Their index links back to Resources, and individual articles show
the Resources → Articles path. Source indexes
provide text search and kind/topic filters, with the full list available without
JavaScript. Language switching retains the corresponding record or article and
supported index filters.

Source pages show bibliographic metadata, publishable representations, related
objects and source relationships, attributed object claims with locators, and
relevant articles. Object pages retain their established URLs and foregrounded
accounts, images, origin and holding sections. Before the source accounts,
“Articles about this object” / “Artículos sobre este objeto” introduces related
writing with its title, author when known, publication language and optional
summary. The full prose appears on the standalone article page. Source pages
and the article index use the same previews. Object pages link to source pages
and derive image galleries from explicit `depicts` relationships. Article
pages retain their declared prose language and can concern multiple objects and
sources or have no record subjects. Methodological notes and preservation captures are excluded from public rendering and search.

Object pages follow the hierarchy in [ADR 025](adrs/025-retain-competencies-in-the-git-collection.md).
Keep all source accounts, qualifiers and optional locators visible. Holding and
location labels describe source reports, which may be historical.

Use explicit `Intl` locales and metric units. Preserve the precision and
uncertainty of historical dates. Do not infer ownership, consent or cultural
authority from current holding or location.

## Contact

Show `mosa@radicaldata.org` as selectable text and a native email link usable
without JavaScript. Invite general descriptions before sensitive attachments.
