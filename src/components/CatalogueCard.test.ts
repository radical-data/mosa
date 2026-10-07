import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test } from "vitest";
import type { CatalogueItem } from "../data/catalogue-browse";
import CatalogueCard from "./CatalogueCard.astro";

const item: CatalogueItem = {
  key: "objects/figure",
  id: "figure",
  section: "objects",
  title: "Figure",
  kind: "object",
  hasImage: false,
  details: [
    { label: "classification", value: "moai", language: "rap", sourceId: "account" },
    { label: "holder", value: "Historical holding", sourceId: "account" },
    { label: "documents", value: "2" },
  ],
  search: "Figure",
  directSearch: "Figure",
  holderIds: [],
  holderCountries: {},
  classifications: ["moai"],
  topics: [],
  sourceCount: 2,
};

describe("unified catalogue cards", () => {
  test("keeps unillustrated objects accessible and links reported values to their sources", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CatalogueCard, { props: { item, locale: "es" } });
    expect(html).toContain('href="/es/coleccion/figure/"');
    expect(html).toContain('href="/es/fuentes/account/"');
    expect(html).toContain('href="/es/coleccion/figure/#sources"');
    expect(html).toContain('lang="rap"');
    expect(html).toContain("Institución");
    expect(html).not.toContain("<img");
  });

  test("keeps documents independently linked with their language and related objects", async () => {
    const container = await AstroContainer.create();
    const document: CatalogueItem = {
      ...item,
      key: "sources/photo",
      id: "photo",
      section: "sources",
      kind: "photograph",
      title: "Vue ancienne",
      language: "fr",
      details: [{ label: "about", value: "Figure", hrefId: "figure" }],
    };
    const html = await container.renderToString(CatalogueCard, {
      props: { item: document, locale: "en" },
    });
    expect(html).toContain('href="/en/sources/photo/"');
    expect(html).toContain('href="/en/collection/figure/"');
    expect(html).toContain('lang="fr"');
    expect(html).toContain("Photograph");
  });
});
