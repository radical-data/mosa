# Website content

## Language and routes

Use Chilean Spanish (`es-CL`) and British English (`en-GB`), with Spanish as the
default entry. The URL chooses the language; do not infer it from a visitor's
location, browser or name. Language links use their own names and work without
JavaScript. Both languages share templates.

| Page ID | Spanish | English |
| --- | --- | --- |
| `home` | `/es/` | `/en/` |
| `about` | `/es/sobre-mosa/` | `/en/about/` |
| `collection` | `/es/coleccion/` | `/en/collection/` |
| `visit` | `/es/visita/` | `/en/visit/` |
| `events` | `/es/eventos/` | `/en/events/` |
| `resources` | `/es/recursos/` | `/en/resources/` |
| `contact` | `/es/contacto/` | `/en/contact/` |

`apps/website/src/i18n/routes.ts` owns paths, page IDs, locale tags, formatting
locales, search annotations and fragments. Update that registry rather than
scattering route translations through templates. Website middleware redirects `/`
and legacy paths to Spanish with permanent 301 responses and preserves queries.
Unknown paths return a real 404. Check the built Node image with the HTTP tests.

Each translated page has its own canonical URL and reciprocal language links.
The current search annotations use `es`, `en` and Spanish `x-default`. Keep
redirects, drafts and withdrawn pages out of the sitemap. Optional single-language
articles are future work: do not advertise nonexistent equivalents or silently
serve Spanish beneath an English URL.

## Edit page copy

1. Edit the relevant JSON under `apps/website/src/content/pages/`. Each page/shared
   file contains both `es` and `en`; `interface.json` contains navigation and controls.
2. Preview with `just website-dev` at port 4322. Compare equivalent Spanish and
   English routes, navigation, wrapping and accessibility text.
3. Add new message keys in both languages. Existing wording may change independently;
   record delayed translation work in the checklist below.
4. Run `mise exec -- pnpm --filter @mosa/website test` and `just website-build`.
   The build checks types, missing/empty messages, allowed markup, links, fragments,
   language metadata and sitemap. It does not certify editorial approval or freshness.

Editorial review happens at release milestones; builds enforce no approval or
translation-freshness gates ([ADR 018](adrs/018-bilingual-file-based-website-content.md)).
Use only the inline markup allowed by `apps/website/src/i18n/markup.ts`.

## Events

Each file in `apps/website/src/content/events/` holds one event's facts and both
languages. Name it `YYYY-MM-DD-short-slug.json`; the filename supplies its ID,
while the date field determines scheduling.

### The shape of an event file

```json
{
  "date": "2026-07-25",
  "timeZone": "Pacific/Easter",
  "venue": "Rapa Nui",
  "image": "/images/community-gathering.webp",
  "es": {
    "title": "MoSA Rapa Nui: Conversando con las nuevas generaciones",
    "body": "Encuentro con un colectivo en proceso de formación…",
    "imageAlt": "Participantes de un encuentro de MoSA sentados en círculo en Rapa Nui."
  },
  "en": {
    "title": "MoSA Rapa Nui: In conversation with new generations",
    "body": "A gathering with a collective in the process of forming…",
    "imageAlt": "Participants at a MoSA gathering sitting in a circle in Rapa Nui."
  }
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `date` | one of `date`/`start` | A real calendar day, `YYYY-MM-DD`, when the hour is unknown or not published. |
| `start` | one of `date`/`start` | A timed event, as an ISO instant carrying an offset: `2026-09-19T13:00:00Z`. |
| `timeZone` | with `start`; optional with `date` | The IANA zone that defines the event’s local day, such as `Pacific/Easter` or `Europe/London`. Date-only events without one use UTC for archiving. |
| `venue` | no | Shown in the programme list. |
| `image` | no | A path under `/images/`. Needs `imageAlt` in both languages. |
| `es`, `en` | yes | `title` and `body` are required; `note` and `imageAlt` are optional. |

Both languages must have matching optional fields; images require alternative text
in both languages. Invalid dates, instants, time zones, markup or unknown fields
fail the build through `apps/website/src/data/event-schema.ts`.

### Scheduling

Date-only events display no invented hour. Timed events display in their own IANA
zone, independently of the interface language. An event remains upcoming through
its local calendar day; date-only events without a zone use UTC. Static pages
move it to the archive on the first subsequent build.

Upcoming events sort soonest first, with the first expanded; past events sort
most recent first. Date-only events use noon UTC for ordering only. With no
upcoming events, the page shows `eventsPending` from `interface.json`.

### Add or withdraw an event

Create or delete its file, then preview `/es/eventos/` and `/en/events/` with
`just website-dev`. Remove any withdrawn event's mentions elsewhere in page copy.
Run the website tests/build; tests validate current files without fixing their
count or titles. Record pending translation work below.

The glob loader and calendar design are explained in
[ADR 016](adrs/016-events-as-single-content-files.md).

## Pending translation and review work

Add pending wording changes with their file and passage; tick completed reviews.

- [ ] Review Spanish and English homepage copy (`home.json`).
- [ ] Review the project description and team copy (`about.json`).
- [ ] Review collection explanations (`collection.json`).
- [ ] Review the visit overview (`visit.json`).
- [ ] Review events page copy (`events.json`) and each event file in `src/content/events/`.
- [ ] Review resources and their summaries (`resources.json`, `resource-summaries.json`).
- [ ] Review the contact invitation and correspondence guidance (`contact.json`).
- [ ] Review navigation, controls and dynamic messages (`interface.json`, `src/i18n/messages.ts`).
- [ ] Review reference display labels and place names (`reference-labels.json`).
- [ ] Check retained Rapa Nui terms and orthography with collaborators, including `Ta'oa`, `Ivi tupuna`, `mana` and `Moai kavakava`.

## At a release milestone

Review changed passages in both languages, especially names, uncertainty,
attribution, removal, custody, restitution and ancestors. Check navigation,
language switching and filters, then run the website tests/build. Record any
editorial work deliberately deferred from the release.

Withdraw copy from both languages and every repeated passage. Use the
[Website workflow](collection-publication.md#deploy-website-code) to release copy;
collection removal uses [database withdrawal](collection-publication.md#withdraw-an-object).

## Names, dates and accessibility

Original names retain their spelling across interface languages. Current collection
search matches approved names, institutions and identifiers. Accent folding applies
to the institution search representation, not original names. Review Rapa Nui
matching rules with collaborators before adding broader normalisation. Concept/type
filters need an authorised data basis; do not create ontology just to fill a control.

Use explicit `Intl` locales and metric units. Language does not change an event
instant or its time zone. Preserve year/month/day precision in historical dates.
Set page language to `es-CL`/`en-GB` and different-language passages to their actual
language, including `rap`. Test keyboard access, narrow screens, enlarged text and
mixed-language passages. A language tag does not guarantee a suitable speech voice.

Local General Sans fonts lack U+014A/U+014B (`Ŋ`, `ŋ`). The local
`public/fonts/noto-sans-eng.woff2` subset supplies those characters under the
[SIL Open Font License](../apps/website/public/fonts/noto-sans-OFL.txt). Coverage of
current copy does not establish coverage of future collaborator-approved orthography.

Rapa Nui collaborators determine terminology, orthography and translation authority.
Existing design terms and AI-assisted English drafts still need review. Evaluate
Rapa Nui translation tools with fluent collaborators; obtain permission before
external processing of private material. There is no full Rapa Nui or Dutch
interface. Preserve the funding acknowledgement/logo in both languages; grant
commitments are tracked in [the roadmap](roadmap.md#human-decisions).

## Contact and release

Show `mosa@radicaldata.org` as selectable text and a native email link, usable
without JavaScript. Invite general descriptions before sensitive attachments;
require neither legal identity nor institutional representation. Mailbox handling
and response commitments belong to [operations](operations.md#mailbox-operations).

Resource files, external reading links, event registration and the institution map
remain pending.
