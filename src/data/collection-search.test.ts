import { describe, expect, it } from "vitest";
import { matchesSearch } from "../i18n/search";
import { buildObjectSearchExact } from "./collection-search";

describe("object collection search text", () => {
  it("includes object, source, claim, image metadata and zero-claim image source titles", () => {
    const searchText = buildObjectSearchExact({
      object: { id: "hoa-hakananai-a", name: "Hoa Hakananaiʻa" },
      sources: [
        { title: "British Museum catalogue", reference: "https://museum.example/object/1" },
      ],
      claims: [
        {
          claim: { predicate: "held_by", value: "British Museum" },
          source: {
            title: "British Museum catalogue",
            reference: "https://museum.example/object/1",
          },
        },
      ],
      images: [
        {
          image: {
            alt: "Front view",
            caption: "Photograph of the carved figure",
            credit: "© Example Archive",
            rights: "CC BY-NC-SA 4.0",
          },
          source: { title: "A photograph with no extracted claims" },
        },
      ],
    });

    for (const term of [
      "hoa-hakananai-a",
      "Hoa Hakananaiʻa",
      "https://museum.example/object/1",
      "held_by British Museum",
      "British Museum catalogue",
      "Front view",
      "Photograph of the carved figure",
      "© Example Archive",
      "CC BY-NC-SA 4.0",
      "A photograph with no extracted claims",
    ]) {
      expect(searchText).toContain(term);
    }
  });

  it("keeps image text accents intact for the established exact-match convention", () => {
    const searchText = buildObjectSearchExact({
      object: { id: "object-a", name: "Object A" },
      sources: [],
      claims: [],
      images: [
        {
          image: { alt: "Hā'a carved in stone" },
          source: { title: "Photograph" },
        },
      ],
    });

    expect(searchText).toContain("Hā'a carved in stone");
    expect(matchesSearch("Hā'a", searchText, "")).toBe(true);
    expect(matchesSearch("Ha'a", searchText, "")).toBe(false);
  });
});
