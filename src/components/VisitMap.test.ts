import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test } from "vitest";
import { getCopy } from "../content/content";
import VisitMap from "./VisitMap.astro";

describe("Visit map presentation", () => {
  test("keeps the unavailable message hidden while the map initialises", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(VisitMap, {
      props: { locale: "en", destinations: [], copy: getCopy("visit", "en") },
    });

    expect(html).toMatch(/<p class="visit-map-fallback" hidden\b[^>]*>/);
    expect(html).toMatch(/<noscript><p class="visit-map-fallback"[^>]*>/);
  });
});
