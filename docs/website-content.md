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
Use Astro's Fontshare provider so clean builds obtain official font files
without redistributing their binaries through this repository. Request only the
weights used by the site. Do not add General Sans font files to Git or modify,
subset or convert them.

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

The [Visit map](adrs/028-map-objects-through-holders.md) presents holders as
MoSA's “satellite museums”. Each holder referenced by a resolved `held_by`
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
