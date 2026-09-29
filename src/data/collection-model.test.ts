import { describe, expect, test } from "vitest";
import {
  parseEditorialFrontmatter,
  parseObject,
  parseSource,
  validateCollection,
} from "./collection-model";

const object = parseObject(
  { name: "Object one", foregroundedClaims: ["source-one/name"] },
  "object-one.json",
);
const source = parseSource(
  {
    author: null,
    reference: "Example catalogue",
    language: "en-GB",
    claims: [{ id: "name", objectId: "object-one", predicate: "has_name", value: "Object one" }],
    images: [{ objectId: "object-one", file: "object-one/front.jpg", alt: "Front view" }],
  },
  "source-one.json",
);

describe("collection model", () => {
  test("preserves source research notes with their own language without creating claims", () => {
    const { id: _id, ...record } = source;
    const notes = { text: "Blank cells repeat the preceding holder.", language: "en-GB" };
    const parsed = parseSource({ ...record, language: "es", notes }, "source-one.json");
    expect(parsed.notes).toEqual(notes);
    expect(parsed.language).toBe("es");
    expect(parsed.claims).toEqual(source.claims);
    expect(parseSource(record, "source-one.json").notes).toBeUndefined();
  });

  test.each([
    null,
    "Unstructured note",
    {},
    { text: " ", language: "en-GB" },
    { text: 42, language: "en-GB" },
    { text: "Note" },
    { text: "Note", language: "English" },
    { text: "Note", language: "en-GB", private: true },
  ])("rejects malformed source notes: %j", (notes) => {
    const { id: _id, ...record } = source;
    expect(() => parseSource({ ...record, notes }, "source-one.json")).toThrow(/notes/);
  });

  test("validates linked records and images", () => {
    const data = validateCollection(
      { objects: [object], sources: [source] },
      { imageFiles: new Set(["object-one/front.jpg"]) },
    );
    expect(data.claims.get("source-one/name")?.value).toBe("Object one");
    expect(object.id).toBe("object-one");
    expect(source.id).toBe("source-one");
  });

  test("rejects foregrounding a missing claim", () => {
    expect(() => validateCollection({ objects: [object], sources: [] })).toThrow(
      "foregrounds missing claim",
    );
  });

  test("rejects unsafe image paths", () => {
    expect(() =>
      parseSource(
        { ...source, images: [{ ...source.images[0], file: "../front.jpg" }] },
        "source-one.json",
      ),
    ).toThrow("safe collection image path");
  });

  test("rejects stored record ids and invalid filenames", () => {
    expect(() => parseObject({ ...object, id: "other" }, "object-one.json")).toThrow(
      "unsupported field",
    );
    expect(() => parseSource(source, "Source one.json")).toThrow(
      "filename is not a valid identifier",
    );
  });

  test("allows the same local claim id in separate sources", () => {
    const otherSource = parseSource(
      {
        author: null,
        reference: "Another catalogue",
        language: "en-GB",
        claims: [
          { id: "name", objectId: "object-one", predicate: "has_name", value: "Other name" },
        ],
        images: [],
      },
      "source-two.json",
    );
    const data = validateCollection({ objects: [object], sources: [source, otherSource] });
    expect(data.claims.get("source-two/name")?.value).toBe("Other name");
  });

  test("rejects duplicate local claim ids within one source", () => {
    expect(() =>
      validateCollection({
        objects: [object],
        sources: [{ ...source, claims: [source.claims[0], source.claims[0]] }],
      }),
    ).toThrow("source-one.json: duplicate claim id: name");
  });

  test("rejects malformed and cross-object foregrounding references", () => {
    expect(() =>
      parseObject({ name: "Object one", foregroundedClaims: ["name"] }, "object-one.json"),
    ).toThrow("invalid claim reference");

    const otherObject = parseObject(
      { name: "Object two", foregroundedClaims: ["source-one/name"] },
      "object-two.json",
    );
    expect(() => validateCollection({ objects: [object, otherObject], sources: [source] })).toThrow(
      "object object-two foregrounds claim source-one/name about object-one",
    );
  });

  test("rejects duplicate images within one source", () => {
    expect(() =>
      validateCollection({
        objects: [object],
        sources: [{ ...source, images: [source.images[0], source.images[0]] }],
      }),
    ).toThrow("source-one.json: duplicate image for object-one: object-one/front.jpg");
  });

  test("parses prose-only editorial metadata", () => {
    expect(
      parseEditorialFrontmatter(
        "---\nobjectId: object-one\ntitle: A title\nauthor: null\nlanguage: rap\n---\n\nText.",
        "essay-one.md",
      ),
    ).toEqual({
      id: "essay-one",
      objectId: "object-one",
      title: "A title",
      author: null,
      language: "rap",
    });
  });
});
