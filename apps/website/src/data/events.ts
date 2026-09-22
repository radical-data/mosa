import { z } from "astro/zod";
import { formatEventInstant, formatHistoricalDate } from "../i18n/format";
import { hasUnsupportedMarkup } from "../i18n/markup";
import type { Locale } from "../i18n/routes";

// One event is one file under content/events/. Its facts and both languages stay
// together, so announcing or withdrawing an event is a single file operation.
const passage = z
  .string()
  .trim()
  .min(1)
  .refine((text) => !hasUnsupportedMarkup(text), "unsupported inline markup");
const eventCopy = z
  .object({
    title: passage,
    body: passage,
    note: passage.optional(),
    imageAlt: passage.optional(),
  })
  .strict();
const shared = { venue: z.string().trim().min(1).optional(), es: eventCopy, en: eventCopy };
const image = z
  .string()
  .regex(/^\/images\/[\w-]+\.(?:webp|jpg|png)$/)
  .optional();
// A timed event needs the zone its time is read in; a date-only event has no time
// to place, so it must not carry one. Either way the source precision is kept.
const timedEvent = z
  .object({
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})$/),
    timeZone: z.string().min(1),
    image,
    ...shared,
  })
  .strict();
const dayEvent = z
  .object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), image, ...shared })
  .strict();
const eventFile = z.union([timedEvent, dayEvent]).superRefine((event, context) => {
  const optional = (copy: z.infer<typeof eventCopy>) =>
    (["note", "imageAlt"] as const).filter((key) => key in copy).join(",");
  if (optional(event.es) !== optional(event.en))
    context.addIssue({
      code: "custom",
      message: "Spanish and English must carry the same optional fields",
    });
  if (Boolean(event.image) !== "imageAlt" in event.es)
    context.addIssue({
      code: "custom",
      message: "An image needs imageAlt in both languages, and imageAlt needs an image",
    });
});
type EventFile = z.infer<typeof eventFile>;
export type StoredEvent = EventFile & { slug: string };

const files = import.meta.glob<unknown>("../content/events/*.json", {
  eager: true,
  import: "default",
});
export function parseEvents(entries: Record<string, unknown>): StoredEvent[] {
  return Object.entries(entries).map(([path, value]) => {
    const slug = path.slice(path.lastIndexOf("/") + 1).replace(/\.json$/, "");
    const result = eventFile.safeParse(value);
    if (!result.success) throw new Error(`events/${slug}.json is invalid\n${result.error.message}`);
    return { slug, ...result.data };
  });
}
// Invalid event files fail the build, not a page render.
const storedEvents = parseEvents(files);

// Date-only events keep their source precision; the noon-UTC reference matches
// formatHistoricalDate and prevents day drift when ordering.
const startsAt = (event: EventFile) =>
  "start" in event ? Date.parse(event.start) : Date.parse(`${event.date}T12:00:00Z`);
// An event stays upcoming until the end of its own calendar day. A static build
// moves it to the archive on the first rebuild after that.
const endsAt = (event: EventFile) =>
  Date.parse(`${"start" in event ? event.start.slice(0, 10) : event.date}T23:59:59.999Z`);

export interface DisplayEvent {
  slug: string;
  dateTime: string;
  dateLabel: string;
  venue?: string;
  image?: string;
  title: string;
  body: string;
  note?: string;
  imageAlt?: string;
}
function display(event: StoredEvent, locale: Locale): DisplayEvent {
  return {
    slug: event.slug,
    dateTime: "start" in event ? event.start : event.date,
    dateLabel:
      "start" in event
        ? formatEventInstant(event.start, event.timeZone, locale)
        : formatHistoricalDate(event.date, locale),
    venue: event.venue,
    image: event.image,
    ...event[locale],
  };
}
export function getEvents(
  locale: Locale,
  now: Date = new Date(),
  events: StoredEvent[] = storedEvents,
): { upcoming: DisplayEvent[]; past: DisplayEvent[] } {
  const moment = now.valueOf();
  const order = (a: StoredEvent, b: StoredEvent) =>
    startsAt(a) - startsAt(b) || a.slug.localeCompare(b.slug);
  return {
    upcoming: events
      .filter((event) => endsAt(event) >= moment)
      .sort(order)
      .map((event) => display(event, locale)),
    past: events
      .filter((event) => endsAt(event) < moment)
      .sort((a, b) => order(b, a))
      .map((event) => display(event, locale)),
  };
}
