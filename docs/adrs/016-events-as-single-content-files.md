# 016: Represent each event as a single content file

## Status

Accepted

## Context

The website presented one upcoming event and one past event. Neither existed as a whole object anywhere.

The upcoming event's copy lived in `content/pages/programme.json`; its date, time zone and institution lived in a `programme` constant in `data/site.ts`; its registration in the page map lived in `content/content.ts`; and `components/Event.astro` rendered that one event rather than an event. The past event used a different representation again: its title and description were `passage07` and `passage08` inside `events.json`, its date was an `archiveEvent` constant, and its image was written directly into the template.

Three consequences followed.

Editing one event meant editing several files that did not reference each other. Withdrawing it was not a deletion but a refactor across six files, with a build failure at every intermediate step.

The same kind of thing had two incompatible shapes depending on tense. Moving an event from the programme to the archive meant rewriting it by hand into the other shape.

`timeZone` was stored on both constants and read by nothing. `formatHistoricalDate` ignores it, and `formatEventInstant`, which would use it, was called only from tests. A timed event displayed no time. The stored zone implied a precision the site did not present.

An empty programme was also unrepresentable. The template always rendered one event, so "no upcoming events" could only be expressed by deleting the component.

## Decision

One event is one file under `apps/website/src/content/events/`, holding its facts and both languages together.

Therefore:

- store event facts and event copy in the same file, not in a constant and a copy file that must be kept in step;
- derive the slug from the filename and keep every other fact inside the file;
- accept either a calendar day (`date`) or a timed instant with its zone (`start` plus `timeZone`), and reject a zone without a time;
- require both languages, with matching optional fields, and validate copy markup against the same trusted set as page copy;
- require an image and its description to travel together, in both languages;
- reject unknown fields, so a stray key cannot be silently ignored;
- derive the upcoming/past split and the ordering from the dates, rather than storing an event's tense;
- treat an empty programme as a supported state with its own message;
- keep `Event.astro` and the archive card as two presentations of one shape, not two data models.

Validation runs when the site builds. An invalid event file fails the build.

Events are deliberately not moved to Astro's content collections. The repository already validates bilingual content with its own schema, exercised by vitest and run during the build. A second validation mechanism for events would reproduce the split this decision removes, would place event copy outside the tests that cover page copy, and would make the data asynchronous for no gain. The glob-and-schema approach gives the same "add a file, no registration" property.

## Consequences

### Benefits

- Publishing or withdrawing an event is a single file operation.
- An event moves from the programme to the archive on its own, with no rewriting.
- A time zone is only stored when a time is displayed, so the stored precision matches the presented precision.
- The programme can legitimately be empty.
- More than one upcoming or past event is now expressible.
- Page copy and event copy are held to one markup standard, in one shared check.

### Costs

- Event copy no longer passes through `validate-localisation`, which validates pages. The event schema enforces the same properties directly and is stricter, but the two checks must be kept in agreement.
- Event files carry copy and facts together, so a translation edit and a scheduling edit touch the same file.
- The upcoming/past split is evaluated at build time. A static site moves an event to the archive on the first build after its day ends, not at the moment the day turns.

These costs are accepted because the previous arrangement made a routine editorial action — withdrawing an event — into a code change.

## Alternatives considered

| Alternative | Reason rejected |
| --- | --- |
| Keep the split and document it | The split was already documented by its filenames and was still repeatedly mis-stepped; documentation does not make six files one object. |
| Keep facts in `site.ts` and copy in `pages/` | Preserves exactly the coupling that makes deletion a refactor. |
| Astro content collections | Splits validation across two mechanisms, removes event copy from the existing tests, and makes the data asynchronous without adding a property the glob lacks. |
| One `events.json` holding an array | Editing or withdrawing one event rewrites a file shared by all of them, and conflicts on every concurrent edit. |
| Store `upcoming`/`past` as a field on the event | Makes tense editorial state that must be remembered and updated, when it is derivable from the date. |
| Keep the archive card's copy in `events.json` passages | Keeps two shapes for one kind of thing and renumbers unrelated passages whenever an event is added. |

## Principle

> An event is one object. Its facts, its languages and its presentation are one file, one schema and one set of templates. Tense is derived from the date, not stored. Stored precision matches presented precision.
