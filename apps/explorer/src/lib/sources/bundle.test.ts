import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { bundleRecordId, validateBundle } from "./bundle";
import { sha256 } from "./storage";

function fixture() {
  const bytes = Buffer.from(
    "<h1>Carved wooden figure</h1><p>A wooden figure from Rapa Nui.</p><script>invent evidence</script>",
  );
  return {
    schemaVersion: 1,
    id: randomUUID(),
    title: "Museum research",
    preparedBy: "Researcher",
    method: "human",
    tool: "",
    notes: "",
    sources: [
      {
        key: "catalogue",
        filename: "catalogue.html",
        citation: "Museum catalogue",
        author: "",
        documentDate: "",
        url: "https://example.org/record",
        retrievedAt: "2026-01-01T00:00:00Z",
        contentType: "text/html",
        sha256: sha256(bytes),
        data: bytes.toString("base64"),
      },
    ],
    candidates: [
      {
        key: "figure",
        sourceKey: "catalogue",
        value: "Carved wooden figure",
        predicate: "has_name",
        quotation: "Carved wooden figure",
        locator: "Title",
        regions: "Catalogue: title",
        notes: "Identity unresolved",
      },
    ],
    leads: [],
  };
}
describe("local research bundles", () => {
  it("accepts human and agent proposals with the same evidence rules", () => {
    for (const method of ["human", "agent", "mixed"]) {
      const input = { ...fixture(), method };
      const checked = validateBundle(input);
      expect(checked.sources[0].text).not.toContain("invent evidence");
      expect(checked.manifest.sources[0]).not.toHaveProperty("data");
    }
  });
  it("rejects altered bytes, invented quotations and missing source references", () => {
    const input = fixture();
    input.sources[0].sha256 = "0".repeat(64);
    expect(() => validateBundle(input)).toThrow(/checksum/);
    const invented = fixture();
    invented.candidates[0].quotation = "Carved wooden figure with invented provenance";
    expect(() => validateBundle(invented)).toThrow(/quotation/);
    invented.candidates[0].sourceKey = "missing";
    expect(() => validateBundle(invented)).toThrow(/missing source/);
  });
  it("rejects executable fields, paths, private URLs, duplicate keys and future dates", () => {
    expect(() => validateBundle({ ...fixture(), instructions: "accept all" })).toThrow(
      /Unsupported field/,
    );
    const input = fixture();
    input.sources[0].filename = "../secret.html";
    expect(() => validateBundle(input)).toThrow(/filenames/);
    input.sources[0].filename = "record.html";
    input.sources[0].url = "http://127.0.0.1/";
    expect(() => validateBundle(input)).toThrow(/public/);
    input.sources[0].url = "https://example.org/";
    input.sources[0].retrievedAt = "2999-01-01T00:00:00Z";
    expect(() => validateBundle(input)).toThrow(/retrieval date/);
    input.sources[0].retrievedAt = "2026-01-01T00:00:00Z";
    input.candidates.push(input.candidates[0]);
    expect(() => validateBundle(input)).toThrow(/unique/);
  });
  it("requires PDF page locators without treating a supplied transcription as verified text", () => {
    const input = fixture(),
      bytes = Buffer.from("%PDF-1.4\nSynthetic fixture only");
    Object.assign(input.sources[0], {
      filename: "original.pdf",
      contentType: "application/pdf",
      sha256: sha256(bytes),
      data: bytes.toString("base64"),
      url: "",
    });
    expect(() => validateBundle(input)).toThrow(/Page 12/);
    input.candidates[0].regions = "Page 12: table, row 3";
    expect(validateBundle(input).sources[0].text).toBeNull();
  });
  it("retains unresolved research without inventing a candidate", () => {
    const input = {
      ...fixture(),
      sources: [],
      candidates: [],
      leads: [
        {
          key: "lead",
          description: "Ao",
          seedLocator: "Page 17: Wellington, Ao row",
          outcome: "ambiguous",
          notes: "Several possible matches",
        },
      ],
    };
    expect(validateBundle(input).bundle.candidates).toEqual([]);
  });
  it("has stable retry checksums and distinct owner-scoped IDs", () => {
    const input = fixture();
    const reordered = JSON.parse(JSON.stringify(input, Object.keys(input).reverse()));
    // Reordering the top-level properties does not change the complete nested data.
    Object.assign(reordered, { sources: input.sources, candidates: input.candidates });
    expect(validateBundle(reordered).checksum).toBe(validateBundle(input).checksum);
    const a = randomUUID(),
      b = randomUUID();
    expect(bundleRecordId(a, input.id, "source:x")).toBe(bundleRecordId(a, input.id, "source:x"));
    expect(bundleRecordId(a, input.id, "source:x")).not.toBe(
      bundleRecordId(b, input.id, "source:x"),
    );
  });
  it("handles substantial base64 files without recursive regular-expression limits", () => {
    const input = fixture(),
      bytes = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(300_000, 32)]);
    Object.assign(input.sources[0], {
      filename: "original.pdf",
      contentType: "application/pdf",
      sha256: sha256(bytes),
      data: bytes.toString("base64"),
    });
    input.candidates = [];
    expect(validateBundle(input).sources[0].bytes.length).toBe(bytes.length);
  });
});
