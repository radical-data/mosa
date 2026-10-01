# Website content

The website publishes Chilean Spanish and British English routes from local
files. Collection data and editorials follow their own language metadata; an
editorial does not need an invented translation.

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

## Collection presentation

Collection navigation names come from object JSON. Source-attributed names,
classifications and descriptions remain claims. Editorial prose belongs in
`collection/editorials/`; image metadata belongs to the source that documents
the image.

The current site publishes object pages and object-linked editorials. The
accepted source index, source detail pages and editorials index in
[ADR 027](adrs/027-distinguish-displaced-objects-and-documentary-sources.md)
are pending implementation. Until then, keep current routes and presentation
behaviour accurate. Once implemented, follow ADR 027 for paired English and
Chilean Spanish routes, source relationships, language switching and the
“Documents and images” / “Documentos e imágenes” collection label.

Object pages follow the hierarchy in [ADR 025](adrs/025-retain-competencies-in-the-git-collection.md).
Keep all source accounts, qualifiers and optional locators visible. Holding and
location labels describe source reports, which may be historical.

Use explicit `Intl` locales and metric units. Preserve the precision and
uncertainty of historical dates. Do not infer ownership, consent or cultural
authority from current holding or location.

## Contact

Show `mosa@radicaldata.org` as selectable text and a native email link usable
without JavaScript. Invite general descriptions before sensitive attachments.
