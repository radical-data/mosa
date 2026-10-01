import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runResearchCli } from "../research";
import {
  initialiseRegister,
  inspectRegister,
  parseBatch,
  readRegister,
  recordBatch,
  registerPath,
} from "./research-progress";

const roots: string[] = [];
const now = () => new Date("2026-09-30T12:00:00.000Z");
const deps = { now };

async function writeJson(root: string, relative: string, value: unknown) {
  const destination = path.join(root, relative);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, `${JSON.stringify(value, null, 2)}\n`);
}

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "mosa-research-portability-"));
  roots.push(root);
  await writeJson(root, "collection/sources/seed-source.json", {
    title: "Example collection",
    kind: "webpage",
    author: "Example Museum",
    reference: "https://museum.example/collection",
    language: "en-GB",
    objectIds: ["item-a"],
    claims: [],
    images: [],
  });
  await writeJson(root, "collection/objects/item-a.json", {
    name: "Item A",
    foregroundedClaims: [],
  });
  await mkdir(path.join(root, "research/campaigns"), { recursive: true });
  await writeFile(path.join(root, "research/campaigns/test.md"), "Reviewed evidence.\n");
  return root;
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

function batch(id: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    checkedAt: "2026-09-30",
    scope: "Example Museum catalogue search",
    searches: [],
    evidence: ["research/campaigns/test.md"],
    checks: [],
    commits: [],
    updates: [
      {
        objectId: "item-a",
        identity: {
          status: "pending",
          note: "No match was reviewed in this pass.",
          refs: [],
        },
      },
    ],
    ...extra,
  };
}

async function putLegacyRegister(root: string) {
  const register = await initialiseRegister(root, "seed-source", false, deps);
  const legacyPath = path.join(root, "research-local/progress/seed-source.json");
  await mkdir(path.dirname(legacyPath), { recursive: true });
  await writeFile(legacyPath, `${JSON.stringify(register, null, 2)}\n`);
  await rm(path.join(root, registerPath("seed-source")));
  return legacyPath;
}

describe("portable research registers", () => {
  it("writes shared registers and reads a legacy register with a warning while refusing mutation", async () => {
    const root = await fixture();
    const initial = await initialiseRegister(root, "seed-source", false, deps);
    expect(await readFile(path.join(root, registerPath("seed-source")), "utf8")).toContain(
      '"sourceId": "seed-source"',
    );
    expect(initial.revision).toBe(1);

    const legacyRoot = await fixture();
    const legacyPath = await putLegacyRegister(legacyRoot);
    const status = await inspectRegister(legacyRoot, "seed-source");
    expect(status.file).toBe("research-local/progress/seed-source.json");
    expect(status.warnings.join(" ")).toContain("read-only");
    expect((await runResearchCli(["check", "seed-source"], legacyRoot)).ok).toBe(true);
    await expect(initialiseRegister(legacyRoot, "seed-source", false, deps)).rejects.toThrow(
      "Legacy register is read-only",
    );
    await expect(initialiseRegister(legacyRoot, "seed-source", true, deps)).rejects.toThrow(
      "Legacy register is read-only",
    );
    await expect(
      recordBatch(legacyRoot, "seed-source", batch("legacy-write"), 1, deps),
    ).rejects.toThrow("Legacy register is read-only");
    expect(await readFile(legacyPath, "utf8")).toContain('"revision": 1');
  });

  it("prefers shared data and never hides a corrupt shared register behind legacy data", async () => {
    const root = await fixture();
    const shared = await initialiseRegister(root, "seed-source", false, deps);
    const legacyPath = path.join(root, "research-local/progress/seed-source.json");
    await mkdir(path.dirname(legacyPath), { recursive: true });
    await writeFile(legacyPath, JSON.stringify({ ...shared, revision: 99 }));
    expect((await inspectRegister(root, "seed-source")).revision).toBe(1);

    await writeFile(path.join(root, registerPath("seed-source")), "not json");
    await expect(inspectRegister(root, "seed-source")).rejects.toThrow();
  });

  it("accepts evidence limitations without affecting stage counts and rejects malformed values", async () => {
    const root = await fixture();
    await initialiseRegister(root, "seed-source", false, deps);
    const input = batch("limited-review", {
      evidenceLimitations: ["The museum search endpoint was unavailable."],
    });
    expect(parseBatch(input).evidenceLimitations).toEqual([
      "The museum search endpoint was unavailable.",
    ]);
    await recordBatch(root, "seed-source", input, 1, deps);
    const report = await inspectRegister(root, "seed-source");
    expect(report.evidenceLimitations).toEqual([
      { batchId: "limited-review", notes: ["The museum search endpoint was unavailable."] },
    ]);
    expect(report.summary.identity.pending).toBe(1);
    expect(report.active).toBe(1);

    for (const evidenceLimitations of ["text", ["", "why"], ["duplicate", "duplicate"], null]) {
      expect(() => parseBatch(batch("bad-limitations", { evidenceLimitations }))).toThrow();
    }
  });

  it("allows future batches to omit optional checks and commits and reads legacy commit references without Git history", async () => {
    const root = await fixture();
    await initialiseRegister(root, "seed-source", false, deps);
    const input = batch("lightweight-review");
    delete (input as { checks?: unknown }).checks;
    delete (input as { commits?: unknown }).commits;
    const withLegacyCommit = { ...batch("legacy-commit"), commits: ["0123456789ab"] };

    await recordBatch(root, "seed-source", input, 1, deps);
    const result = await recordBatch(root, "seed-source", withLegacyCommit, 2, deps);
    expect(result.batches[0].checks).toBeUndefined();
    expect(result.batches[0].commits).toBeUndefined();
    expect(result.batches[1].commits).toEqual(["0123456789ab"]);
    expect((await inspectRegister(root, "seed-source")).ok).toBe(true);
  });

  it("still requires real shared evidence and bars private evidence paths from shared batches", async () => {
    const root = await fixture();
    await initialiseRegister(root, "seed-source", false, deps);
    await expect(
      recordBatch(
        root,
        "seed-source",
        batch("missing-evidence", { evidence: ["research/campaigns/missing.md"] }),
        1,
        deps,
      ),
    ).rejects.toThrow();

    await mkdir(path.join(root, "research-local"), { recursive: true });
    await writeFile(path.join(root, "research-local/private.md"), "private evidence");
    await expect(
      recordBatch(
        root,
        "seed-source",
        batch("private-evidence", { evidence: ["research-local/private.md"] }),
        1,
        deps,
      ),
    ).rejects.toThrow("Shared evidence must use collection/, source-files/ or research/");
    expect((await readRegister(root, "seed-source")).revision).toBe(1);
  });

  it("accepts a Git LFS pointer as a tracked evidence reference in a fresh shared checkout", async () => {
    const root = await fixture();
    const pointerPath = path.join(root, "source-files/imported/page.pdf");
    await mkdir(path.dirname(pointerPath), { recursive: true });
    await writeFile(
      pointerPath,
      "version https://git-lfs.github.com/spec/v1\noid sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef\nsize 123\n",
    );
    await initialiseRegister(root, "seed-source", false, deps);
    const result = await recordBatch(
      root,
      "seed-source",
      batch("lfs-reference", { evidence: ["source-files/imported/page.pdf"] }),
      1,
      deps,
    );
    expect(result.revision).toBe(2);
    expect(await readFile(path.join(root, registerPath("seed-source")), "utf8")).toContain(
      "source-files/imported/page.pdf",
    );
  });

  it("checks every shared JSON register, reports malformed files, and ignores legacy-only data", async () => {
    const root = await fixture();
    const shared = await initialiseRegister(root, "seed-source", false, deps);
    await mkdir(path.join(root, "research/progress"), { recursive: true });
    await writeFile(path.join(root, "research/progress/bad-register.json"), "not json");
    await mkdir(path.join(root, "research-local/progress"), { recursive: true });
    await writeFile(
      path.join(root, "research-local/progress/legacy-only.json"),
      JSON.stringify({ ...shared, sourceId: "legacy-only" }),
    );

    const report = await runResearchCli(["check"], root);
    expect(report.ok).toBe(false);
    if (!("registers" in report)) throw new Error("Expected a shared-register report");
    expect(report.registers.map((item: { sourceId: string }) => item.sourceId)).toEqual([
      "bad-register",
      "seed-source",
    ]);
    expect(
      report.registers.find((item: { sourceId: string }) => item.sourceId === "bad-register")?.ok,
    ).toBe(false);

    const empty = await mkdtemp(path.join(os.tmpdir(), "mosa-research-empty-"));
    roots.push(empty);
    await mkdir(path.join(empty, "research-local/progress"), { recursive: true });
    await writeFile(path.join(empty, "research-local/progress/ignored.json"), "malformed");
    expect(await runResearchCli(["check"], empty)).toEqual({ ok: true, registers: [] });
  });
});
