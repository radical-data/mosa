import { describe, expect, it } from "vitest";
import { eventSchema } from "./event-schema";
import { getEvents } from "./events";

const copy = {
  es: { title: "Encuentro", body: "Una conversación." },
  en: { title: "Gathering", body: "A conversation." },
};
const parse = (files: Record<string, unknown>) =>
  Object.entries(files).map(([path, value]) => ({
    id: path.slice(path.lastIndexOf("/") + 1).replace(/\.json$/, ""),
    data: eventSchema.parse(value),
  }));
const one = (slug: string, event: Record<string, unknown>) => ({
  [`../content/events/${slug}.json`]: { ...copy, ...event },
});

describe("event files", () => {
  it("validates every current event without fixing the catalogue's contents", () => {
    const files = import.meta.glob("../content/events/*.json", { eager: true, import: "default" });
    for (const [path, value] of Object.entries(files)) {
      expect(eventSchema.safeParse(value).success, path).toBe(true);
    }
  });
  it("supports an empty event list", () => {
    expect(getEvents([], "en", new Date("2026-01-01T00:00:00Z"))).toEqual({
      upcoming: [],
      past: [],
    });
  });
  it("keeps a date-only event's precision and a timed event's hour", () => {
    const events = parse({
      ...one("day", { date: "2026-07-25" }),
      ...one("timed", { start: "2026-09-19T13:00:00Z", timeZone: "Europe/London" }),
    });
    const { upcoming } = getEvents(events, "en", new Date("2026-01-01T00:00:00Z"));
    expect(upcoming[0]?.dateLabel).toBe("25 July 2026");
    expect(upcoming[1]?.dateLabel).toContain("14:00");
  });
  it("orders upcoming events soonest first and past events most recent first", () => {
    const events = parse({
      ...one("b", { date: "2026-03-01" }),
      ...one("a", { date: "2026-02-01" }),
      ...one("c", { date: "2025-05-01" }),
      ...one("d", { date: "2025-06-01" }),
    });
    const { upcoming, past } = getEvents(events, "es", new Date("2026-01-15T00:00:00Z"));
    expect(upcoming.map((event) => event.slug)).toEqual(["a", "b"]);
    expect(past.map((event) => event.slug)).toEqual(["d", "c"]);
  });
  it("keeps an event upcoming until the end of its own day", () => {
    const events = parse(one("today", { date: "2026-07-25" }));
    expect(getEvents(events, "en", new Date("2026-07-25T22:00:00Z")).upcoming).toHaveLength(1);
    expect(getEvents(events, "en", new Date("2026-07-26T00:00:00Z")).past).toHaveLength(1);
  });
  it("resolves copy for the requested language only", () => {
    const events = parse(one("x", { date: "2026-07-25", venue: "Rapa Nui" }));
    const [event] = getEvents(events, "es", new Date("2026-01-01T00:00:00Z")).upcoming;
    expect(event).toMatchObject({ title: "Encuentro", venue: "Rapa Nui" });
    expect(event).not.toHaveProperty("en");
  });
  it("requires a time zone and explicit offset for timed events", () => {
    expect(() => parse(one("x", { start: "2026-09-19T13:00:00Z" }))).toThrow();
    expect(() =>
      parse(one("x", { start: "2026-09-19T13:00:00", timeZone: "Europe/London" })),
    ).toThrow();
  });
  it("requires a date, and only one kind of date", () => {
    expect(() => parse(one("x", {}))).toThrow();
    expect(() =>
      parse(one("x", { date: "2026-07-25", start: "2026-09-19T13:00:00Z", timeZone: "UTC" })),
    ).toThrow();
    expect(() => parse(one("x", { date: "25-07-2026" }))).toThrow();
  });
  it("requires an image and its description to travel together in both languages", () => {
    const alt = { es: { ...copy.es, imageAlt: "Foto" }, en: { ...copy.en, imageAlt: "Photo" } };
    expect(() => parse(one("x", { date: "2026-07-25", image: "/images/a.webp" }))).toThrow();
    expect(() => parse(one("x", { date: "2026-07-25", ...alt }))).toThrow();
    expect(() =>
      parse(one("x", { date: "2026-07-25", image: "/images/a.webp", ...alt })),
    ).not.toThrow();
  });
  it("requires both languages, matching optional fields and safe markup", () => {
    expect(() =>
      parse({ "../content/events/x.json": { date: "2026-07-25", es: copy.es } }),
    ).toThrow();
    expect(() =>
      parse(one("x", { date: "2026-07-25", es: { ...copy.es, note: "Por confirmar." } })),
    ).toThrow();
    expect(() =>
      parse(
        one("x", { date: "2026-07-25", es: { ...copy.es, title: '<span onclick="x()">T</span>' } }),
      ),
    ).toThrow();
    expect(() =>
      parse(
        one("x", { date: "2026-07-25", es: { ...copy.es, title: '<span lang="rap">Mana</span>' } }),
      ),
    ).not.toThrow();
  });
  it("rejects unknown fields so a stray key is never silently ignored", () => {
    expect(() => parse(one("x", { date: "2026-07-25", institution: "British Museum" }))).toThrow();
  });
  it.each([
    { start: "2026-07-25T20:00:00-06:00", timeZone: "Pacific/Easter" },
    { start: "2026-07-26T02:00:00Z", timeZone: "Pacific/Easter" },
    { date: "2026-07-25", timeZone: "Pacific/Easter" },
  ])("uses the Rapa Nui calendar day for %j", (facts) => {
    const events = parse(one("local", facts));
    // 19:00 locally: a timed event has not even started yet.
    expect(getEvents(events, "en", new Date("2026-07-26T01:00:00Z")).upcoming).toHaveLength(1);
    expect(getEvents(events, "en", new Date("2026-07-26T05:59:59.999Z")).upcoming).toHaveLength(1);
    expect(getEvents(events, "en", new Date("2026-07-26T06:00:00Z")).past).toHaveLength(1);
  });
  it("archives at local midnight east of UTC", () => {
    const events = parse(one("tokyo", { start: "2026-07-24T15:30:00Z", timeZone: "Asia/Tokyo" }));
    expect(getEvents(events, "en", new Date("2026-07-25T14:59:59.999Z")).upcoming).toHaveLength(1);
    expect(getEvents(events, "en", new Date("2026-07-25T15:00:00Z")).past).toHaveLength(1);
  });
  it.each([
    ["2026-03-29", "2026-03-29T22:59:59.999Z", "2026-03-29T23:00:00Z"],
    ["2026-10-25", "2026-10-25T23:59:59.999Z", "2026-10-26T00:00:00Z"],
  ])("handles daylight-saving changes on %s", (date, before, after) => {
    const events = parse(one("london", { start: `${date}T12:00:00Z`, timeZone: "Europe/London" }));
    expect(getEvents(events, "en", new Date(before)).upcoming).toHaveLength(1);
    expect(getEvents(events, "en", new Date(after)).past).toHaveLength(1);
  });
  it("preserves a date-only label when a zone is known", () => {
    const events = parse(one("day", { date: "2026-07-25", timeZone: "Pacific/Easter" }));
    const [event] = getEvents(events, "en", new Date("2026-01-01T00:00:00Z")).upcoming;
    expect(event.dateTime).toBe("2026-07-25");
    expect(event.dateLabel).toBe("25 July 2026");
  });
  it.each(["2026-13-01", "2026-00-01", "2026-02-29", "2026-04-31"])(
    "rejects impossible date %s",
    (date) => {
      expect(() => eventSchema.parse({ ...copy, date })).toThrow();
    },
  );
  it.each([
    "2026-13-01T12:00:00Z",
    "2026-02-29T12:00:00Z",
    "2026-04-31T12:00:00Z",
    "2026-07-25T25:00:00Z",
    "2026-07-25T12:00:00+99:00",
  ])("rejects impossible instant %s", (start) => {
    expect(() => eventSchema.parse({ ...copy, start, timeZone: "UTC" })).toThrow();
  });
  it("accepts leap days and offset instants without normalising source precision", () => {
    expect(eventSchema.parse({ ...copy, date: "2028-02-29" })).toMatchObject({
      date: "2028-02-29",
    });
    expect(
      eventSchema.parse({ ...copy, start: "2028-02-29T20:00-06:00", timeZone: "Pacific/Easter" }),
    ).toMatchObject({ start: "2028-02-29T20:00-06:00" });
  });
  it.each(["Pacific/Unknown", "+03:00"])(
    "rejects invalid IANA zone %s for either date shape",
    (timeZone) => {
      expect(() => eventSchema.parse({ ...copy, date: "2026-07-25", timeZone })).toThrow();
      expect(() =>
        eventSchema.parse({ ...copy, start: "2026-07-25T12:00:00Z", timeZone }),
      ).toThrow();
    },
  );
});
