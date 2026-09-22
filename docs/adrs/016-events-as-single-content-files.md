# 016: Represent each event as a single content file

## Status

Accepted

## Context

The website presented one upcoming event and one past event. Their facts, translations and images were spread across page-copy files, constants and templates. Adding or withdrawing an event required coordinated code changes, and moving an event into the archive meant rewriting it into a different representation. An empty programme was not supported.

The current requirements are local bilingual JSON files, validation during the build, programme and archive lists, and an empty state. They do not require content relationships, Markdown rendering or remote content sources.

## Decision

Keep one bilingual JSON file per event under `apps/website/src/content/events/`, loaded synchronously through `import.meta.glob` in `src/data/load-events.ts`.

Each event carries its scheduling facts and Spanish and English copy together. The loader derives its ID from the filename and validates it with the exported Zod schema in `src/data/event-schema.ts`. Invalid files fail the build with the filename and validation errors. Types are inferred from the schema.

The schema requires both languages with matching optional fields, keeps images and their descriptions together, rejects unknown fields, and shares the inline-markup check used by page copy. Tests import this same schema directly.

Templates import the validated events at build time and pass them to ordinary functions in `src/data/events.ts`. These functions select the language, sort entries and derive the programme/archive split. They are independent of file discovery and are tested with fixtures.

### Why retain the glob-based loader

The loader is small and meets the current requirements. Astro content collections are a viable alternative: they can use the same schema, preserve direct unit tests and provide a standard content API. Their asynchronous access happens during the build and does not require browser fetching or server rendering.

For this feature, collections would replace little application code. The schema, bilingual rules, calendar logic and presentation functions would still be needed. Keeping the glob-based loader avoids introducing another content lifecycle without a concrete requirement for its additional facilities.

This decision is based on the current scope, not on collections being incompatible with shared validation or tests. Reconsider it if the site needs collection relationships, richer content rendering or a shared collection infrastructure. More event files alone do not require a migration.

### Calendar dates and time zones

An event carries exactly one of:

- `date`: a real calendar date with an optional IANA `timeZone`;
- `start`: a valid ISO instant with an explicit offset and a required IANA `timeZone`.

A date-only event keeps its date-only display even when its zone is known. Knowing the local calendar day does not imply knowing the hour. Date-only events without a known zone use UTC for archive classification; this is a fallback policy, not a claim about their location.

An event stays in the programme through its local calendar day. For timed events, that day is derived from the instant in the declared zone, independent of the offset used to write the instant. Comparing local calendar dates handles daylight-saving changes without assuming that every day lasts 24 hours.

Upcoming events are ordered soonest first and past events most recent first. A date without an hour uses noon UTC only as a deterministic ordering reference; this value is neither displayed nor used for archive classification.

## Consequences

- Adding or withdrawing an event changes one content file. Tests validate the current files without fixing their number, titles or IDs.
- One event model supports the programme accordion and archive card, including empty lists.
- The application maintains a small file-loading module alongside the schema and presentation rules. Vite handles glob discovery; there is no persistent event content store to manage.
- The schema remains directly testable with ordinary unit tests, including bilingual rules and impossible dates.
- Events are loaded synchronously during the build. The public website remains static and requires no client-side content fetching.
- The programme/archive split changes only on a rebuild. This change does not introduce automatic rebuild scheduling.
- A translation edit and a scheduling edit can touch the same file. This is acceptable because each file represents one event.
- Existing page-copy dictionaries retain their own loading path while sharing markup validation with events.

## Alternatives considered

| Alternative | Assessment |
| --- | --- |
| Keep event facts and copy in separate files | Retains the coordination that makes routine editorial changes require code changes. |
| Astro content collections | Compatible with shared validation and tests, with useful standard APIs. The current requirements are already met by the small glob-based loader, so the additional integration offers insufficient immediate benefit. |
| One JSON array of all events | Workable, but separate files give each event an independent editing and withdrawal boundary. |
| Store `upcoming` or `past` manually | Requires an editor to update state that can be derived from the event's local date. |
| Migrate all page copy to collections | Unnecessary for this change; page dictionaries and repeatable event entries have different uses. |
