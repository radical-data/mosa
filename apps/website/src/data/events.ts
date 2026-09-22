import { formatEventInstant, formatHistoricalDate } from "../i18n/format";
import type { Locale } from "../i18n/routes";
import type { EventData } from "./event-schema";

// File loading stays separate from the date and display rules.
export interface EventEntry {
  id: string;
  data: EventData;
}

// Noon UTC is only a deterministic sort reference for dates without an hour.
// It is never displayed or used to decide when an event moves to the archive.
const startsAt = (event: EventData) =>
  "start" in event ? Date.parse(event.start) : Date.parse(`${event.date}T12:00:00Z`);

function calendarDay(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  return `${part("year")?.padStart(4, "0")}-${part("month")}-${part("day")}`;
}

function isUpcoming(event: EventData, now: Date): boolean {
  // With no known zone, date-only events use the documented UTC boundary.
  const zone = event.timeZone ?? "UTC";
  const day = "start" in event ? calendarDay(new Date(event.start), zone) : event.date;
  // Comparing local dates handles offset changes without assuming a 24-hour day.
  return calendarDay(now, zone) <= day;
}

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
function display({ id, data: event }: EventEntry, locale: Locale): DisplayEvent {
  return {
    slug: id,
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
  events: readonly EventEntry[],
  locale: Locale,
  now: Date = new Date(),
): { upcoming: DisplayEvent[]; past: DisplayEvent[] } {
  const upcoming: EventEntry[] = [];
  const past: EventEntry[] = [];
  for (const event of events) {
    (isUpcoming(event.data, now) ? upcoming : past).push(event);
  }
  const order = (a: EventEntry, b: EventEntry) =>
    startsAt(a.data) - startsAt(b.data) || a.id.localeCompare(b.id);
  return {
    upcoming: upcoming.sort(order).map((event) => display(event, locale)),
    past: past.sort((a, b) => order(b, a)).map((event) => display(event, locale)),
  };
}
