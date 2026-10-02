import { afterEach, expect, test, vi } from "vitest";
import { updateLanguageLinks } from "./switcher";

afterEach(() => vi.unstubAllGlobals());

test("updated collection language links retain the combined browse state", () => {
  const link = {
    href: "https://example.org/es/coleccion/",
    dataset: { page: "collection", anchors: '["collection-results"]' },
  };
  vi.stubGlobal("document", { querySelectorAll: () => [link] });
  vi.stubGlobal(
    "location",
    new URL("https://example.org/en/collection/?q=Mamari&images=1&view=list#collection-results"),
  );

  updateLanguageLinks();

  const result = new URL(link.href, "https://example.org");
  expect(result.pathname).toBe("/es/coleccion/");
  expect(Object.fromEntries(result.searchParams)).toEqual({
    q: "Mamari",
    view: "list",
  });
  expect(result.hash).toBe("#collection-results");
});
