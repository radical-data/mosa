import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test } from "vitest";
import type { Source } from "../data/collection-model";
import type { SourcedClaim } from "../data/collection-record";
import SourceAccount from "./SourceAccount.astro";

const source: Source = {
  id: "catalogue-a",
  title: "Catalogue A",
  kind: "publication",
  author: null,
  reference: "https://example.org/catalogue",
  language: "en-GB",
  claims: [],
  images: [],
};

const claims: SourcedClaim[] = [
  {
    source,
    claim: {
      id: "origin",
      objectId: "figure",
      predicate: "found_at",
      value: "Possibly Hanga Roa",
      locator: "Page 14",
    },
  },
  {
    source,
    claim: { id: "number", objectId: "figure", predicate: "catalogue_number", value: "A-17" },
  },
];

describe("object source accounts", () => {
  test("keeps every claim, its qualifier, source link and locator in native details", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SourceAccount, {
      props: { source, claims, locale: "en" },
    });

    expect(html).toMatch(/<details(?:\s[^>]*)?>/);
    expect(html).toContain("Catalogue A");
    expect(html).toContain("2 claims");
    expect(html).toContain('href="/en/sources/catalogue-a/"');
    expect(html).toContain("Possibly Hanga Roa");
    expect(html).toContain("Page 14");
    expect(html).toContain("A-17");
    expect(html).toContain('lang="en-GB"');
    expect(html).toContain("https://example.org/catalogue");
    expect(html).not.toContain("Source author:");
  });

  test("retains a source page link when the source has no object claims", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SourceAccount, {
      props: { source, claims: [], locale: "es" },
    });

    expect(html).toContain('href="/es/fuentes/catalogue-a/"');
    expect(html).toContain("0 afirmaciones");
  });
});
