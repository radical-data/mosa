import { describe, expect, test } from "vitest";
import {
  parseArticleFrontmatter,
  parseHolder,
  parseLocation,
  parseObject,
  parseSource,
  validateArticlePublicationSource,
  validateArticleSubjects,
  validateCollection,
  validateUniqueSourceArticleLinks,
} from "./collection-model";

const object = parseObject(
  { name: "Object one", foregroundedClaims: ["source-one/name"] },
  "object-one.json",
);
const source = parseSource(
  {
    author: null,
    title: "Example catalogue",
    kind: "publication",
    reference: "Example catalogue",
    language: "en-GB",
    claims: [
      {
        id: "name",
        objectId: "object-one",
        predicate: "has_name",
        value: "Object one",
      },
    ],
    images: [{ file: "object-one/front.jpg", alt: "Front view" }],
  },
  "source-one.json",
);

describe("collection model", () => {
  test("parses holders with geocoded locations and object location assessments", () => {
    expect(
      parseHolder(
        {
          name: "Museum One",
          aliases: ["Museum 1"],
          countryCode: "CL",
          visitUrl: "https://example.org/visit",
          location: {
            name: "Museum One",
            precision: "site",
            longitude: -70.123,
            latitude: -30.456,
            reference: "https://example.org/place",
          },
        },
        "museum-one.json",
      ),
    ).toMatchObject({
      id: "museum-one",
      name: "Museum One",
      countryCode: "CL",
      location: { longitude: -70.123 },
    });
    expect(
      parseLocation(
        {
          status: "uncertain",
          claimReferences: ["source-one/holder"],
          reviewedAt: "2026-09-01",
          note: {
            text: "The source may describe a former display location.",
            language: "en-GB",
          },
        },
        "object-one.json",
      ),
    ).toMatchObject({ id: "object-one", status: "uncertain" });
  });

  test("accepts a holder country without coordinates and an unknown country without a code", () => {
    expect(parseHolder({ name: "Museum", countryCode: "NZ" }, "museum.json")).toMatchObject({
      id: "museum",
      countryCode: "NZ",
    });
    expect(
      parseHolder({ name: "Private collection" }, "private-collection.json"),
    ).not.toHaveProperty("countryCode");
  });

  test.each(["cl", "ZZ", "CLA", "", null])(
    "rejects invalid holder country code %s",
    (countryCode) => {
      expect(() => parseHolder({ name: "Museum", countryCode }, "museum.json")).toThrow(
        "countryCode must be an ISO 3166-1 alpha-2 code",
      );
    },
  );

  test.each([
    [
      "unsafe visitor URL",
      () => parseHolder({ name: "Museum", visitUrl: "javascript:alert(1)" }, "museum.json"),
      "visitUrl must be an http(s) URL",
    ],
    [
      "holder alias duplicates",
      () => parseHolder({ name: "Museum", aliases: ["Museum", "Museum"] }, "museum.json"),
      "aliases contains duplicates",
    ],
    [
      "coordinate bounds",
      () =>
        parseHolder(
          {
            name: "Museum",
            location: {
              name: "Place",
              precision: "site",
              longitude: 181,
              latitude: 0,
              reference: "https://example.org/place",
            },
          },
          "museum.json",
        ),
      "longitude must be between",
    ],
    [
      "calendar date",
      () =>
        parseLocation(
          { status: "reported", claimReferences: [], reviewedAt: "2026-02-30" },
          "object-one.json",
        ),
      "reviewedAt must be a valid",
    ],
    [
      "unknown point",
      () =>
        parseLocation(
          {
            status: "unknown",
            claimReferences: [],
            location: {
              name: "Place",
              precision: "site",
              longitude: 0,
              latitude: 0,
              reference: "https://example.org/place",
            },
            reviewedAt: "2026-09-01",
          },
          "object-one.json",
        ),
      "unknown location cannot have a location",
    ],
    [
      "uncertain note",
      () =>
        parseLocation(
          {
            status: "uncertain",
            claimReferences: [],
            reviewedAt: "2026-09-01",
          },
          "object-one.json",
        ),
      "uncertain location requires a note",
    ],
  ])("rejects invalid location register data: %s", (_label, parse, expected) => {
    expect(parse).toThrow(expected);
  });

  test("accepts holderId only on held_by claims and resolves register references", () => {
    const { id: _id, ...record } = source;
    expect(() =>
      parseSource(
        {
          ...record,
          claims: [{ ...record.claims[0], holderId: "museum-one" }],
        },
        "source-one.json",
      ),
    ).toThrow("holderId is only allowed for held_by claims");
    const objectWithoutForegrounding = parseObject(
      { name: "Object one", foregroundedClaims: [] },
      "object-one.json",
    );
    const heldClaim = {
      id: "holder",
      objectId: "object-one",
      predicate: "held_by" as const,
      value: "Museum One",
      holderId: "museum-one",
    };
    const heldSource = parseSource(
      { ...record, claims: [heldClaim], images: [] },
      "source-one.json",
    );
    const holder = parseHolder(
      {
        name: "Museum One",
        location: {
          name: "Museum One",
          precision: "site",
          longitude: 0,
          latitude: 0,
          reference: "https://example.org/place",
        },
      },
      "museum-one.json",
    );
    expect(() =>
      validateCollection({
        objects: [objectWithoutForegrounding],
        sources: [heldSource],
        holders: [holder],
      }),
    ).not.toThrow();
    expect(() =>
      validateCollection({
        objects: [objectWithoutForegrounding],
        sources: [heldSource],
        holders: [],
      }),
    ).toThrow("holderId refers to missing holder museum-one");
  });

  test("checks location claim references belong to the assessed object", () => {
    const otherObject = parseObject(
      { name: "Object two", foregroundedClaims: [] },
      "object-two.json",
    );
    const location = parseLocation(
      {
        status: "reported",
        claimReferences: ["source-one/name"],
        reviewedAt: "2026-09-01",
      },
      "object-two.json",
    );
    expect(() =>
      validateCollection({
        objects: [object, otherObject],
        sources: [source],
        locations: [location],
      }),
    ).toThrow("claim source-one/name is about object-one");
  });

  test("requires a non-unknown assessment to select a location or resolved holder claim", () => {
    const emptyAssessment = parseLocation(
      { status: "reported", claimReferences: [], reviewedAt: "2026-09-01" },
      "object-one.json",
    );
    expect(() =>
      validateCollection({
        objects: [object],
        sources: [source],
        locations: [emptyAssessment],
      }),
    ).toThrow("must select a mapped location or resolved holder claim");
  });

  test("accepts an optional passage locator without changing claim wording", () => {
    const { id: _id, ...record } = source;
    const claim = { ...record.claims[0], locator: "Page 14, table 2, row 6" };
    const parsed = parseSource({ ...record, claims: [claim] }, "source-one.json");
    expect(parsed.claims[0]).toEqual(claim);
    expect(parseSource(record, "source-one.json").claims[0].locator).toBeUndefined();
  });

  test("accepts an optional claim language override and leaves it absent by default", () => {
    const { id: _id, ...record } = source;
    const claim = { ...record.claims[0], language: "en" };
    expect(parseSource({ ...record, claims: [claim] }, "source-one.json").claims[0]).toEqual(claim);
    expect(parseSource(record, "source-one.json").claims[0].language).toBeUndefined();
  });

  test.each([null, "", "  ", 14, "English", { language: "en" }])(
    "rejects malformed claim language overrides: %j",
    (claimLanguage) => {
      const { id: _id, ...record } = source;
      expect(() =>
        parseSource(
          {
            ...record,
            claims: [{ ...record.claims[0], language: claimLanguage }],
          },
          "source-one.json",
        ),
      ).toThrow("claims[0].language is invalid");
    },
  );

  test.each([null, "", "  ", 14, { page: 14 }, ["page 14"]])(
    "rejects malformed passage locators: %j",
    (locator) => {
      const { id: _id, ...record } = source;
      expect(() =>
        parseSource({ ...record, claims: [{ ...record.claims[0], locator }] }, "source-one.json"),
      ).toThrow("locator must be non-empty text");
    },
  );

  test("preserves source research notes with their own language without creating claims", () => {
    const { id: _id, ...record } = source;
    const notes = {
      text: "Blank cells repeat the preceding holder.",
      language: "en-GB",
    };
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
        file: "catalogue.pdf",
        originalUrl: "https://example.org/catalogue/123",
        archiveUrl:
          "https://web.archive.org/web/20240102123456id_/https://example.org/catalogue/123?record=42#details",
        capturedAt: "2024-01-02T12:34:56Z",
        method: "download",
        note: "Downloaded from the catalogue record.",
      },
      {
        archiveUrl:
          "https://web.archive.org/web/20240203102030if_/https://example.org/archived-page",
        capturedAt: null,
        method: "singlefile",
      },
    ];
    expect(parseSource({ ...record, captures }, "source-one.json").captures).toEqual(captures);
    expect(parseSource(record, "source-one.json").captures).toBeUndefined();
  });

  test("parses explicit image depiction scopes, including an empty list", () => {
    const { id: _id, ...record } = source;
    const image = { ...record.images[0], depicts: [] };
    const parsed = parseSource({ ...record, images: [image] }, "source-one.json");
    expect(parsed.images[0].depicts).toEqual([]);
    expect(parseSource(record, "source-one.json").images[0].depicts).toBeUndefined();
  });

  test.each([null, "object-one", ["bad id"], ["object-one", "object-one"]])(
    "rejects malformed image depiction lists: %j",
    (depicts) => {
      const { id: _id, ...record } = source;
      expect(() =>
        parseSource({ ...record, images: [{ ...record.images[0], depicts }] }, "source-one.json"),
      ).toThrow("images[0].depicts");
    },
  );

  test.each([
    { file: "../source-one/catalogue.pdf" },
    { file: "/source-one/catalogue.pdf" },
    { file: "source-one\\catalogue.pdf" },
    { file: "another-source/catalogue.pdf" },
    { file: "source-one/subdir/catalogue.pdf" },
    { file: "source-one/catalogue.exe" },
    {
      archiveUrl: "https://web.archive.org/web/20240102123456js_/https://example.org/page",
    },
    {
      archiveUrl: "http://web.archive.org/web/20240102123456/https://example.org/page",
    },
    {
      archiveUrl: "https://web.archive.org/web/20240230123456/https://example.org/page",
    },
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
              method: "download",
            },
          ],
        },
        "source-one.json",
      ),
    ).toThrow(/captures\[0\]\.(?:file|archiveUrl)/);
  });

  test.each([
    { capturedAt: "2024-02-30T12:00:00Z" },
    { capturedAt: "2024-03-01T12:00:00+00:00" },
    { capturedAt: null, method: "scan" },
    { capturedAt: null, method: "download", note: " " },
  ])("rejects invalid capture metadata: %j", (metadata) => {
    const { id: _id, ...record } = source;
    expect(() =>
      parseSource(
        {
          ...record,
          captures: [{ file: "capture.html", method: "download", ...metadata }],
        },
        "source-one.json",
      ),
    ).toThrow(/captures\[0\]/);
  });

  test("requires a capture file or archive URL and rejects duplicate capture references", () => {
    const { id: _id, ...record } = source;
    const base = {
      capturedAt: null,
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
            { ...base, file: "capture.html" },
            { ...base, file: "capture.html", note: "second record" },
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
              file: "capture.html",
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
        title: "Museum collection record",
        kind: "webpage",
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
      validateCollection({
        objects: [unforegroundedObject],
        sources: [linkedSource],
      }),
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
        title: "Another catalogue",
        kind: "publication",
        reference: "Another catalogue",
        language: "en-GB",
        claims: [
          {
            id: "name",
            objectId: "object-one",
            predicate: "has_name",
            value: "Other name",
          },
        ],
        images: [],
      },
      "source-two.json",
    );
    const data = validateCollection({
      objects: [object],
      sources: [source, otherSource],
    });
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

  test("rejects duplicate representations within one source", () => {
    expect(() =>
      validateCollection({
        objects: [object],
        sources: [{ ...source, images: [source.images[0], source.images[0]] }],
      }),
    ).toThrow("source-one.json: duplicate image file: object-one/front.jpg");
  });

  test("parses prose-only article metadata", () => {
    expect(
      parseArticleFrontmatter(
        "---\ntitle: A title\nsummary: A short introduction.\nauthor: null\nlanguage: rap\n---\n\nText.",
        "essay-one.md",
      ),
    ).toEqual({
      id: "essay-one",
      title: "A title",
      summary: "A short introduction.",
      author: null,
      language: "rap",
    });
  });

  test("parses YAML article subjects for objects and sources", () => {
    expect(
      parseArticleFrontmatter(
        [
          "---",
          "subjects:",
          "  - type: object",
          "    id: object-one",
          "  - type: source",
          "    id: source-one",
          "title: A title",
          "author: null",
          "language: en-GB",
          "---",
          "Text.",
        ].join("\n"),
        "essay-one.md",
      ).subjects,
    ).toEqual([
      { type: "object", id: "object-one" },
      { type: "source", id: "source-one" },
    ]);
  });

  test("validates source metadata and source-owned representations", () => {
    const unlinked = parseSource(
      {
        title: "A navigation title",
        kind: "other",
        author: null,
        reference: "An unidentified source",
        language: "en",
        date: "c. 1920",
        topics: ["museum-practices"],
        claims: [],
        images: [],
      },
      "source-two.json",
    );
    expect(unlinked).toMatchObject({
      title: "A navigation title",
      kind: "other",
      date: "c. 1920",
      topics: ["museum-practices"],
    });
    const { id: _id, ...record } = unlinked;
    expect(() => parseSource({ ...record, title: undefined }, "source-two.json")).toThrow(
      "title is required",
    );
    expect(() =>
      parseSource(
        {
          ...record,
          images: [
            {
              file: "source-two/scan.jpg",
              alt: "Letter scan",
              objectId: "object-one",
            },
          ],
        },
        "source-two.json",
      ),
    ).toThrow("unsupported field");
  });

  test("validates relationship targets and rejects duplicates, self-links and cycles", () => {
    const unforegroundedObject = parseObject(
      { name: "Object one", foregroundedClaims: [] },
      "object-one.json",
    );
    const sourceA = parseSource(
      {
        title: "Source A",
        kind: "publication",
        author: null,
        reference: "A",
        language: "en",
        claims: [],
        images: [],
        relationships: [{ type: "reproduces", target: { type: "source", id: "source-b" } }],
      },
      "source-a.json",
    );
    const sourceB = parseSource(
      {
        title: "Source B",
        kind: "photograph",
        author: null,
        reference: "B",
        language: "en",
        claims: [],
        images: [],
        relationships: [{ type: "depicts", target: { type: "object", id: "object-one" } }],
      },
      "source-b.json",
    );
    expect(() =>
      validateCollection({
        objects: [unforegroundedObject],
        sources: [sourceA, sourceB],
      }),
    ).not.toThrow();
    const reproduces = sourceA.relationships?.[0];
    if (!reproduces) throw Error("fixture relationship is missing");
    expect(() =>
      validateCollection({
        objects: [unforegroundedObject],
        sources: [{ ...sourceA, relationships: [reproduces, reproduces] }, sourceB],
      }),
    ).toThrow("duplicate relationship reproduces:source:source-b");
    expect(() =>
      validateCollection({
        objects: [unforegroundedObject],
        sources: [
          {
            ...sourceA,
            relationships: [{ type: "discusses", target: { type: "source", id: "source-a" } }],
          },
          sourceB,
        ],
      }),
    ).toThrow("cannot target itself");
    const partA = {
      ...sourceA,
      relationships: [
        {
          type: "is_part_of" as const,
          target: { type: "source" as const, id: "source-b" },
        },
      ],
    };
    const partB = {
      ...sourceB,
      relationships: [
        {
          type: "is_part_of" as const,
          target: { type: "source" as const, id: "source-a" },
        },
      ],
    };
    expect(() =>
      validateCollection({
        objects: [unforegroundedObject],
        sources: [partA, partB],
      }),
    ).toThrow("is_part_of relationships contain a cycle");

    const sourceC = parseSource(
      {
        title: "Source C",
        kind: "publication",
        author: null,
        reference: "C",
        language: "en",
        claims: [],
        images: [],
      },
      "source-c.json",
    );
    expect(() =>
      validateCollection({
        objects: [unforegroundedObject],
        sources: [
          {
            ...sourceA,
            relationships: [
              {
                type: "is_part_of",
                target: { type: "source", id: "source-b" },
              },
              {
                type: "is_part_of",
                target: { type: "source", id: "source-c" },
              },
            ],
          },
          partB,
          sourceC,
        ],
      }),
    ).toThrow("is_part_of relationships contain a cycle");
  });

  test("enforces relationship target types and resolves article subjects", () => {
    expect(() =>
      parseSource(
        {
          ...source,
          relationships: [{ type: "depicts", target: { type: "source", id: "source-two" } }],
        },
        "source-one.json",
      ),
    ).toThrow("depicts must target an object");
    const article = parseArticleFrontmatter(
      "---\nsubjects:\n  - type: source\n    id: missing\ntitle: Example catalogue\nauthor: null\nlanguage: en-GB\n---\n",
      "essay-one.md",
    );
    expect(() =>
      validateArticleSubjects(article, { objects: [object], sources: [source] }, "essay-one.md"),
    ).toThrow("refers to missing source missing");
  });

  test("requires exactly one linked publication source with matching article metadata", () => {
    const article = parseArticleFrontmatter(
      "---\ntitle: Example catalogue\nauthor: null\nlanguage: en-GB\n---\n",
      "essay-one.md",
    );
    const { id: _sourceId, ...sourceRecord } = source;
    const publication = parseSource({ ...sourceRecord, articleId: "essay-one" }, "source-one.json");
    expect(() =>
      validateArticlePublicationSource(article, [publication], "essay-one.md"),
    ).not.toThrow();
    expect(() =>
      validateArticlePublicationSource(
        { ...article, title: "Different title" },
        [publication],
        "essay-one.md",
      ),
    ).toThrow("article metadata must match publication source source-one");
    expect(() =>
      validateArticlePublicationSource(
        { ...article, author: "Different author" },
        [publication],
        "essay-one.md",
      ),
    ).toThrow("article metadata must match publication source source-one");
    expect(() =>
      validateArticlePublicationSource(
        { ...article, language: "es-CL" },
        [publication],
        "essay-one.md",
      ),
    ).toThrow("article metadata must match publication source source-one");
    expect(() => validateArticlePublicationSource(article, [], "essay-one.md")).toThrow(
      "expected exactly one publication source with articleId essay-one",
    );
  });

  test("requires one publication source per article", () => {
    const { id: _sourceId, ...sourceRecord } = source;
    const publication = parseSource({ ...sourceRecord, articleId: "essay-one" }, "source-one.json");
    const article = {
      id: "essay-one",
      title: "Example catalogue",
      author: null,
      language: "en-GB",
    };
    expect(() => validateUniqueSourceArticleLinks([publication], [article])).not.toThrow();
    expect(() =>
      validateUniqueSourceArticleLinks(
        [publication, { ...publication, id: "source-two" }],
        [article],
      ),
    ).toThrow(
      "article essay-one is assigned to multiple publication sources: source-one, source-two",
    );
    expect(() => validateUniqueSourceArticleLinks([publication], [])).toThrow(
      "source source-one refers to missing article essay-one",
    );
  });

  test("rejects relationships to missing records and redundant object links", () => {
    const missingObject = parseSource(
      {
        title: "Missing depiction",
        kind: "photograph",
        author: null,
        reference: "A photograph",
        language: "en",
        claims: [],
        images: [],
        relationships: [{ type: "depicts", target: { type: "object", id: "missing-object" } }],
      },
      "source-two.json",
    );
    expect(() => validateCollection({ objects: [object], sources: [missingObject] })).toThrow(
      "depicts refers to missing object missing-object",
    );

    const depicted = parseSource(
      {
        title: "Depicted object",
        kind: "photograph",
        author: null,
        reference: "A photograph",
        language: "en",
        objectIds: ["object-one"],
        claims: [],
        images: [],
        relationships: [{ type: "depicts", target: { type: "object", id: "object-one" } }],
      },
      "source-two.json",
    );
    const unforegroundedObject = parseObject(
      { name: "Object one", foregroundedClaims: [] },
      "object-one.json",
    );
    expect(() =>
      validateCollection({
        objects: [unforegroundedObject],
        sources: [depicted],
      }),
    ).toThrow("redundant objectId object-one");
  });

  test("validates image depiction targets against objects and source depicts links", () => {
    const { id: _id, ...record } = source;
    const objectTwo = parseObject(
      { name: "Object two", foregroundedClaims: [] },
      "object-two.json",
    );
    const relationship = {
      type: "depicts" as const,
      target: { type: "object" as const, id: "object-one" },
    };
    const scoped = parseSource(
      {
        ...record,
        relationships: [relationship],
        images: [{ ...record.images[0], depicts: ["object-one"] }],
      },
      "source-one.json",
    );
    expect(() =>
      validateCollection({ objects: [object, objectTwo], sources: [scoped] }),
    ).not.toThrow();

    expect(() =>
      validateCollection({
        objects: [object, objectTwo],
        sources: [
          {
            ...scoped,
            images: [{ ...scoped.images[0], depicts: ["missing-object"] }],
          },
        ],
      }),
    ).toThrow("images[0].depicts refers to missing object missing-object");

    expect(() =>
      validateCollection({
        objects: [object, objectTwo],
        sources: [
          {
            ...scoped,
            images: [{ ...scoped.images[0], depicts: ["object-two"] }],
          },
        ],
      }),
    ).toThrow("images[0].depicts object object-two is not depicted by the source");
  });
});
