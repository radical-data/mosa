import { describe, expect, it } from "vitest";
import { getResources, guideSections, organisations, readings, resourceLabels } from "./resources";

describe("public resources", () => {
  it("provides four linked bilingual resource pages", () => {
    for (const locale of ["es", "en"] as const) {
      const cards = getResources(locale);
      expect(cards).toHaveLength(4);
      expect(new Set(cards.map((card) => card.id)).size).toBe(4);
      expect(
        cards.every((card) =>
          card.path.startsWith(locale === "es" ? "/es/recursos/" : "/en/resources/"),
        ),
      ).toBe(true);
      expect(cards.every((card) => card.title.trim() && card.description.trim())).toBe(true);
    }
    expect(resourceLabels.es.guide.title).toBe("Guía de restitución");
    expect(resourceLabels.en.directory.title).toBe("Directory of organisations");
  });

  it("keeps all 13 organisation entries complete, distinct and linked", () => {
    expect(organisations).toHaveLength(13);
    expect(new Set(organisations.map(({ id }) => id)).size).toBe(13);
    for (const organisation of organisations) {
      expect(organisation.name.trim()).not.toBe("");
      expect(organisation.description.es.trim()).not.toBe("");
      expect(organisation.description.en.trim()).not.toBe("");
      expect(new URL(organisation.url).protocol).toBe("https:");
    }
  });

  it("groups unique reading links and preserves the supplied UNESCO and report links", () => {
    const urls = readings.map(({ url }) => url);
    expect(new Set(urls).size).toBe(urls.length);
    expect(
      readings.some(({ url }) => url === "https://unesdoc.unesco.org/ark:/48223/pf0000385275_eng"),
    ).toBe(true);
    expect(readings.find(({ url }) => url.includes("wewantthemback"))?.secondary?.url).toContain(
      "we-want-them-back_english-web-6.pdf",
    );
    expect(readings.filter(({ title }) => title.en.includes("Fault Lines"))).toHaveLength(1);
    expect(
      readings.filter(({ title }) => title.en.includes("Universal Declaration of Human Rights")),
    ).toHaveLength(1);
  });

  it("keeps the guide's four sections paired and ordered in both languages", () => {
    for (const locale of ["es", "en"] as const) {
      expect(guideSections[locale].map(({ id }) => id)).toEqual([
        "begin",
        "translate",
        "sustain",
        "reconnect",
      ]);
      expect(
        guideSections[locale].every(
          ({ heading, intro, points }) => heading && intro && points.length > 0,
        ),
      ).toBe(true);
    }
  });
});
