import { parseCollection } from "@mosa/public-collection";
import { describe, expect, it } from "vitest";
import { canonical, digest, parseSelection } from "./candidate";

const id = "11111111-1111-4111-8111-111111111111";
const statement = {
  text: "Haka Nonoŋa",
  language: "rap",
  attributedTo: "Test institution",
  sources: ["https://example.org/record"],
};
const fixture = {
  schemaVersion: 1,
  releaseId: id,
  records: [
    {
      id,
      name: statement,
      holder: { ...statement, text: "Test institution", language: "en" },
      identifier: {
        namespace: "test",
        label: "Test catalogue",
        value: "001",
        source: "https://example.org/record",
      },
    },
  ],
};
describe("public collection boundary", () => {
  it("preserves original spelling and permits an explicit empty release", () => {
    const record = parseCollection(fixture).records[0];
    expect("name" in record && record.name.text).toBe("Haka Nonoŋa");
    expect(parseCollection({ ...fixture, records: [] })).toEqual({ ...fixture, records: [] });
  });
  it("rejects private fields at every nesting level", () => {
    expect(() => parseCollection({ ...fixture, authority: "private" })).toThrow();
    expect(() =>
      parseCollection({ ...fixture, records: [{ ...fixture.records[0], notes: "private" }] }),
    ).toThrow();
    expect(() =>
      parseCollection({
        ...fixture,
        records: [{ ...fixture.records[0], name: { ...statement, excerpt: "private" } }],
      }),
    ).toThrow();
    expect(() =>
      parseCollection({
        ...fixture,
        records: [
          { ...fixture.records[0], identifier: { ...fixture.records[0].identifier, sourceId: id } },
        ],
      }),
    ).toThrow();
  });
  it("rejects unsafe links, unsupported versions and missing data", () => {
    for (const link of [
      "javascript:alert(1)",
      "file:///tmp/research",
      "https://user:password@example.org/",
    ])
      expect(() =>
        parseCollection({
          ...fixture,
          records: [{ ...fixture.records[0], name: { ...statement, sources: [link] } }],
        }),
      ).toThrow();
    expect(() => parseCollection(undefined)).toThrow();
    expect(() => parseCollection({ ...fixture, schemaVersion: 3 })).toThrow();
    expect(() =>
      parseCollection({ ...fixture, records: [fixture.records[0], fixture.records[0]] }),
    ).toThrow();
  });
  it("hashes content deterministically and requires explicit identity/evidence choices", () => {
    expect(digest({ a: 1, b: 2 })).toBe(digest({ b: 2, a: 1 }));
    expect(JSON.parse(canonical(fixture))).toEqual(fixture);
    expect(digest(fixture)).not.toBe(digest({ ...fixture, records: [] }));
    expect(() => parseSelection({ itemId: id })).toThrow();
  });
  it("accepts a sourced, incomplete dossier and rejects private or unsafe fields", () => {
    const dossier = {
      kind: "dossier",
      id: "33333333-3333-4333-8333-333333333333",
      label: "Stone figure",
      identifiers: [],
      claims: [
        {
          predicate: "described_as",
          subject: { key: "item:stone", kind: "item", label: "Stone figure" },
          value: { kind: "text", text: "Stone figure" },
          attributedTo: null,
          evidence: [
            {
              relationship: "supports",
              citation: "Original PDF, page 12",
              locator: "Page 12: row 3",
            },
          ],
        },
      ],
      events: [],
      cases: [],
    };
    const full = { schemaVersion: 2, releaseId: id, records: [fixture.records[0], dossier] };
    expect(parseCollection(full).records).toHaveLength(2);
    expect(() =>
      parseCollection({ ...full, records: [{ ...dossier, privateNote: "do not publish" }] }),
    ).toThrow();
    expect(() =>
      parseCollection({
        ...full,
        records: [
          {
            ...dossier,
            claims: [
              {
                ...dossier.claims[0],
                evidence: [{ ...dossier.claims[0].evidence[0], url: "file:///private.pdf" }],
              },
            ],
          },
        ],
      }),
    ).toThrow();
  });
});
