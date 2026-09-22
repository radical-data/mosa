import { describe, expect, it } from "vitest";
import { packetFor, readContent } from "./model";

function form(extra: Record<string, string> = {}) {
  const f = new FormData();
  for (const [k, v] of Object.entries({
    url: "https://example.org/item",
    name: "A name",
    holder: "A museum",
    namespace: "museum",
    identifier: "100",
    nameLocator: "Title",
    nameExcerpt: "A name",
    holderLocator: "Collection",
    holderExcerpt: "A museum",
    holderNameLocator: "Publisher heading",
    holderNameExcerpt: "A museum",
    speakerMode: "holder",
    ...extra,
  }))
    f.set(k, v);
  return f;
}
describe("source-first compilation", () => {
  it("preserves attributed evidence but keeps working notes out of the packet", () => {
    const content = readContent(form({ note: "PRIVATE", label: "WORKING" }));
    const packet = packetFor("00000000-0000-4000-8000-000000000001", 2, content);
    expect(packet.claims[0].assertedBy).toBe("agent:holder");
    expect(JSON.stringify(packet)).not.toMatch(/PRIVATE|WORKING/);
    expect(packet.claims[0].evidence).toMatchObject({
      locator: "Title",
      excerpt: "A name",
      relationship: "supports",
    });
  });
  it("allows unknown attribution and qualifying evidence without inventing a speaker", () => {
    const packet = packetFor(
      "00000000-0000-4000-8000-000000000001",
      2,
      readContent(form({ speakerMode: "unknown", nameRelationship: "qualifies" })),
    );
    expect(packet.claims[0].assertedBy).toBeUndefined();
    expect(packet.claims[0].evidence).toMatchObject({ relationship: "qualifies" });
  });
  it("requires evidence before review and rejects unsafe source URLs", () => {
    expect(() =>
      packetFor("00000000-0000-4000-8000-000000000001", 1, readContent(form({ nameExcerpt: "" }))),
    ).toThrow(/Copy the source wording/);
    for (const url of [
      "javascript:alert(1)",
      "file:///private/doc",
      "https://user:password@example.org",
    ])
      expect(() => readContent(form({ url }))).toThrow();
  });
});

describe("catalogue research without forced conclusions", () => {
  const id = "00000000-0000-4000-8000-000000000001";
  it("keeps object types as classifications and copies a field once", () => {
    const c = readContent(
      form({
        nameBasis: "classified_as",
        name: "figure ('moai kavakava')",
        nameEvidenceMode: "field",
        nameLocator: "Object type",
        nameExcerpt: "STALE PASSAGE",
        interpretation: "PRIVATE INTERPRETATION",
      }),
    );
    const packet = packetFor(id, 2, c);
    expect(packet.schemaVersion).toBe(2);
    expect(packet.claims[0]).toMatchObject({
      predicate: "classified_as",
      literal: { value: "figure ('moai kavakava')" },
      evidence: { locator: "Catalogue field: Object type", excerpt: "figure ('moai kavakava')" },
    });
    expect(JSON.stringify(packet)).not.toMatch(/STALE PASSAGE|PRIVATE INTERPRETATION/);
  });
  it("can accept a description without inventing custody, an identifier or a speaker", () => {
    const c = readContent(
      form({
        nameBasis: "described_as",
        nameEvidenceMode: "whole",
        nameExcerpt: "",
        holderStatus: "unknown",
        holder: "",
        speakerMode: "unknown",
        identifier: "",
        namespace: "",
      }),
    );
    const packet = packetFor(id, 2, c);
    expect(packet.claims.map((c) => c.predicate)).toEqual(["described_as"]);
    expect(packet.claims[0].evidence).toMatchObject({ locator: "Whole catalogue record" });
    expect(packet.claims[0].evidence).not.toHaveProperty("excerpt");
    expect(packet.agents).toEqual([]);
    expect(packet.objects[0].externalIdentifiers).toEqual([]);
  });
  it("reuses whole-record or shared evidence without synthesising a quotation", () => {
    const packet = packetFor(
      id,
      2,
      readContent(form({ nameEvidenceMode: "whole", holderEvidenceMode: "shared" })),
    );
    expect(packet.claims[0].evidence).not.toHaveProperty("excerpt");
    expect(packet.claims[1].evidence).toMatchObject({ locator: "Whole catalogue record" });
    expect(packet.claims[2].evidence).toMatchObject({
      locator: "Publisher heading",
      excerpt: "A museum",
    });
  });
  it("never uses custody evidence as naming evidence", () => {
    expect(() =>
      packetFor(
        id,
        2,
        readContent(form({ holderNameExcerpt: "", holderExcerpt: "Not on display" })),
      ),
    ).toThrow(/names this institution/);
  });
  it("reuses a reviewed agent label without creating another naming claim", () => {
    const c = readContent(form({ holderNameExcerpt: "", holderNameLocator: "" }));
    c.holderNameEvidenceId = id;
    expect(packetFor(id, 2, c).claims.map((c) => c.key)).not.toContain("claim:holder-name");
    const f = form({ holderNameEvidenceId: id, holderNameExcerpt: "" });
    expect(readContent(f).holderNameEvidenceId).toBeUndefined();
    expect(() => packetFor(id, 2, readContent(f))).toThrow(/names this institution/);
  });
  it("chooses the identifier system independently of the holder", () => {
    const c = readContent(form({ catalogue: "british-museum", namespace: "British Museum" }));
    expect(c.namespace).toBe("british-museum");
    expect(c.holder).toBe("A museum");
    expect(() => readContent(form({ catalogue: "made-up" }))).toThrow(/catalogue/);
  });
  it("requires separate attribution when custody is unresolved", () => {
    expect(() =>
      packetFor(id, 2, readContent(form({ holderStatus: "unknown", speakerMode: "holder" }))),
    ).toThrow(/Custody is unresolved/);
  });
  it("ignores unused speaker fields", () => {
    const packet = packetFor(
      id,
      2,
      readContent(form({ speaker: "UNUSED", speakerLocator: "UNUSED", speakerExcerpt: "UNUSED" })),
    );
    expect(JSON.stringify(packet)).not.toContain("UNUSED");
  });
  it("updates the automatic check time when the source changes", () => {
    const old = readContent(form({ checkedAt: "2026-01-01T12:00" }));
    const next = readContent(
      form({ url: "https://example.org/another", checkedAt: "2026-01-01T12:00" }),
      old,
    );
    expect(next.checkedAt).not.toBe(old.checkedAt);
  });
});
