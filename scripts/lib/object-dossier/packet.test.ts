import {
  canonicalJson,
  claimEvidenceList,
  derivedRefersToClaimKey,
  derivedRefersToEvidenceKey,
  type PacketClaim,
  packetSha256,
} from "@mosa/object-dossier/packet";
import { describe, expect, it } from "vitest";

describe("canonicalJson", () => {
  it("sorts object keys recursively", () => {
    const value = { b: 1, a: { d: 2, c: 3 } };
    expect(canonicalJson(value)).toBe('{"a":{"c":3,"d":2},"b":1}');
  });

  it("preserves array order", () => {
    expect(canonicalJson([2, 1])).toBe("[2,1]");
  });

  it("drops undefined object entries", () => {
    expect(canonicalJson({ a: 1, b: undefined })).toBe('{"a":1}');
  });
});

describe("packetSha256", () => {
  it("is stable when key order changes", () => {
    const first = { dataset: { key: "x", version: "1" }, schemaVersion: 1 };
    const second = { schemaVersion: 1, dataset: { version: "1", key: "x" } };

    expect(packetSha256(first)).toBe(packetSha256(second));
  });

  it("changes when content changes", () => {
    const first = { dataset: { key: "x", version: "1" } };
    const second = { dataset: { key: "x", version: "2" } };

    expect(packetSha256(first)).not.toBe(packetSha256(second));
  });

  it("changes when array order changes", () => {
    const first = { objects: [{ key: "a" }, { key: "b" }] };
    const second = { objects: [{ key: "b" }, { key: "a" }] };

    expect(packetSha256(first)).not.toBe(packetSha256(second));
  });

  it("produces a 64-character hex digest", () => {
    expect(packetSha256({})).toMatch(/^[0-9a-f]{64}$/u);
  });
});

describe("claimEvidenceList", () => {
  const base: Omit<PacketClaim, "evidence"> = {
    key: "claim:x",
    subject: "item:x",
    predicate: "has_name",
    literal: { type: "text", value: "X" },
  };

  const evidence = {
    key: "evidence:x",
    source: "source:x",
    relationship: "supports" as const,
    locator: "Field",
    excerpt: "X",
  };

  it("wraps a single evidence object in an array", () => {
    expect(claimEvidenceList({ ...base, evidence })).toEqual([evidence]);
  });

  it("returns evidence arrays unchanged", () => {
    expect(claimEvidenceList({ ...base, evidence: [evidence] })).toEqual([evidence]);
  });
});

describe("derived refers_to keys", () => {
  it("are distinct per source-object pair and per record type", () => {
    const claimKey = derivedRefersToClaimKey("source:a", "item:b");
    const evidenceKey = derivedRefersToEvidenceKey("source:a", "item:b");

    expect(claimKey).not.toBe(evidenceKey);
    expect(claimKey).not.toBe(derivedRefersToClaimKey("source:a", "item:c"));
  });
});
