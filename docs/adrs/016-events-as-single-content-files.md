# 016: Represent each event as a single content file

## Status

Accepted

## Context

Event facts, translations and images were spread across page copy, constants and
templates. Adding, withdrawing or archiving an event required coordinated edits,
and an empty programme was unsupported. Local bilingual entries and build-time
validation meet current needs without remote content or content relationships.

## Decision

Keep one bilingual JSON file per event under `apps/website/src/content/events/`, loaded synchronously through `import.meta.glob` in `src/data/load-events.ts`.

The filename supplies the ID. One exported Zod schema validates facts, paired
translations, image/alternative-text pairing and allowed markup, rejecting unknown
fields and invalid entries at build time. Types and tests use that same schema.
Pure functions derive language, ordering and programme/archive presentation.

### Calendar dates and time zones

An event carries exactly one of:

- `date`: a real calendar date with an optional IANA `timeZone`;
- `start`: a valid ISO instant with an explicit offset and a required IANA `timeZone`.

A date-only event keeps its date-only display even when its zone is known. Knowing the local calendar day does not imply knowing the hour. Date-only events without a known zone use UTC for archive classification; this is a fallback policy, not a claim about their location.

An event stays in the programme through its local calendar day. For timed events, that day is derived from the instant in the declared zone, independent of the offset used to write the instant. Comparing local calendar dates handles daylight-saving changes without assuming that every day lasts 24 hours.

Upcoming events are ordered soonest first and past events most recent first. A date without an hour uses noon UTC only as a deterministic ordering reference; this value is neither displayed nor used for archive classification.

## Consequences

One file is the editing/withdrawal boundary, although translation and scheduling
edits can conflict in it. The site stays static; archive changes require a rebuild
and no automatic schedule is introduced. Tests validate current files without
fixing titles, counts or IDs. Page dictionaries retain their separate loader.

## Alternatives considered

| Alternative | Assessment |
| --- | --- |
| Keep event facts and copy in separate files | Retains the coordination that makes routine editorial changes require code changes. |
| Astro content collections | Compatible with shared schema/tests and build-time async access; would replace little code while leaving calendar and bilingual rules necessary. |
| One JSON array of all events | Workable, but separate files give each event an independent editing and withdrawal boundary. |
| Store `upcoming` or `past` manually | Requires an editor to update state that can be derived from the event's local date. |
| Migrate all page copy to collections | Unnecessary for this change; page dictionaries and repeatable event entries have different uses. |

Reconsider content collections for relationships, richer rendering or shared content
infrastructure. More event files alone do not justify another content lifecycle.
