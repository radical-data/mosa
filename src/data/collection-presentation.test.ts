import { describe, expect, it } from "vitest";
import { type PresentationImage, resolveCollectionPresentation } from "./collection-presentation";

const image = (sourceId: string, file: string, kind = "webpage") =>
  ({ image: { file }, source: { id: sourceId, kind } }) satisfies PresentationImage;

describe("collection presentation", () => {
  it("orders photograph sources first, then source ID and file", () => {
    const gallery = [
      image("z-source", "z.jpg", "webpage"),
      image("b-photo", "z.jpg", "photograph"),
      image("a-photo", "z.jpg", "photograph"),
      image("a-photo", "a.jpg", "photograph"),
    ];

    const resolved = resolveCollectionPresentation(
      { featuredObjectIds: ["object-a"] },
      ["object-a"],
      new Map([["object-a", gallery]]),
    );

    expect(resolved.imagesByObjectId.get("object-a")).toEqual([
      gallery[3],
      gallery[2],
      gallery[1],
      gallery[0],
    ]);
  });

  it("moves a configured lead image to the start of its depicting gallery", () => {
    const gallery = [
      image("b-photo", "back.jpg", "photograph"),
      image("a-photo", "front.jpg", "photograph"),
    ];

    const resolved = resolveCollectionPresentation(
      {
        featuredObjectIds: ["object-a"],
        leadImages: { "object-a": { sourceId: "b-photo", file: "back.jpg" } },
      },
      ["object-a"],
      new Map([["object-a", gallery]]),
    );

    expect(resolved.imagesByObjectId.get("object-a")?.[0]).toBe(gallery[0]);
  });

  it("rejects duplicate featured object IDs", () => {
    expect(() =>
      resolveCollectionPresentation(
        { featuredObjectIds: ["object-a", "object-a"] },
        ["object-a"],
        new Map(),
      ),
    ).toThrow(/featured object "object-a" more than once/);
  });

  it("rejects featured IDs and lead image keys that do not identify collection objects", () => {
    expect(() =>
      resolveCollectionPresentation({ featuredObjectIds: ["missing"] }, ["object-a"], new Map()),
    ).toThrow(/featuredObjectIds contains unknown object "missing"/);

    expect(() =>
      resolveCollectionPresentation(
        { featuredObjectIds: [], leadImages: { missing: { sourceId: "photo", file: "a.jpg" } } },
        ["object-a"],
        new Map(),
      ),
    ).toThrow(/leadImages contains unknown object "missing"/);
  });

  it("rejects a lead image that is not in the object's depicting gallery", () => {
    expect(() =>
      resolveCollectionPresentation(
        {
          featuredObjectIds: ["object-a"],
          leadImages: { "object-a": { sourceId: "other-photo", file: "other.jpg" } },
        },
        ["object-a"],
        new Map([["object-a", [image("photo", "actual.jpg", "photograph")]]]),
      ),
    ).toThrow(/is not in that object's depicting gallery/);
  });
});
