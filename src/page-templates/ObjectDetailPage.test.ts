import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test } from "vitest";
import type { CollectionRecord } from "../data/collection";
import ObjectDetail from "./ObjectDetailPage.astro";

const source = {
  id: "catalogue-a",
  title: "Catalogue A",
  kind: "publication" as const,
  author: null,
  reference: "Catalogue A",
  language: "en-GB",
  claims: [
    {
      id: "origin",
      objectId: "figure",
      predicate: "found_at" as const,
      value: "Possibly Hanga Roa",
      locator: "Page 14",
    },
    {
      id: "holder",
      objectId: "figure",
      predicate: "held_by" as const,
      value: "Museum A",
    },
  ],
  images: [],
};
const secondSource = {
  ...source,
  id: "catalogue-b",
  title: "Catalogue B",
  reference: "Catalogue B",
  language: "es-CL",
  claims: [{ id: "origin", objectId: "figure", predicate: "found_at" as const, value: "Terevaka" }],
};
const sourcedClaims = [
  ...source.claims.map((claim) => ({ source, claim })),
  ...secondSource.claims.map((claim) => ({ source: secondSource, claim })),
];
const record: CollectionRecord = {
  object: { id: "figure", name: "Carved figure", foregroundedClaims: ["catalogue-a/origin"] },
  sources: [source, secondSource],
  claims: sourcedClaims,
  foregroundedClaims: [sourcedClaims[0]],
  originClaims: [sourcedClaims[0], sourcedClaims[2]],
  holdingClaims: [sourcedClaims[1]],
  images: [],
  articles: [],
  searchExact: "",
  searchFoldable: "",
};

describe("object detail template", () => {
  test("filters exact foregrounded claim references from summaries but retains every source account", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ObjectDetail, { props: { locale: "en", record } });

    const originSection = html.match(/<section id="origin"[\s\S]*?<\/section>/)?.[0];
    expect(originSection).toContain("Terevaka");
    expect(originSection).not.toContain("Possibly Hanga Roa");
    expect(html).toContain("Foregrounded perspectives");
    expect(html).toContain("MoSA selects these claims for prominence");
    expect(html).toContain("On this page");
    expect(html).toContain('href="#origin"');
    expect(html).toContain("Reported holding and location");
    expect(html).toContain("Possibly Hanga Roa");
    expect(html).toContain("Museum A");
    expect(html).toContain("Page 14");
  });

  test("omits empty navigation and location sections", async () => {
    const emptyRecord: CollectionRecord = {
      ...record,
      sources: [],
      claims: [],
      foregroundedClaims: [],
      originClaims: [],
      holdingClaims: [],
    };
    const container = await AstroContainer.create();
    const html = await container.renderToString(ObjectDetail, {
      props: { locale: "es", record: emptyRecord },
    });

    expect(html).not.toContain('aria-label="En esta página"');
    expect(html).not.toContain('id="origin"');
    expect(html).not.toContain('id="holding"');
    expect(html).not.toContain('id="sources"');
  });
});
