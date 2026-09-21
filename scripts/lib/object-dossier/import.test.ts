import { buildPacketWork, type ImportOutcome, type ImportPlan } from "@mosa/object-dossier/import";
import type { DossierPacket } from "@mosa/object-dossier/packet";
import type { ResolutionPlan } from "@mosa/object-dossier/resolve";
import { describe, expect, it } from "vitest";
import { formatOutcome } from "./report";

function samplePacket(): DossierPacket {
  return {
    schemaVersion: 1,
    dataset: { key: "test-dataset", version: "1" },
    objects: [{ key: "item:x", kind: "artefact" }],
    agents: [{ key: "agent:x", kind: "organisation" }],
    places: [{ key: "place:x", kind: "city" }],
    sources: [
      {
        key: "source:x",
        kind: "institutional_record",
        url: "https://example.org/record/1",
        retrievedAt: "2026-07-28T00:00:00Z",
        about: ["item:x"],
        assertedBy: "agent:x",
      },
    ],
    claims: [
      {
        key: "claim:x:name",
        subject: "item:x",
        predicate: "has_name",
        literal: { type: "text", value: "X" },
        assertedBy: "agent:x",
        evidence: [
          {
            key: "evidence:x:name",
            source: "source:x",
            relationship: "supports",
            locator: "Name field",
            excerpt: "X",
          },
          {
            key: "evidence:x:name:qualifier",
            source: "source:x",
            relationship: "qualifies",
            locator: "Name field",
            excerpt: "probably",
          },
        ],
      },
    ],
  };
}

describe("buildPacketWork", () => {
  it("derives refers_to claims from source about entries", () => {
    const work = buildPacketWork(samplePacket());
    const derived = work.claims.filter((claim) => claim.derived);

    expect(derived).toHaveLength(1);
    expect(derived[0]).toMatchObject({
      subjectKey: "source:x",
      predicate: "refers_to",
      objectKey: "item:x",
      assertedByKey: "agent:x",
    });
  });

  it("gives derived refers_to claims whole-document evidence from the source itself", () => {
    const work = buildPacketWork(samplePacket());
    const derivedClaim = work.claims.find((claim) => claim.derived);
    const derivedEvidence = work.evidence.find(
      (entry) => entry.claimLocalKey === derivedClaim?.localKey,
    );

    expect(derivedEvidence).toMatchObject({
      sourceKey: "source:x",
      relationship: "supports",
      locator: "Whole document",
    });
    expect(derivedEvidence?.excerpt).toBeUndefined();
  });

  it("flattens packet claims and their evidence arrays", () => {
    const work = buildPacketWork(samplePacket());

    expect(work.claims).toHaveLength(2);
    expect(work.evidence).toHaveLength(3);
    expect(work.evidence.filter((entry) => entry.claimLocalKey === "claim:x:name")).toHaveLength(2);
  });
});

describe("formatOutcome", () => {
  function samplePlan(): ImportPlan {
    const resolution: ResolutionPlan = {
      entities: new Map([
        ["item:x", { key: "item:x", kind: "object", action: "create" }],
        [
          "source:x",
          {
            key: "source:x",
            kind: "source",
            action: "matched",
            entityId: "00000000-0000-4000-8000-000000000001",
            detail: "matched by reference URL",
          },
        ],
      ]),
      errors: [],
      warnings: ["possible name match for item:x"],
    };

    return {
      sha256: "a".repeat(64),
      datasetKey: "test-dataset",
      packetVersion: "1",
      datasetId: null,
      alreadyImported: false,
      resolution,
      claims: [
        { localKey: "claim:x:name", action: "create" },
        { localKey: "derived:refers_to:source:x:item:x", action: "bound" },
      ],
      evidence: [{ localKey: "evidence:x:name", action: "create" }],
    };
  }

  it("summarises a dry run with counts, actions and warnings", () => {
    const outcome: ImportOutcome = {
      mode: "dry-run",
      plan: samplePlan(),
      applied: false,
      noop: false,
      created: { entities: 0, identifiers: 0, claims: 0, evidence: 0 },
    };

    const report = formatOutcome(outcome);

    expect(report).toContain("Dataset: test-dataset (packet version 1)");
    expect(report).toContain(`Packet checksum: sha256 ${"a".repeat(64)}`);
    expect(report).toContain("objects: 1 total — 1 to create, 0 matched existing, 0 already bound");
    expect(report).toContain("sources: 1 total — 0 to create, 1 matched existing, 0 already bound");
    expect(report).toContain(
      "claims: 2 total (including derived refers_to) — 1 to create, 1 already bound",
    );
    expect(report).toContain("possible name match for item:x");
    expect(report).toContain("Dry run only. Re-run with --apply to write these records.");
  });

  it("reports a no-op without suggesting --apply", () => {
    const outcome: ImportOutcome = {
      mode: "apply",
      plan: { ...samplePlan(), alreadyImported: true },
      applied: false,
      noop: true,
      created: { entities: 0, identifiers: 0, claims: 0, evidence: 0 },
    };

    const report = formatOutcome(outcome);

    expect(report).toContain("No-op");
    expect(report).not.toContain("--apply");
  });

  it("reports created counts after an applied import", () => {
    const outcome: ImportOutcome = {
      mode: "apply",
      plan: samplePlan(),
      applied: true,
      noop: false,
      runId: "run-1",
      created: { entities: 6, identifiers: 2, claims: 10, evidence: 11 },
    };

    const report = formatOutcome(outcome);

    expect(report).toContain(
      "Applied (run run-1): created 6 entities, 2 external identifiers, 10 claims, 11 evidence rows.",
    );
  });
});
