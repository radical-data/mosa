import { describe, expect, test } from "vitest";
import { type CollectionData, validateCollection } from "./collection-model";
import {
  getObjectAccounts,
  getSourceRelationships,
  sourceImagesForObject,
} from "./collection-record";

// Synthetic examples exercise retained competencies, not historical assertions.
function fixture() {
  const data: CollectionData = {
    objects: [
      { id: "object-one", name: "Figure", foregroundedClaims: ["second/name", "first/name"] },
      { id: "object-two", name: "Figure", foregroundedClaims: [] },
    ],
    sources: [
      {
        id: "first",
        title: "Catalogue A",
        kind: "publication",
        author: "Catalogue A",
        reference: "Catalogue A, 1900",
        language: "en-GB",
        claims: [
          {
            id: "name",
            objectId: "object-one",
            predicate: "has_name",
            value: "Possibly a ceremonial figure",
            locator: "Page 14, row 6",
          },
          {
            id: "origin",
            objectId: "object-one",
            predicate: "made_at",
            value: "Probably Rapa Nui",
          },
          { id: "findspot", objectId: "object-one", predicate: "found_at", value: "Orongo" },
          { id: "holder", objectId: "object-one", predicate: "held_by", value: "Museum A (1900)" },
          {
            id: "other",
            objectId: "object-two",
            predicate: "has_name",
            value: "A separate figure",
          },
        ],
        images: [],
      },
      {
        id: "second",
        title: "Catalogue B",
        kind: "publication",
        author: null,
        reference: "Catalogue B",
        language: "es-CL",
        claims: [
          {
            id: "name",
            objectId: "object-one",
            predicate: "has_name",
            value: "Figura de uso desconocido",
          },
          { id: "holder", objectId: "object-one", predicate: "held_by", value: "Museo B" },
          {
            id: "place",
            objectId: "object-one",
            predicate: "located_at",
            value: "Ubicación sin confirmar",
          },
        ],
        images: [],
      },
      {
        id: "linked",
        title: "Untranscribed source",
        kind: "other",
        author: null,
        reference: "Untranscribed source",
        language: "und",
        objectIds: ["object-one"],
        claims: [],
        images: [],
      },
      {
        id: "photograph",
        title: "Photograph of Figure",
        kind: "photograph",
        author: null,
        reference: "Photograph A",
        language: "en-GB",
        claims: [],
        images: [
          {
            file: "figure/photograph.jpg",
            alt: "A carved figure.",
            credit: "Museum A",
          },
        ],
        relationships: [{ type: "depicts", target: { type: "object", id: "object-one" } }],
      },
      {
        id: "unpublished-photograph",
        title: "Unpublished photograph of Figure",
        kind: "photograph",
        author: null,
        reference: "Photograph B",
        language: "en-GB",
        claims: [],
        images: [],
        relationships: [
          { type: "depicts", target: { type: "object", id: "object-one" } },
          { type: "is_part_of", target: { type: "source", id: "linked" } },
        ],
      },
    ],
  };
  return validateCollection(data);
}

describe("retained collection competencies", () => {
  test("cases 01/02: foregrounding preserves competing names, source attribution and uncertainty", () => {
    const data = fixture();
    const before = structuredClone(data);
    const record = getObjectAccounts(data, "object-one");
    expect(record?.foregroundedClaims.map(({ source }) => source.id)).toEqual(["second", "first"]);
    expect(record?.foregroundedClaims[1]).toMatchObject({
      claim: { value: "Possibly a ceremonial figure", locator: "Page 14, row 6" },
      source: { author: "Catalogue A", language: "en-GB", reference: "Catalogue A, 1900" },
    });
    expect(record?.foregroundedClaims[0].source.author).toBeNull();
    expect(record?.claims.filter(({ claim }) => claim.predicate === "has_name")).toHaveLength(2);
    expect(record?.sources[0].claims[0].value).toBe("Possibly a ceremonial figure");
    expect(data).toEqual(before);
  });

  test("case 03: similar labels and a shared source do not merge distinct objects", () => {
    const data = fixture();
    expect(getObjectAccounts(data, "object-two")?.claims.map(({ claim }) => claim.value)).toEqual([
      "A separate figure",
    ]);
    expect(
      getObjectAccounts(data, "object-one")?.claims.some(({ claim }) => claim.id === "other"),
    ).toBe(false);
    expect(getObjectAccounts(data, "missing")).toBeUndefined();
  });

  test("cases 06/07: origin, findspot and reported custody remain distinct attributed claims", () => {
    const record = getObjectAccounts(fixture(), "object-one");
    expect(record?.originClaims.map(({ claim }) => [claim.predicate, claim.value])).toEqual([
      ["made_at", "Probably Rapa Nui"],
      ["found_at", "Orongo"],
    ]);
    expect(
      record?.holdingClaims.map(({ claim, source }) => [source.id, claim.predicate, claim.value]),
    ).toEqual([
      ["first", "held_by", "Museum A (1900)"],
      ["second", "held_by", "Museo B"],
      ["second", "located_at", "Ubicación sin confirmar"],
    ]);
  });

  test("ADR 023: a linked source remains visible without manufacturing assertions", () => {
    const record = getObjectAccounts(fixture(), "object-one");
    expect(record?.sources.find((source) => source.id === "linked")?.claims).toEqual([]);
    expect(record?.claims.some(({ source }) => source.id === "linked")).toBe(false);
    expect(record?.foregroundedClaims.some(({ source }) => source.id === "linked")).toBe(false);
  });

  test("ADR 027: depicting sources remain visible and supply object images", () => {
    const data = fixture();
    const record = getObjectAccounts(data, "object-one");
    expect(record?.sources.find((source) => source.id === "photograph")?.images).toEqual([
      expect.objectContaining({ file: "figure/photograph.jpg" }),
    ]);
    expect(record?.sources.some((source) => source.id === "unpublished-photograph")).toBe(true);
    expect(getObjectAccounts(data, "object-two")?.sources).toHaveLength(1);
  });

  test("image depiction lists narrow each object's gallery and preserve source-page images", () => {
    const data = fixture();
    data.sources.push({
      id: "film",
      title: "Film with several objects",
      kind: "audiovisual",
      author: null,
      reference: "Film",
      language: "en",
      claims: [],
      images: [
        { file: "film/hoa.jpg", alt: "Hoa still", depicts: ["object-one"] },
        { file: "film/figure.jpg", alt: "Figure still", depicts: ["object-two"] },
        { file: "film/shared.jpg", alt: "Shared still" },
        { file: "film/unassigned.jpg", alt: "Unassigned still", depicts: [] },
      ],
      relationships: [
        { type: "depicts", target: { type: "object", id: "object-one" } },
        { type: "depicts", target: { type: "object", id: "object-two" } },
      ],
    });
    const checked = validateCollection(data);
    const film = checked.sources.find(({ id }) => id === "film");
    if (!film) throw Error("film fixture is missing");

    expect(sourceImagesForObject(film, "object-one").map(({ file }) => file)).toEqual([
      "film/hoa.jpg",
      "film/shared.jpg",
    ]);
    expect(sourceImagesForObject(film, "object-two").map(({ file }) => file)).toEqual([
      "film/figure.jpg",
      "film/shared.jpg",
    ]);
    expect(
      getObjectAccounts(checked, "object-one")?.sources.find(({ id }) => id === "film")?.images,
    ).toEqual(sourceImagesForObject(film, "object-one"));
    expect(getSourceRelationships(checked, "film")?.source.images).toHaveLength(4);
  });

  test("ADR 027: source relationships project outgoing, incoming and object links", () => {
    const relationships = getSourceRelationships(fixture(), "unpublished-photograph");
    expect(relationships?.outgoing).toEqual([
      expect.objectContaining({
        source: expect.objectContaining({ id: "linked" }),
        type: "is_part_of",
      }),
    ]);
    expect(relationships?.depictingObjects).toEqual([{ type: "object", id: "object-one" }]);
    expect(relationships?.relatedObjects).toEqual([]);

    const linked = getSourceRelationships(fixture(), "linked");
    expect(linked?.incoming).toEqual([
      expect.objectContaining({
        source: expect.objectContaining({ id: "unpublished-photograph" }),
        type: "is_part_of",
      }),
    ]);
  });
});
