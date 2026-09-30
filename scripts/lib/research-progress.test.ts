import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runResearchCli } from "../research";
import {
  type Batch,
  initialiseRegister,
  inspectRegister,
  parseBatch,
  readRegister,
  recordBatch,
  registerPath,
} from "./research-progress";

const roots: string[] = [];
const now = () => new Date("2026-09-30T12:00:00.000Z");

async function writeJson(root: string, relative: string, value: unknown) {
  const destination = path.join(root, relative);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, `${JSON.stringify(value, null, 2)}\n`);
}

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "mosa-research-progress-"));
  roots.push(root);
  const seed = {
    author: "Example Museum",
    reference: "https://museum.example/collection",
    language: "en-GB",
    claims: [
      {
        id: "holder",
        objectId: "item-a",
        predicate: "held_by",
        value: "Example Museum",
      },
      {
        id: "catalogue",
        objectId: "item-a",
        predicate: "catalogue_number",
        value: "A-100",
      },
      {
        id: "classification",
        objectId: "item-a",
        predicate: "classified_as",
        value: "Carved figure",
      },
    ],
    images: [],
    captures: [
      {
        file: "page.html",
        capturedAt: "2026-09-30T11:00:00.000Z",
        method: "supplied-file",
      },
    ],
  };
  await writeJson(root, "collection/sources/seed-source.json", seed);
  await writeJson(root, "collection/objects/item-a.json", {
    name: "Item A",
    foregroundedClaims: [],
  });
  await writeJson(root, "collection/objects/item-b.json", {
    name: "Item B",
    foregroundedClaims: [],
  });
  await mkdir(path.join(root, "source-files/seed-source"), { recursive: true });
  await writeFile(
    path.join(root, "source-files/seed-source/page.html"),
    "<!doctype html><html><body>Evidence</body></html>",
  );
  await writeJson(root, "collection/sources/museum-record.json", {
    author: "Example Museum",
    reference: "https://museum.example/item-a",
    language: "en-GB",
    claims: [
      {
        id: "catalogue-number",
        objectId: "item-a",
        predicate: "catalogue_number",
        value: "A-100",
      },
    ],
    images: [],
  });
  await writeJson(root, "collection/sources/photo-record.json", {
    author: "Example Museum",
    reference: "https://museum.example/item-a/photo",
    language: "en-GB",
    claims: [],
    images: [
      {
        objectId: "item-a",
        file: "item-a/front.jpg",
        alt: "Front view of Item A",
        credit: "Example Museum",
        rights: "CC BY 4.0",
        originalUrl: "https://museum.example/item-a/photo",
      },
    ],
  });
  await mkdir(path.join(root, "collection/images/item-a"), { recursive: true });
  await writeFile(path.join(root, "collection/images/item-a/front.jpg"), "image fixture");
  await mkdir(path.join(root, "research/campaigns"), { recursive: true });
  await writeFile(path.join(root, "research/campaigns/test.md"), "Reviewed source evidence.\n");
  return root;
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

function batch(
  id: string,
  updates: Batch["updates"] = [
    {
      objectId: "item-a",
      identity: {
        status: "verified",
        note: "The accession number and image details agree.",
        refs: ["https://museum.example/item-a"],
      },
    },
  ],
) {
  return {
    id,
    checkedAt: "2026-09-30",
    scope: "Example Museum catalogue search",
    searches: [
      {
        url: "https://museum.example/search?q=A-100",
        query: "A-100",
        result: "One catalogue record found.",
      },
    ],
    evidence: ["research/campaigns/test.md"],
    checks: [{ command: "just collection-check", result: "passed" as const, note: "Passed." }],
    commits: [],
    updates,
  } satisfies Batch;
}

const deps = { now };

describe("museum research progress register", () => {
  it("initialises idempotently from deduplicated source-linked objects", async () => {
    const root = await fixture();
    const seed = JSON.parse(
      await readFile(path.join(root, "collection/sources/seed-source.json"), "utf8"),
    );
    seed.images = [
      {
        objectId: "item-a",
        file: "item-a/front.jpg",
        alt: "Front view",
      },
    ];
    seed.objectIds = ["item-a"];
    await writeJson(root, "collection/sources/seed-source.json", seed);

    const first = await initialiseRegister(root, "seed-source", false, deps);
    const second = await initialiseRegister(root, "seed-source", false, deps);

    expect(first.revision).toBe(1);
    expect(second.revision).toBe(1);
    expect(second.inventories).toHaveLength(1);
    expect(second.inventories[0].entries.map((entry) => entry.objectId)).toEqual(["item-a"]);
    expect(second.inventories[0].entries[0]).toMatchObject({
      holders: ["Example Museum"],
      catalogueNumbers: ["A-100"],
      descriptions: ["Carved figure"],
    });
  });

  it("keeps stage outcomes independent and makes identical batch retries idempotent", async () => {
    const root = await fixture();
    await initialiseRegister(root, "seed-source", false, deps);
    const input = batch("identity-review");

    const first = await recordBatch(root, "seed-source", input, 1, deps);
    const retry = await recordBatch(root, "seed-source", input, 1, deps);
    const status = await inspectRegister(root, "seed-source");

    expect(first.revision).toBe(2);
    expect(retry.revision).toBe(2);
    expect(retry.batches).toHaveLength(1);
    expect(status.queue[0].stages.identity.status).toBe("verified");
    expect(status.queue[0].stages.capture.status).toBe("pending");
    expect(status.queue[0].stages.claims.status).toBe("pending");
    expect(status.queue[0].stages.images.status).toBe("pending");

    const next = batch("capture-and-claims-review", [
      {
        objectId: "item-a",
        capture: {
          status: "complete",
          note: "The captured page is preserved.",
          refs: ["seed-source"],
        },
        claims: {
          status: "partial",
          note: "The catalogue identifier is recorded; description needs review.",
          refs: ["seed-source/catalogue"],
          nextAction: "Review the source description for object-specific claims.",
        },
      },
    ]);
    await recordBatch(root, "seed-source", next, 2, deps);
    const appended = await inspectRegister(root, "seed-source", { object: "item-a" });
    const stages = appended.queue[0].stages;
    expect(stages.identity.status).toBe("verified");
    expect(stages.identity.batchId).toBe("identity-review");
    expect(stages.capture.status).toBe("complete");
    expect(stages.capture.batchId).toBe("capture-and-claims-review");
    expect(stages.claims.status).toBe("partial");
    expect(stages.images.status).toBe("pending");

    const changed = batch("identity-review", [
      {
        objectId: "item-a",
        identity: {
          status: "ambiguous",
          note: "Conflicting evidence remains.",
          refs: ["https://museum.example/item-a"],
          nextAction: "Check the former catalogue number.",
        },
      },
    ]);
    await expect(recordBatch(root, "seed-source", changed, 1, deps)).rejects.toThrow(
      "Batch ID already used with different content",
    );
    expect((await readRegister(root, "seed-source")).revision).toBe(3);
  });

  it("rejects stale revisions and serialises concurrent writes without losing either history", async () => {
    const root = await fixture();
    await initialiseRegister(root, "seed-source", false, deps);
    await recordBatch(root, "seed-source", batch("first-review"), 1, deps);
    await expect(recordBatch(root, "seed-source", batch("stale-review"), 1, deps)).rejects.toThrow(
      "Revision conflict",
    );

    const lockPath = path.join(root, `${registerPath("seed-source")}.lock`);
    await mkdir(path.dirname(lockPath), { recursive: true });
    await writeFile(lockPath, "active writer");
    const before = await readFile(path.join(root, registerPath("seed-source")), "utf8");
    await expect(recordBatch(root, "seed-source", batch("locked-review"), 2, deps)).rejects.toThrow(
      "Register is locked",
    );
    expect(await readFile(path.join(root, registerPath("seed-source")), "utf8")).toBe(before);
    await rm(lockPath);

    const outcomes = await Promise.allSettled([
      recordBatch(root, "seed-source", batch("parallel-a"), 2, deps),
      recordBatch(root, "seed-source", batch("parallel-b"), 2, deps),
    ]);
    expect(outcomes.filter((outcome) => outcome.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome.status === "rejected")).toHaveLength(1);
    const loserIndex = outcomes.findIndex((outcome) => outcome.status === "rejected");
    const loserId = loserIndex === 0 ? "parallel-a" : "parallel-b";
    await recordBatch(root, "seed-source", batch(loserId), 3, deps);
    const saved = await readRegister(root, "seed-source");
    expect(saved.revision).toBe(4);
    expect(saved.batches.map((item) => item.id)).toEqual([
      "first-review",
      loserIndex === 0 ? "parallel-b" : "parallel-a",
      loserId,
    ]);
    expect(
      JSON.parse(await readFile(path.join(root, registerPath("seed-source")), "utf8")),
    ).toMatchObject({ revision: 4 });
  });

  it("reports seed drift, resets changed entries on sync, and retains history for inactive entries", async () => {
    const root = await fixture();
    await initialiseRegister(root, "seed-source", false, deps);
    await recordBatch(root, "seed-source", batch("initial-match"), 1, deps);

    const seedPath = path.join(root, "collection/sources/seed-source.json");
    const seed = JSON.parse(await readFile(seedPath, "utf8"));
    seed.claims.find((claim: { id: string }) => claim.id === "classification").value =
      "Carved ancestor figure";
    seed.claims.push({
      id: "holder-b",
      objectId: "item-b",
      predicate: "held_by",
      value: "Example Museum",
    });
    await writeJson(root, "collection/sources/seed-source.json", seed);

    const drifted = await inspectRegister(root, "seed-source");
    expect(drifted.ok).toBe(true);
    expect(drifted.needsReview).toBe(1);
    expect(drifted.queue[0].warnings.join(" ")).toContain("Seed source changed");
    expect(drifted.issues).toEqual([]);
    expect((await runResearchCli(["check"], root)).ok).toBe(true);
    const synced = await initialiseRegister(root, "seed-source", true, deps);
    expect(synced.revision).toBe(3);
    expect(synced.batches).toHaveLength(1);
    let status = await inspectRegister(root, "seed-source");
    expect(status.active).toBe(2);
    expect(status.queue.find((row) => row.objectId === "item-a")?.stages.identity.status).toBe(
      "pending",
    );
    expect(status.queue.find((row) => row.objectId === "item-b")?.stages.identity.status).toBe(
      "pending",
    );

    seed.claims = seed.claims.filter((claim: { objectId: string }) => claim.objectId !== "item-a");
    await writeJson(root, "collection/sources/seed-source.json", seed);
    const afterRemoval = await initialiseRegister(root, "seed-source", true, deps);
    status = await inspectRegister(root, "seed-source");
    expect(afterRemoval.batches).toHaveLength(1);
    expect(status.active).toBe(1);
    expect(status.inactive).toBe(1);
    expect(status.queue.map((row) => row.objectId)).toEqual(["item-b"]);
    const history = await runResearchCli(["status", "seed-source", "--object", "item-a"], root);
    expect("history" in history ? (history.history ?? []) : []).toHaveLength(1);
    expect("history" in history ? history.history?.[0].id : undefined).toBe("initial-match");
  });

  it("advises on promoted source drift and rejects missing or wrong-object claim references", async () => {
    const root = await fixture();
    await initialiseRegister(root, "seed-source", false, deps);
    const complete = batch("claim-review", [
      {
        objectId: "item-a",
        identity: {
          status: "verified",
          note: "The accession matches.",
          refs: ["https://museum.example/item-a"],
        },
        claims: {
          status: "complete",
          note: "The catalogue claim was reviewed.",
          refs: ["museum-record/catalogue-number"],
        },
      },
    ]);
    await recordBatch(root, "seed-source", complete, 1, deps);

    const museumPath = path.join(root, "collection/sources/museum-record.json");
    const museum = JSON.parse(await readFile(museumPath, "utf8"));
    museum.claims[0].value = "A-100 revised";
    await writeJson(root, "collection/sources/museum-record.json", museum);
    const status = await inspectRegister(root, "seed-source");
    expect(status.ok).toBe(true);
    expect(status.needsReview).toBe(1);
    expect(status.queue[0].warnings.join(" ")).toContain(
      "source museum-record changed since review",
    );
    expect(status.issues).toEqual([]);
    expect((await runResearchCli(["check"], root)).ok).toBe(true);

    museum.claims[0].objectId = "item-b";
    await writeJson(root, "collection/sources/museum-record.json", museum);
    await expect(
      recordBatch(
        root,
        "seed-source",
        batch("wrong-object-claim", [
          {
            objectId: "item-a",
            identity: {
              status: "verified",
              note: "The accession matches.",
              refs: ["https://museum.example/item-a"],
            },
            claims: {
              status: "complete",
              note: "A claim was reviewed.",
              refs: ["museum-record/catalogue-number"],
            },
          },
        ]),
        2,
        deps,
      ),
    ).rejects.toThrow("does not link object item-a");

    await expect(
      recordBatch(
        root,
        "seed-source",
        batch("missing-claim", [
          {
            objectId: "item-a",
            identity: {
              status: "verified",
              note: "The accession matches.",
              refs: ["https://museum.example/item-a"],
            },
            claims: {
              status: "complete",
              note: "A claim was reviewed.",
              refs: ["seed-source/missing-claim"],
            },
          },
        ]),
        2,
        deps,
      ),
    ).rejects.toThrow("Missing object-specific claim");
    expect((await readRegister(root, "seed-source")).revision).toBe(2);
    await recordBatch(root, "seed-source", batch("after-reference-failures"), 2, deps);
    expect((await readRegister(root, "seed-source")).batches.at(-1)?.id).toBe(
      "after-reference-failures",
    );
  });

  it("requires object-linked capture and credited, rights-described, present images before completion", async () => {
    const root = await fixture();
    await initialiseRegister(root, "seed-source", false, deps);
    const full = batch("all-stages", [
      {
        objectId: "item-a",
        identity: {
          status: "verified",
          note: "The catalogue number matches.",
          refs: ["https://museum.example/item-a"],
        },
        capture: {
          status: "complete",
          note: "The source page capture is preserved.",
          refs: ["seed-source"],
        },
        claims: {
          status: "complete",
          note: "The object-specific claim is reviewed.",
          refs: ["museum-record/catalogue-number"],
        },
        images: {
          status: "complete",
          note: "The image and reuse details are reviewed.",
          refs: ["photo-record/item-a/front.jpg"],
        },
      },
    ]);
    await recordBatch(root, "seed-source", full, 1, deps);
    const complete = await inspectRegister(root, "seed-source", { object: "item-a" });
    expect(complete.queue[0].complete).toBe(true);

    await rm(path.join(root, "collection/images/item-a/front.jpg"));
    await expect(
      recordBatch(root, "seed-source", batch("image-file-missing", full.updates), 2, deps),
    ).rejects.toThrow(/front\.jpg|ENOENT/);
    await writeFile(path.join(root, "collection/images/item-a/front.jpg"), "image fixture");

    const photoPath = path.join(root, "collection/sources/photo-record.json");
    const photo = JSON.parse(await readFile(photoPath, "utf8"));
    delete photo.images[0].rights;
    await writeJson(root, "collection/sources/photo-record.json", photo);
    await expect(
      recordBatch(root, "seed-source", batch("rights-missing", full.updates), 2, deps),
    ).rejects.toThrow("Image lacks rights or credit");
    photo.images[0].rights = "CC BY 4.0";
    delete photo.images[0].credit;
    await writeJson(root, "collection/sources/photo-record.json", photo);
    await expect(
      recordBatch(root, "seed-source", batch("credit-missing", full.updates), 2, deps),
    ).rejects.toThrow("Image lacks rights or credit");
    expect((await readRegister(root, "seed-source")).revision).toBe(2);
  });

  it("rejects symlinked evidence paths and releases the writer lock after validation fails", async () => {
    const root = await fixture();
    await initialiseRegister(root, "seed-source", false, deps);
    const linked = path.join(root, "research/campaigns/link.md");
    await symlink(path.join(root, "research/campaigns/test.md"), linked);
    const unsafe = { ...batch("unsafe-evidence"), evidence: ["research/campaigns/link.md"] };

    await expect(recordBatch(root, "seed-source", unsafe, 1, deps)).rejects.toThrow(
      "Symlink paths are not allowed",
    );
    expect((await readRegister(root, "seed-source")).revision).toBe(1);
    await rm(linked);
    await recordBatch(root, "seed-source", batch("valid-after-failure"), 1, deps);
    expect((await readRegister(root, "seed-source")).revision).toBe(2);
  });

  it("keeps historical failed checks visible as advisory review signals", async () => {
    const root = await fixture();
    await initialiseRegister(root, "seed-source", false, deps);
    const completedUpdates: Batch["updates"] = [
      {
        objectId: "item-a",
        identity: {
          status: "verified",
          note: "The catalogue number matches.",
          refs: ["https://museum.example/item-a"],
        },
        capture: {
          status: "complete",
          note: "The reviewed page capture is present.",
          refs: ["seed-source"],
        },
        claims: {
          status: "unavailable",
          note: "The reviewed record contains no additional object-specific claims.",
          refs: [],
        },
        images: {
          status: "unavailable",
          note: "No publishable image was available in the reviewed record.",
          refs: [],
        },
      },
    ];
    const failed = {
      ...batch("failed-check", completedUpdates),
      checks: [{ command: "just collection-check", result: "failed" as const, note: "Failed." }],
    };
    await recordBatch(root, "seed-source", failed, 1, deps);
    let report = await inspectRegister(root, "seed-source", { object: "item-a" });
    expect(report.ok).toBe(true);
    expect(report.queue[0].complete).toBe(true);
    expect(report.queue[0].warnings.join(" ")).toContain("failed");
    expect(report.needsReview).toBe(1);
    const allRegisters = await runResearchCli(["check"], root);
    expect(allRegisters.ok).toBe(true);
    if (!("registers" in allRegisters)) throw new Error("Expected a shared-register report");
    expect(allRegisters.registers[0]?.warnings?.join(" ")).toContain("failed");

    await recordBatch(
      root,
      "seed-source",
      {
        ...batch("passed-recheck", completedUpdates),
        checks: [{ command: "just collection-check", result: "passed", note: "Passed." }],
      },
      2,
      deps,
    );
    report = await inspectRegister(root, "seed-source", { object: "item-a" });
    expect(report.ok).toBe(true);
    expect(report.queue[0].complete).toBe(true);
    expect(report.queue[0].warnings).toEqual([]);
  });

  it("queues completed work for source drift without undoing its completion count", async () => {
    const root = await fixture();
    await initialiseRegister(root, "seed-source", false, deps);
    const completedUpdates: Batch["updates"] = [
      {
        objectId: "item-a",
        identity: {
          status: "verified",
          note: "The catalogue number matches.",
          refs: ["https://museum.example/item-a"],
        },
        capture: {
          status: "complete",
          note: "The reviewed page capture is present.",
          refs: ["seed-source"],
        },
        claims: {
          status: "unavailable",
          note: "The reviewed record contains no additional object-specific claims.",
          refs: [],
        },
        images: {
          status: "unavailable",
          note: "No publishable image was available in the reviewed record.",
          refs: [],
        },
      },
    ];
    await recordBatch(root, "seed-source", batch("finished-campaign", completedUpdates), 1, deps);

    const seedPath = path.join(root, "collection/sources/seed-source.json");
    const seed = JSON.parse(await readFile(seedPath, "utf8"));
    seed.claims[0].value = "Example Museum Collection";
    await writeJson(root, "collection/sources/seed-source.json", seed);

    const report = await inspectRegister(root, "seed-source");
    expect(report.ok).toBe(true);
    expect(report.completed).toBe(1);
    expect(report.needsReview).toBe(1);
    expect(report.queue).toHaveLength(1);
    expect(report.queue[0].complete).toBe(true);
    expect(report.queue[0].warnings.join(" ")).toContain("Seed source changed");
  });

  it("checks evidence files from superseded batches and clears drift when restored", async () => {
    const root = await fixture();
    await initialiseRegister(root, "seed-source", false, deps);
    const updates: Batch["updates"] = [
      {
        objectId: "item-a",
        identity: {
          status: "verified",
          note: "The catalogue number matches.",
          refs: ["https://museum.example/item-a"],
        },
        capture: {
          status: "complete",
          note: "The source capture is present.",
          refs: ["seed-source"],
        },
        claims: {
          status: "unavailable",
          note: "No additional object-specific claims were in scope.",
          refs: [],
        },
        images: {
          status: "unavailable",
          note: "No publishable image was available in scope.",
          refs: [],
        },
      },
    ];
    await recordBatch(root, "seed-source", batch("earlier-batch", updates), 1, deps);
    await writeFile(path.join(root, "research/campaigns/later.md"), "Later review.\n");
    await recordBatch(
      root,
      "seed-source",
      { ...batch("latest-batch", updates), evidence: ["research/campaigns/later.md"] },
      2,
      deps,
    );

    await rm(path.join(root, "research/campaigns/test.md"));
    let report = await inspectRegister(root, "seed-source");
    expect(report.ok).toBe(false);
    expect(report.issues.join(" ")).toContain("Batch earlier-batch");
    expect((await runResearchCli(["check"], root)).ok).toBe(false);
    await writeFile(path.join(root, "research/campaigns/test.md"), "Restored evidence.\n");
    report = await inspectRegister(root, "seed-source", { object: "item-a" });
    expect(report.ok).toBe(true);
    expect(report.queue[0].complete).toBe(true);
  });

  it("rejects unknown schema fields and stage statuses", async () => {
    const unknownField = batch("schema-field") as Batch & { extra?: string };
    unknownField.extra = "not permitted";
    expect(() => parseBatch(unknownField)).toThrow("unknown field extra");

    const unknownStatus = batch("schema-status");
    unknownStatus.updates[0] = {
      objectId: "item-a",
      identity: {
        status: "probably-verified",
        note: "The evidence is incomplete.",
        refs: ["https://museum.example/item-a"],
      },
    };
    expect(() => parseBatch(unknownStatus)).toThrow("identity: invalid status probably-verified");
  });

  it("supports status filters and rejects unknown CLI flags", async () => {
    const root = await fixture();
    await initialiseRegister(root, "seed-source", false, deps);
    await recordBatch(root, "seed-source", batch("cli-review"), 1, deps);

    const filtered = await runResearchCli(
      [
        "status",
        "seed-source",
        "--institution",
        "Example Museum",
        "--stage",
        "identity",
        "--status",
        "verified",
        "--object",
        "item-a",
        "--limit",
        "1",
      ],
      root,
    );
    expect("matching" in filtered ? filtered.matching : 0).toBe(1);
    expect("queue" in filtered ? filtered.queue : []).toHaveLength(1);
    expect("queue" in filtered ? filtered.queue[0].objectId : undefined).toBe("item-a");
    await expect(runResearchCli(["status", "seed-source", "--unknown", "x"], root)).rejects.toThrow(
      "Invalid option --unknown",
    );
  });
});
