# Editing events

One event is one file in `apps/website/src/content/events/`. That file holds the event's facts and both languages together. Adding, changing or withdrawing an event is a single file operation; no template, index or constant has to be edited alongside it.

Name the file `YYYY-MM-DD-short-slug.json`. The filename supplies the event's slug and nothing else; the date inside the file is what the site reads.

## The shape of an event file

```json
{
  "date": "2026-07-25",
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
| `date` | one of `date`/`start` | A calendar day, `YYYY-MM-DD`, when the hour is unknown or not published. |
| `start` | one of `date`/`start` | A timed event, as an ISO instant carrying an offset: `2026-09-19T13:00:00Z`. |
| `timeZone` | with `start` only | The IANA zone the time is read in, such as `Europe/London`. |
| `venue` | no | Shown in the programme list. |
| `image` | no | A path under `/images/`. Needs `imageAlt` in both languages. |
| `es`, `en` | yes | `title` and `body` are required; `note` and `imageAlt` are optional. |

Both languages must carry the same optional fields. An event with a Spanish `note` and no English one is rejected, so a visitor never sees half an event in their language.

## Dates keep their source precision

A date-only event is displayed as a calendar date. A timed event is displayed with its hour, rendered in its own `timeZone` and in the reader's language. A time zone without a time is rejected: an unknown hour is not invented, and a zone that nothing reads is dead data.

## Upcoming and past

The site splits events itself. An event stays in the programme until the end of its own calendar day, then appears under past events, ordered most recent first. Upcoming events are ordered soonest first, and the first one is shown expanded.

The site is built statically, so an event moves to the archive on the first build after its day ends, not at the moment the day turns.

When no upcoming event exists, the programme section shows `eventsPending` from `interface.json` instead. An empty programme is a supported state, not a broken page.

## Adding an event

1. Create the file in `apps/website/src/content/events/`.
2. Preview with `mise exec -- just website-dev` and check `/es/eventos/` and `/en/events/`.
3. Add any pending translation work to the [translation checklist](localisation-editorial-workflow.md).

## Withdrawing an event

Delete the file. Nothing else references it. If the event was described elsewhere in the site's copy, remove that passage too — see the withdrawal guidance in the [translation checklist](localisation-editorial-workflow.md).

## What the build checks

`apps/website/src/data/events.ts` validates every event file when the site builds, and an invalid file fails the build rather than rendering a broken page. It checks the date rules above, that both languages are present with matching optional fields, that an image and its description travel together, and that copy uses only the same trusted inline markup allowed in page copy (`apps/website/src/i18n/markup.ts`). Unknown fields are rejected, so a stray key is never silently ignored.

`apps/website/src/data/events.test.ts` covers those rules and the upcoming/past split.

See [ADR 016](adrs/016-events-as-single-content-files.md) for the reasoning.
