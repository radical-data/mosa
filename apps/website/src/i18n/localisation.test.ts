import type { PublicCollection } from "@mosa/public-collection";
import { describe, expect, it } from "vitest";
import { getCollection } from "../data/site";
import { formatEventInstant, formatHistoricalDate, formatNumber } from "./format";
import { referenceCount } from "./messages";
import { anchors, languageLink, localeIds, pageIds, pagePath } from "./routes";
import { collectionState, matchesSearch } from "./search";

describe("localised routes and collection state", () => {
  it("maps all seven equivalents in both directions without translating path strings", () => {
    expect(pageIds).toHaveLength(7);
    const urls = new Set<string>();
    for (const page of pageIds)
      for (const locale of localeIds) {
        const path = pagePath(page, locale);
        expect(languageLink(page, locale, new URL("https://example.org/arbitrary/path/"))).toBe(
          path,
        );
        urls.add(path);
      }
    expect(urls.size).toBe(14);
  });
  it("preserves recognised parameters and only real target anchors", () => {
    const source = new URL(
      "https://example.org/es/coleccion/?concept=taoa&type=individual&q=Mamari&view=list&tracking=discard#more-information",
    );
    const target = new URL(languageLink("collection", "en", source), source);
    expect(target.pathname).toBe("/en/collection/");
    expect(Object.fromEntries(target.searchParams)).toEqual({
      concept: "taoa",
      type: "individual",
      q: "Mamari",
      view: "list",
    });
    expect(target.hash).toBe("#more-information");
    source.hash = "#unknown";
    expect(languageLink("collection", "en", source)).not.toContain("#");
    expect(languageLink("about", "en", source)).toBe("/en/about/");
    expect(anchors.resources).toContain("guide");
  });
  it("uses the same authorised records in both languages", () => {
    const collection: PublicCollection = {
      schemaVersion: 2,
      releaseId: "11111111-1111-4111-8111-111111111111",
      records: [
        {
          kind: "dossier",
          id: "22222222-2222-4222-8222-222222222222",
          label: "Source name",
          identifiers: [],
          claims: [],
          events: [],
          cases: [],
        },
      ],
    };
    expect(getCollection("es", collection)).toEqual(getCollection("en", collection));
  });
  it("keeps original-name diacritics meaningful", () => {
    expect(matchesSearch("berlin", "Berlín", "Berlín")).toBe(true);
    expect(matchesSearch("Haka Nononga", "Haka Nonoŋa", "")).toBe(false);
    expect(matchesSearch("Ha'a", "Hā'a", "")).toBe(false);
    expect(matchesSearch("HĀ'A", "Hā'a", "")).toBe(true);
  });
  it("rejects translated or unknown IDs without changing known filters", () => {
    expect(
      collectionState(
        new URLSearchParams("concept=taoa&type=Objeto+particular&view=list&q=Mamari"),
        ["taoa"],
        ["individual"],
      ),
    ).toEqual({ concept: "taoa", type: "", q: "Mamari", view: "list" });
  });
});

describe("explicit formatting and message contracts", () => {
  it("formats complete singular, plural and zero messages", () => {
    expect(referenceCount("en", { count: 1 })).toBe("1 record");
    expect(referenceCount("en", { count: 0 })).toBe("0 records");
    expect(referenceCount("es", { count: 2 })).toBe("2 registros");
    expect(() => referenceCount("es", { count: -1 })).toThrow();
    expect(formatNumber(1234.5, "en")).toBe("1,234.5");
    expect(formatNumber(1234.5, "es")).toBe("1.234,5");
  });
  it("retains historical date precision and separates event zones from locale", () => {
    expect(formatHistoricalDate("1868", "en")).toBe("1868");
    expect(formatHistoricalDate("1868-11", "en")).toBe("November 1868");
    expect(formatHistoricalDate("2026-09-19", "en")).toBe("19 September 2026");
    expect(() => formatHistoricalDate("2026-02-30", "en")).toThrow();
    expect(formatEventInstant("2026-09-19T13:00:00Z", "Europe/London", "en")).toContain("14:00");
    expect(formatEventInstant("2026-09-19T13:00:00Z", "Europe/London", "es")).toContain("2:00");
    expect(() => formatEventInstant("2026-09-19T13:00:00", "Europe/London", "en")).toThrow();
  });
});
