import { describe, expect, it } from "vitest";
import type { ResearchBundle } from "./bundle.js";
import { type BundleDossier, placeholderIdentities, proposalPacket } from "./dossier-proposal.js";

const source = (key: string): ResearchBundle["sources"][number] => ({
  key,
  filename: `${key}.html`,
  citation: `Catalogue ${key}`,
  author: "",
  documentDate: "",
  url: `https://example.org/${key}`,
  retrievedAt: "2026-09-23T00:00:00Z",
  contentType: "text/html",
  sha256: "a".repeat(64),
  data: "",
});

const dossier = (key: string, sourceKey: string): BundleDossier => ({
  key,
  label: key,
  notes: "",
  objects: [{ key: `item:${key}` }],
  agents: [],
  places: [],
  events: [],
  restitutionCases: [],
  claims: [
    {
      key: `claim:${key}`,
      subject: `item:${key}`,
      predicate: "has_name",
      literal: { type: "text", value: key },
      evidence: {
        key: `evidence:${key}`,
        source: sourceKey,
        relationship: "supports",
        locator: "Title",
        excerpt: key,
      },
    },
  ],
});

const bundle: ResearchBundle = {
  schemaVersion: 2,
  id: "11111111-1111-4111-8111-111111111111",
  title: "Two catalogue records",
  preparedBy: "Test",
  method: "human",
  tool: "",
  notes: "",
  sources: [source("first"), source("second")],
  candidates: [],
  dossiers: [],
  leads: [],
};

describe("bundle dossier sources", () => {
  it("shows each reviewer only the source cited by that object's dossier", () => {
    const identities = placeholderIdentities(bundle);
    expect(
      proposalPacket(bundle, dossier("one", "first"), identities, "test").sources.map(
        (entry) => entry.key,
      ),
    ).toEqual(["first"]);
    expect(
      proposalPacket(bundle, dossier("two", "second"), identities, "test").sources.map(
        (entry) => entry.key,
      ),
    ).toEqual(["second"]);
  });

  it("keeps an additional source when it supports a catalogue identifier", () => {
    const withIdentifier = dossier("one", "first");
    withIdentifier.objects[0].externalIdentifiers = [
      { namespace: "test", value: "1", source: "second" },
    ];
    expect(
      proposalPacket(bundle, withIdentifier, placeholderIdentities(bundle), "test").sources.map(
        (entry) => entry.key,
      ),
    ).toEqual(["first", "second"]);
  });
});
