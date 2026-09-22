import { describe, expect, it } from "vitest";
import { getEvents, parseEvents } from "./events";

const copy = {
  es: { title: "Encuentro", body: "Una conversación." },
  en: { title: "Gathering", body: "A conversation." },
};
const parse = (files: Record<string, unknown>) => parseEvents(files);
const one = (slug: string, event: Record<string, unknown>) => ({
  [`../content/events/${slug}.json`]: { ...copy, ...event },
});

describe("event files", () => {
  it("publishes the events in the content directory", () => {
    const { upcoming, past } = getEvents("en", new Date("2026-09-22T00:00:00Z"));
    expect(upcoming).toEqual([]);
    expect(past.map((event) => event.slug)).toEqual(["2026-07-25-rapa-nui-generations"]);
    expect(past[0]?.title).toContain("In conversation with new generations");
    expect(past[0]?.dateTime).toBe("2026-07-25");
  });
  it("keeps a date-only event's precision and a timed event's hour", () => {
    const events = parse({
      ...one("day", { date: "2026-07-25" }),
      ...one("timed", { start: "2026-09-19T13:00:00Z", timeZone: "Europe/London" }),
    });
    const { upcoming } = getEvents("en", new Date("2026-01-01T00:00:00Z"), events);
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
    const { upcoming, past } = getEvents("es", new Date("2026-01-15T00:00:00Z"), events);
    expect(upcoming.map((event) => event.slug)).toEqual(["a", "b"]);
    expect(past.map((event) => event.slug)).toEqual(["d", "c"]);
  });
  it("keeps an event upcoming until the end of its own day", () => {
    const events = parse(one("today", { date: "2026-07-25" }));
    expect(getEvents("en", new Date("2026-07-25T22:00:00Z"), events).upcoming).toHaveLength(1);
    expect(getEvents("en", new Date("2026-07-26T00:00:00Z"), events).past).toHaveLength(1);
  });
  it("resolves copy for the requested language only", () => {
    const events = parse(one("x", { date: "2026-07-25", venue: "Rapa Nui" }));
    const [event] = getEvents("es", new Date("2026-01-01T00:00:00Z"), events).upcoming;
    expect(event).toMatchObject({ title: "Encuentro", venue: "Rapa Nui" });
    expect(event).not.toHaveProperty("en");
  });
  it("rejects a time zone without a time, and a time without a zone", () => {
    expect(() => parse(one("x", { date: "2026-07-25", timeZone: "Pacific/Easter" }))).toThrow();
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
});
