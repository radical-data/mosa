import { describe, expect, test } from "vitest";
import type { CollectionData, GeocodedLocation } from "./collection-model";
import { getVisitHolders } from "./visit-holders";

const city: GeocodedLocation = {
  name: "Same city",
  precision: "locality",
  longitude: 0,
  latitude: 0,
  reference: "https://example.org/map",
};
const data: CollectionData = {
  objects: ["one", "two", "three"].map((id) => ({ id, name: id, foregroundedClaims: [] })),
  holders: [
    { id: "museum-a", name: "Museum A", location: city },
    { id: "museum-b", name: "Museum B", location: city },
    { id: "private", name: "Private collection" },
    { id: "unused", name: "Unreferenced holder", location: city },
  ],
  sources: [
    {
      id: "catalogue",
      title: "Catalogue",
      kind: "publication",
      author: null,
      reference: "Catalogue",
      language: "en",
      images: [],
      claims: [
        {
          id: "one-a",
          objectId: "one",
          predicate: "held_by",
          value: "Museum A",
          holderId: "museum-a",
        },
        {
          id: "one-repeat",
          objectId: "one",
          predicate: "held_by",
          value: "Museum A",
          holderId: "museum-a",
        },
        {
          id: "two-b",
          objectId: "two",
          predicate: "held_by",
          value: "Museum B",
          holderId: "museum-b",
        },
        {
          id: "three-private",
          objectId: "three",
          predicate: "held_by",
          value: "Private collection",
          holderId: "private",
        },
      ],
    },
  ],
};

describe("Visit destinations", () => {
  test("keeps each holder distinct at overlapping coordinates, includes unmapped private holders and deduplicates objects", () => {
    const result = getVisitHolders(data);
    expect(result.map(({ holder, objects }) => [holder.id, objects.length])).toEqual([
      ["museum-a", 1],
      ["museum-b", 1],
      ["private", 1],
    ]);
    expect(result[0].objects[0].claims.map(({ claim }) => claim.id)).toEqual([
      "one-a",
      "one-repeat",
    ]);
    expect(result[2].holder.location).toBeUndefined();
  });

  test("object exceptions do not move a holder's marker or erase historical evidence", () => {
    const changed = structuredClone(data);
    changed.locations = [
      {
        id: "one",
        status: "historical",
        claimReferences: ["catalogue/one-a"],
        location: { ...city, name: "Other city", longitude: 30 },
        reviewedAt: "2026-10-02",
        note: { text: "Historical holding only.", language: "en" },
      },
    ];
    const first = getVisitHolders(changed)[0];
    expect(first.holder.location).toEqual(city);
    expect(first.objects[0]).toMatchObject({
      status: "historical",
      note: { text: "Historical holding only." },
    });
  });

  test("competing holding claims remain attributed to both holders and labelled uncertain", () => {
    const changed = structuredClone(data);
    changed.sources[0].claims.push({
      id: "one-b",
      objectId: "one",
      predicate: "held_by",
      value: "Museum B",
      holderId: "museum-b",
    });
    const result = getVisitHolders(changed);
    for (const id of ["museum-a", "museum-b"]) {
      const entry = result
        .find(({ holder }) => holder.id === id)
        ?.objects.find(({ object }) => object.id === "one");
      expect(entry?.status).toBe("uncertain");
      expect(entry?.claims.every(({ claim }) => claim.holderId === id)).toBe(true);
    }
  });
});
