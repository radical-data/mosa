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
    ).toThrow(/Complete/);
    for (const url of [
      "javascript:alert(1)",
      "file:///private/doc",
      "https://user:password@example.org",
    ])
      expect(() => readContent(form({ url }))).toThrow();
  });
});
