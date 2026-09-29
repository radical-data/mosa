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

  test("parses source capture provenance records", () => {
    const { id: _id, ...record } = source;
    const captures = [
      {
        file: "source-one/catalogue.pdf",
        originalUrl: "https://example.org/catalogue/123",
        archiveUrl:
          "https://web.archive.org/web/20240102123456id_/https://example.org/catalogue/123?record=42#details",
        capturedAt: "2024-01-02T12:34:56Z",
        addedAt: "2024-01-03T09:00:00.125Z",
        method: "download",
        note: "Downloaded from the catalogue record.",
      },
      {
        archiveUrl:
          "https://web.archive.org/web/20240203102030if_/https://example.org/archived-page",
        capturedAt: null,
        addedAt: "2024-01-03T09:00:00Z",
        method: "singlefile",
      },
    ];
    expect(parseSource({ ...record, captures }, "source-one.json").captures).toEqual(captures);
    expect(parseSource(record, "source-one.json").captures).toBeUndefined();
  });

  test.each([
    { file: "../source-one/catalogue.pdf" },
    { file: "/source-one/catalogue.pdf" },
    { file: "source-one\\catalogue.pdf" },
    { file: "another-source/catalogue.pdf" },
    { file: "source-one/subdir/catalogue.pdf" },
    { file: "source-one/catalogue.exe" },
    { archiveUrl: "https://web.archive.org/web/20240102123456js_/https://example.org/page" },
    { archiveUrl: "http://web.archive.org/web/20240102123456/https://example.org/page" },
    { archiveUrl: "https://web.archive.org/web/20240230123456/https://example.org/page" },
    { archiveUrl: "https://example.org/page" },
    { archiveUrl: "https://web.archive.org/web/20240102123456/https://" },
  ])("rejects unsafe or unsupported capture references: %j", (captureRef) => {
    const { id: _id, ...record } = source;
    expect(() =>
      parseSource(
        {
          ...record,
          captures: [
            {
              ...captureRef,
              capturedAt: null,
              addedAt: "2024-01-03T09:00:00Z",
              method: "download",
            },
          ],
        },
        "source-one.json",
      ),
    ).toThrow(/captures\[0\]\.(?:file|archiveUrl)/);
  });

  test.each([
    { capturedAt: "2024-02-30T12:00:00Z", addedAt: "2024-03-01T00:00:00Z" },
    { capturedAt: "2024-03-01T12:00:00+00:00", addedAt: "2024-03-01T00:00:00Z" },
    { capturedAt: null, addedAt: "2024-03-01T00:00:00" },
    { capturedAt: null, addedAt: "2024-03-01T00:00:00Z", method: "scan" },
    { capturedAt: null, addedAt: "2024-03-01T00:00:00Z", method: "download", note: " " },
  ])("rejects invalid capture metadata: %j", (metadata) => {
    const { id: _id, ...record } = source;
    expect(() =>
      parseSource(
        {
          ...record,
          captures: [{ file: "source-one/capture.html", method: "download", ...metadata }],
        },
        "source-one.json",
      ),
    ).toThrow(/captures\[0\]/);
  });

  test("requires a capture file or archive URL and rejects duplicate capture references", () => {
    const { id: _id, ...record } = source;
    const base = {
      capturedAt: null,
      addedAt: "2024-03-01T00:00:00Z",
      method: "download",
    };
    expect(() => parseSource({ ...record, captures: [base] }, "source-one.json")).toThrow(
      "captures[0] requires file or archiveUrl",
    );
    expect(() =>
      parseSource(
        {
          ...record,
          captures: [
            { ...base, file: "source-one/capture.html" },
            { ...base, file: "source-one/capture.html", note: "second record" },
          ],
        },
        "source-one.json",
      ),
    ).toThrow("duplicates capture file");
    expect(() =>
      parseSource(
        {
          ...record,
          captures: [
            {
              ...base,
              archiveUrl:
                "https://web.archive.org/web/20240102123456/https://example.org/page?record=42",
            },
            {
              ...base,
              archiveUrl:
                "https://web.archive.org/web/20240102123456/https://example.org/page?record=42",
              file: "source-one/capture.html",
            },
          ],
        },
        "source-one.json",
      ),
    ).toThrow("duplicates capture archive URL");
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

  test("validates a source link without deriving a claim", () => {
    const unforegroundedObject = parseObject(
      { name: "Object one", foregroundedClaims: [] },
      "object-one.json",
    );
    const linkedSource = parseSource(
      {
        author: "Example Museum",
        reference: "https://example.org/collection/123",
        language: "en-GB",
        objectIds: ["object-one"],
        claims: [],
        images: [],
      },
      "museum-record.json",
    );
    expect(linkedSource.objectIds).toEqual(["object-one"]);
    expect(() =>
      validateCollection({ objects: [unforegroundedObject], sources: [linkedSource] }),
    ).not.toThrow();
  });

  test("rejects invalid and redundant direct object links", () => {
    const { id: _id, ...record } = source;
    expect(() => parseSource({ ...record, objectIds: [] }, "source-one.json")).toThrow(
      "objectIds cannot be empty",
    );
    expect(() =>
      parseSource({ ...record, objectIds: ["object-one", "object-one"] }, "source-one.json"),
    ).toThrow("objectIds contains duplicates");

    const missing = parseSource({ ...record, objectIds: ["missing-object"] }, "source-one.json");
    expect(() => validateCollection({ objects: [object], sources: [missing] })).toThrow(
      "objectIds refers to missing object missing-object",
    );

    const redundant = parseSource({ ...record, objectIds: ["object-one"] }, "source-one.json");
    expect(() => validateCollection({ objects: [object], sources: [redundant] })).toThrow(
      "redundant objectId object-one",
    );
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
