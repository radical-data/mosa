import { describe, expect, it } from "vitest";
import { formatEventInstant, formatHistoricalDate, formatNumber } from "./format";
import { referenceCount } from "./messages";
import {
  anchors,
  languageLink,
  localeIds,
  pageIds,
  pagePath,
  resourceIds,
  resourcePath,
} from "./routes";
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
  it("switches collection record routes and retains source filters", () => {
    const sourceIndex = new URL(
      "https://example.org/en/sources/?q=letter&kind=correspondence&topic=restitution&tracking=x",
    );
    expect(languageLink("collection", "es", sourceIndex)).toBe(
      "/es/fuentes/?q=letter&kind=correspondence",
    );
    const sourceDetail = new URL("https://example.org/es/fuentes/a-letter/");
    expect(languageLink("collection", "en", sourceDetail)).toBe("/en/sources/a-letter/");
    const article = new URL("https://example.org/es/articulos/a-story/");
    expect(languageLink("resources", "en", article)).toBe("/en/articles/a-story/");
    const object = new URL("https://example.org/en/collection/a-carving/");
    expect(languageLink("collection", "es", object)).toBe("/es/coleccion/a-carving/");
  });
  it("keeps resource detail routes bilingual and outside primary page navigation", () => {
    expect(resourceIds).toEqual(["guide", "letter", "directory", "actors"]);
    expect(pageIds).not.toContain("guide");
    expect(resourcePath("guide", "es")).toBe("/es/recursos/guia-de-restitucion/");
    expect(resourcePath("guide", "en")).toBe("/en/resources/restitution-guide/");
    const letter = new URL("https://example.org/es/recursos/modelo-de-carta/#main");
    expect(languageLink("resources", "en", letter)).toBe(
      "/en/resources/restitution-letter-template/#main",
    );
    const actors = new URL("https://example.org/en/resources/participant-map/");
    expect(languageLink("resources", "es", actors)).toBe("/es/recursos/mapeo-de-actores/");
    const guide = new URL("https://example.org/en/resources/restitution-guide/#translate");
    expect(languageLink("resources", "es", guide)).toBe(
      "/es/recursos/guia-de-restitucion/#translate",
    );
    const invalid = new URL("https://example.org/en/resources/organisation-directory/#directory");
    expect(languageLink("resources", "es", invalid)).toBe(
      "/es/recursos/directorio-de-organizaciones/",
    );
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
