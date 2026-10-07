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

General Sans is a closed-source Fontshare font under the ITF Free Font License.
Use the site's Astro font provider to obtain Fontshare's official variable WOFF2
during the build without redistributing the binary through this repository.
Astro fingerprints and self-hosts the untouched file in the built website. Do
not add General Sans font files to Git or modify, subset or convert them.

General Sans does not cover every Rapa Nui character. Astro's local Fonts API
loads `src/assets/fonts/noto-sans-eng.woff2` only for its current additional
characters under the [SIL Open Font License](../public/fonts/noto-sans-OFL.txt).

## Website media

Put site-owned interface and editorial images in `src/assets/site-images/`,
register their stable IDs in `src/data/site-image-ids.ts` and resolve them
through `src/assets/site-images.ts`. Render them with Astro's `Image` or
`Picture` component so the build supplies intrinsic dimensions, responsive
formats and fingerprinted URLs. Event files refer to the stable image ID, not a
public path.

This directory is for website presentation assets only. Publishable collection
representations remain in `collection/images/` with their source metadata and
relationships; follow the collection image workflow for those files.

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
the Resources → Articles path. Language switching retains the corresponding record or article and supported
collection filters.

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

The collection uses one shared catalogue with Everything, Objects, and Documents
and images scopes. The source index routes open its Documents and images scope.
Objects and sources remain separate records with their own detail pages.
Kind labels and
links to related objects distinguish documentary records from physical objects.

Masonry grid and list layouts share search, sorting, filters and result order.
The grid uses four columns above 800px and two below, matching the established
collection layout. Images fill their column width at their natural aspect ratio.
Masonry follows the sorted reading order and reflows when images load or results
change; list rows retain small contained thumbnails. Cards
show source-attributed classifications, reported holding and catalogue numbers
for objects, or authorship, dates and related objects for sources. Values link
to their sources; cards show at most two values per field and link to the full
record when there are more. Images are uncropped. Unillustrated grid cards use
compact text rather than a large placeholder; list rows keep small thumbnails.
Image captions, credits and rights remain on detail pages and in text search.

Search covers public claims, source metadata, related record titles and image
metadata, excluding notes and preservation captures. With no query the order
control displays Name A–Z. Starting a search selects Relevance unless the visitor
has explicitly chosen alphabetical order. Title and direct matches rank ahead of
related-record matches; ties use alphabetical order. Relevance is unavailable
without a query. Source counts describe documentation
coverage, not importance, and do not affect ordering.

All three scopes share the same always-visible filters and retain selections when
switching. “Held by” (“En manos de”) and “Located in” (“Se encuentra en”) match an object or a
document's directly associated objects. Institution plus country must match the
same holder of the same object. The country selection narrows the institution
menu; with no country selected, all institutions remain available, including
holders without a country. Institution options include their localised country
when recorded. Choosing a country clears an incompatible institution selection
and displays an accessible notice; clearing the country retains the institution.
The same reconciliation applies when restoring shared URLs or browser history.
Document kind matches a source or an object's
directly associated sources. This is browsing context, not an assertion that a
document is held by an institution or that its publisher is located there.
Classification and topic filters are omitted; inconsistent classification terms
need a reviewed vocabulary before they can support useful filtering. Their
source wording remains searchable, and classifications remain on cards. Retired
classification and topic URL parameters are ignored rather than silently filtering.
“Located in” uses the institution's country, not the object's origin; source accounts
of holding may be historical.
The interface does not infer catalogue kinds from titles or countries from
free-text locations. Country names are localised from holder `countryCode`;
unknown countries stay unset. Card labels use Institution and Classification;
links to sources provide the attribution context.
An optional image filter tests the record's own publishable image in every scope.

The counts describe one filtered result set: Everything always equals Objects
plus Documents and images. The same rule applies when individual photograph
records are included or grouped. An empty scope links to matches in the other
scope; an empty search with grouped photo matches offers to include those records.

JavaScript enhances the static listings in batches of 24. In masonry view, more
results load as the shortest column's next insertion point approaches the
viewport, so tall photographs do not leave an empty stretch before the next
batch. Automatic loading preserves focus and updates the loaded count in the
URL. The manual Show more button remains a fallback; list view loads manually.
The scroll-loading hint appears only in grid view while more results remain.
Search, scope, view, order, filters and loaded count survive language changes,
shared URLs and Back navigation. Switching layout preserves the loaded count.
Legacy `view=table` URLs select the list view.

`src/content/collection-presentation.json` contains website presentation choices,
not collection assertions. Its optional `galleryOnlySourceIds` list identifies
reviewed routine object photographs grouped with their objects in both Everything
and Documents and images, including when searching. The shared “Include separate
photograph records” option includes them individually in both scopes. This option
never hides photographs on object cards or in galleries. Counts appear in the
scope navigation; result updates are also announced to screen readers without
adding a duplicate visible summary. Without JavaScript, listings use the grouped
default and object galleries still provide the photographs. Historical and
research photographs remain visible unless explicitly reviewed for grouping;
missing dates or a `depicts` link do not imply that a photograph is contemporary.
New photographs appear independently by default until reviewed. The build rejects
listed IDs that are not photographs available in an object gallery.

The optional `leadImages` map selects a lead image by
object handle, with a `sourceId` and `file` from that object's depicting gallery.
The build rejects unknown handles and lead images that are not in the object's
gallery. Without an override, photographs precede other
image sources, then source ID and file determine the order. Cards and galleries
use the same lead image. Do not create object-specific template branches.

Object pages follow the hierarchy in [ADR 025](adrs/025-retain-competencies-in-the-git-collection.md).
The shared template orders foregrounded perspectives, images, origin, reported
holding, articles and complete source accounts. Empty sections are omitted.
Foregrounding is explicitly MoSA's editorial selection, not a truth ranking.
Claims selected for foregrounding are not repeated in the origin or holding
summary, but remain in their complete source account. Image frames contain the
whole image and link to a larger version.

Source accounts use native expandable details, available without JavaScript.
Keep every claim's wording, attribution, language, qualifiers and optional
locators in the account. Sources without claims still link to their source page.
Holding and location labels describe source reports, which may be historical.

The [Visit map](adrs/028-map-objects-through-holders.md) presents holders as
MoSA's “branches” / “sedes”. Each holder referenced by a resolved `held_by`
claim gets one named list entry; those with coordinates get individual points.
Points use one colour, carry no object counts and remain separate even when
they overlap. There is no clustering or search. MapLibre places museum names on
the map without overlapping labels; more names appear as visitors zoom in.
Coincident locality-level points receive a small, consistent screen offset so
each is clickable. Their labels and popups follow the same offset; the recorded
coordinates and locality precision remain unchanged. Site-level points stay at
their verified coordinates.
Selecting a point or label opens visitor information and expandable object
evidence in a map popup. Popups mirror the list's name, place, short object count
and visitor-information button, without technical location-precision labels.
The camera stays within a single world. At overview scales smaller than the
viewport, that world stays centred, including on narrow screens.
Accessible marker buttons are positioned with `map.project()` at their recorded
longitudes, so they cannot wrap independently of the single-world basemap.
Clicking the map background, the
selected point, the close button or pressing Escape clears the selection. An
in-map fit-to-bounds control restores the view of all mapped museums and clears
selection. The alphabetical holder list below the map always shows each name
and place, with a visitor-information button when a verified link is available.
Clicking a mapped name or its place opens that museum in the map. Only the
supporting object evidence is expandable, using a short object count alongside
the row's other actions. Unmapped holders and overlapping
points remain accessible in the list.

Holder navigation names use the institution's concise public name with normal
capitalisation for its language. Omit street addresses and unnecessary parent
organisation suffixes; retain a city when it forms part of the established name
(for example, Linden-Museum Stuttgart). Keep previous names as holder aliases
and preserve the original wording of attributed holding claims.

Public access is not an inclusion requirement: private collections and closed
institutions remain eligible. Use verified optional holder `visitUrl` links for
visitor information. Keep coordinate references in the holder records rather
than displaying them as visitor links. Preserve location precision in the data and keep object
evidence in an expandable supporting section, including historical or uncertain
status.
Object location exceptions do not move a holder's pin. The page does not turn
historical holding claims into assurances of present custody or public display.
Use a single page introduction leading directly into the map. Keep the full
holder list and evidence usable without JavaScript or WebGL.

Use explicit `Intl` locales and metric units. Preserve the precision and
uncertainty of historical dates. Do not infer ownership, consent or cultural
authority from current holding or location.

## Contact

Show `mosa@radicaldata.org` as selectable text and a native email link usable
without JavaScript. Invite general descriptions before sensitive attachments.
Present Instagram as a public way to follow project updates, not as a channel
for sensitive information. Keep Instagram and the GitHub source repository in
the global footer. Explain the open-source website and its MIT licence on the
About page. Use descriptive text labels rather than icon-only links, and let
external links follow normal browser behaviour instead of forcing a new tab.

The footer is organised into three bands:

1. **Voice.** The project statement.
2. **Actions.** Museum navigation, external links and the newsletter form.
3. **Colophon.** Branding, licensing and funding.

The bands stack their contents on narrow screens. The newsletter form uses a
coral button and submits directly to Mailchimp.

## Licensing

The website footer identifies original MoSA writing as CC BY-SA 4.0 and the
MoSA collection database as ODC-By 1.0. It also warns that individual records,
images and Indigenous knowledge can carry different rights or notices. The
About page identifies the website source code as MIT-licensed and links to its
GitHub repository.

Keep the detailed repository scope in `LICENSING.md`. Do not let a site-wide
notice override item-specific image rights, third-party source wording, Local
Contexts labels or notices, other community protocols, or pre-existing
intellectual property.

## Mailing list

The footer and Contact page publish a bilingual email-only signup form for the
existing MoSA Mailchimp audience. The form submits directly to Mailchimp and
works without JavaScript; the website does not proxy or retain subscriptions.
Link Instagram and other external profiles directly to the website form at
`/es/contacto/#newsletter` or `/en/contact/#newsletter` as appropriate.

Mailchimp owns the confirmation, unsubscribe and subscriber-management journey.
Keep double opt-in and abuse protection enabled, and review those screens and
emails whenever the audience configuration or website copy changes. The route
language localises the website form only; do not imply that it records a
subscriber's preferred newsletter language unless Mailchimp is configured to
capture and use that preference.
