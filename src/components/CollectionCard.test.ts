import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test } from "vitest";
import type { CollectionRecord } from "../data/collection";
import CollectionCard from "./CollectionCard.astro";

const record: CollectionRecord = {
  object: { id: "carved-figure", name: "Carved figure", foregroundedClaims: [] },
  sources: [
    {
      id: "catalogue-a",
      title: "Catalogue A",
      kind: "publication",
      author: null,
      reference: "Catalogue A",
      language: "en-GB",
      claims: [],
      images: [],
    },
    {
      id: "catalogue-b",
      title: "Catalogue B",
      kind: "webpage",
      author: null,
      reference: "Catalogue B",
      language: "en-GB",
      claims: [],
      images: [],
    },
  ],
  claims: [],
  foregroundedClaims: [],
  originClaims: [],
  holdingClaims: [],
  images: [],
  articles: [],
  searchExact: "carved-figure carved figure catalogue a",
  searchFoldable: "Carved figure",
};

describe("collection cards", () => {
  test("keeps an unillustrated object findable without a visible absence message", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CollectionCard, {
      props: { record, locale: "en" },
    });

    expect(html).toContain("data-catalogue-card");
    expect(html).toContain('data-search-exact="carved-figure carved figure catalogue a"');
    expect(html).toContain('data-search-foldable="Carved figure"');
    expect(html).toContain("Carved figure");
    expect(html).toContain("2 sources");
    expect(html).toContain('href="/en/collection/carved-figure/"');
    expect(html).toMatch(/<span class="sr-only"[^>]*>No image available<\/span>/u);
    expect(html).not.toMatch(/<p\b[^>]*>\s*No image available\s*<\/p>/u);
  });

  test("links an illustration to its object without an image-source link on the card", async () => {
    const imageSource = record.sources.find(({ id }) => id === "catalogue-a");
    if (!imageSource) throw new Error("Fixture image source is missing");
    const illustratedRecord: CollectionRecord = {
      ...record,
      images: [
        {
          image: { file: "test.jpg", alt: "A carved figure" },
          source: imageSource,
          asset: {
            src: "/test.jpg",
            width: 640,
            height: 480,
            format: "jpg",
          },
        },
      ],
    };
    const container = await AstroContainer.create();
    const html = await container.renderToString(CollectionCard, {
      props: { record: illustratedRecord, locale: "en" },
    });

    expect(html).toContain('href="/en/collection/carved-figure/"');
    expect(html).not.toContain('href="/en/sources/catalogue-a/"');
    expect(html).not.toContain("Image source");
  });
});
