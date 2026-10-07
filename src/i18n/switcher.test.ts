import { afterEach, expect, test, vi } from "vitest";
import { languageLink } from "./routes";
import { updateLanguageLinks } from "./switcher";

afterEach(() => vi.unstubAllGlobals());

test("collection language links retain the unified catalogue filters and legacy keys", () => {
  const link = {
    href: "https://example.org/es/coleccion/",
    dataset: { page: "collection", anchors: '["collection-results"]' },
  };
  vi.stubGlobal("document", { querySelectorAll: () => [link] });
  vi.stubGlobal(
    "location",
    new URL(
      "https://example.org/en/collection/?scope=objects&q=Mamari&images=1&view=list&sort=name&holder=british-museum&country=GB&photos=1&classification=figure&limit=48&concept=bird&type=carving#collection-results",
    ),
  );

  updateLanguageLinks();

  const result = new URL(link.href, "https://example.org");
  expect(result.pathname).toBe("/es/coleccion/");
  expect(Object.fromEntries(result.searchParams)).toEqual({
    scope: "objects",
    q: "Mamari",
    view: "list",
    sort: "name",
    holder: "british-museum",
    country: "GB",
    photos: "1",
    images: "1",
    limit: "48",
    concept: "bird",
    type: "carving",
  });
  expect(result.hash).toBe("#collection-results");
});

test("source language links preserve source-specific browsing state", () => {
  const link = {
    href: "https://example.org/es/fuentes/",
    dataset: { page: "collection", anchors: "[]" },
  };
  vi.stubGlobal("document", { querySelectorAll: () => [link] });
  vi.stubGlobal(
    "location",
    new URL(
      "https://example.org/en/sources/?scope=sources&q=photograph&kind=photograph&topic=provenance&images=1&limit=72",
    ),
  );

  updateLanguageLinks();

  const result = new URL(link.href, "https://example.org");
  expect(result.pathname).toBe("/es/fuentes/");
  expect(Object.fromEntries(result.searchParams)).toEqual({
    scope: "sources",
    q: "photograph",
    kind: "photograph",
    images: "1",
    limit: "72",
  });
});

test("server-rendered source language links preserve unified filters", () => {
  const target = languageLink(
    "collection",
    "es",
    new URL(
      "https://example.org/en/sources/photo-archive/?scope=sources&q=portrait&view=list&topic=portrait&images=1&limit=48",
    ),
  );
  expect(target).toBe(
    "/es/fuentes/photo-archive/?scope=sources&q=portrait&view=list&images=1&limit=48",
  );
});
