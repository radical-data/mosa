import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { captureSource, checkCaptures, registerCapture } from "./source-capture";

const roots: string[] = [];
const fixedNow = () => new Date("2026-09-29T20:30:00.000Z");
const source = {
  author: null,
  reference: "https://example.org/item",
  language: "en-GB",
  claims: [],
  images: [],
  notes: { text: "Retain this field.", language: "en-GB" },
};
async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "mosa-source-capture-"));
  roots.push(root);
  await mkdir(path.join(root, "collection", "sources"), { recursive: true });
  await writeFile(
    path.join(root, "collection", "sources", "example-source.json"),
    `${JSON.stringify(source, null, 2)}\n`,
  );
  return root;
}
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("source capture tooling", () => {
  it("registers verified bytes atomically and preserves unrelated source fields", async () => {
    const root = await fixture();
    const input = path.join(root, "supplied.html");
    await writeFile(input, "<!doctype html><html><body>Capture</body></html>");
    const result = await registerCapture(
      root,
      "example-source",
      {
        file: input,
        method: "supplied-file",
        capturedAt: "2026-09-29T20:30:00Z",
        originalUrl: "https://example.org/item",
        name: "catalogue-copy.html",
      },
      { now: fixedNow },
    );
    expect(result.ok).toBe(true);
    const updated = JSON.parse(
      await readFile(path.join(root, "collection", "sources", "example-source.json"), "utf8"),
    );
    expect(updated.notes).toEqual(source.notes);
    expect(updated.captures[0]).toMatchObject({
      file: "example-source/catalogue-copy.html",
      capturedAt: "2026-09-29T20:30:00Z",
      method: "supplied-file",
    });
    expect(updated.captures[0]).not.toHaveProperty("addedAt");
    expect(result.reusedIdenticalFile).toBe(false);
    expect(
      await readFile(
        path.join(root, "source-files", "example-source", "catalogue-copy.html"),
        "utf8",
      ),
    ).toContain("Capture");
    expect((await checkCaptures(root, true)).captures).toBe(1);
  });

  it("reuses identical bytes for a source without duplicating the metadata reference", async () => {
    const root = await fixture();
    const input = path.join(root, "capture.pdf");
    const pdf = Buffer.from("%PDF-1.7\nfixture\n");
    await writeFile(input, pdf);
    const options = {
      file: input,
      method: "supplied-file" as const,
      capturedAt: null,
      name: "record.pdf",
    };
    await registerCapture(root, "example-source", options, { now: fixedNow });
    const result = await registerCapture(root, "example-source", options, { now: fixedNow });
    expect(result.alreadyRegistered).toBe(true);
    const updated = JSON.parse(
      await readFile(path.join(root, "collection", "sources", "example-source.json"), "utf8"),
    );
    expect(updated.captures).toHaveLength(1);
    expect(await checkCaptures(root, true)).toMatchObject({ ok: true, captures: 1 });
  });

  it("rejects invalid signatures and symlinked captures without changing metadata", async () => {
    const root = await fixture();
    const bad = path.join(root, "bad.pdf");
    await writeFile(bad, "not a PDF");
    await expect(
      registerCapture(root, "example-source", {
        file: bad,
        method: "supplied-file",
        capturedAt: null,
      }),
    ).rejects.toThrow("recognised PDF, HTML or common image signature");
    const metadata = await readFile(
      path.join(root, "collection", "sources", "example-source.json"),
      "utf8",
    );
    expect(metadata).toContain("Retain this field.");
    await mkdir(path.join(root, "outside"));
    await symlink(path.join(root, "outside"), path.join(root, "source-files"));
    const good = path.join(root, "good.pdf");
    await writeFile(good, "%PDF-1.7\nfixture\n");
    await expect(
      registerCapture(root, "example-source", {
        file: good,
        method: "supplied-file",
        capturedAt: null,
      }),
    ).rejects.toThrow("Symlink paths are not allowed");
  });

  it("accepts TIFF and JPEG filename aliases and rejects symlinked destinations or registered files", async () => {
    const root = await fixture();
    const tiff = path.join(root, "scan.tif");
    await writeFile(tiff, Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00]));
    const tiffResult = await registerCapture(root, "example-source", {
      file: tiff,
      method: "supplied-file",
      capturedAt: null,
      name: "scan.tiff",
    });
    expect(tiffResult.reusedIdenticalFile).toBe(false);

    const jpeg = path.join(root, "photo.jpg");
    const jpegBytes = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
    await writeFile(jpeg, jpegBytes);
    await registerCapture(root, "example-source", {
      file: jpeg,
      method: "supplied-file",
      capturedAt: null,
      name: "photo.jpeg",
    });

    const outside = path.join(root, "outside.pdf");
    await writeFile(outside, "%PDF-1.7\nfixture\n");
    const sourcePath = path.join(root, "collection", "sources", "example-source.json");
    const updated = JSON.parse(await readFile(sourcePath, "utf8"));
    updated.captures.push({
      file: "example-source/linked.pdf",
      capturedAt: null,
      method: "supplied-file",
    });
    await writeFile(sourcePath, `${JSON.stringify(updated, null, 2)}\n`);
    await symlink(outside, path.join(root, "source-files", "example-source", "linked.pdf"));
    await expect(
      registerCapture(root, "example-source", {
        file: outside,
        method: "supplied-file",
        capturedAt: null,
        name: "fresh.pdf",
      }),
    ).rejects.toThrow("Symlink paths are not allowed");

    await rm(path.join(root, "source-files", "example-source", "linked.pdf"));
    updated.captures.pop();
    await writeFile(sourcePath, `${JSON.stringify(updated, null, 2)}\n`);
    await symlink(outside, path.join(root, "source-files", "example-source", "destination.pdf"));
    await expect(
      registerCapture(root, "example-source", {
        file: outside,
        method: "supplied-file",
        capturedAt: null,
        name: "destination.pdf",
      }),
    ).rejects.toThrow("Symlink paths are not allowed");
  });

  it("checks Git LFS pointer identity and hydrated content hashes", async () => {
    const root = await fixture();
    const bytes = Buffer.from("%PDF-1.7\nfixture\n");
    const oid = createHash("sha256").update(bytes).digest("hex");
    const expectedPointer = `version https://git-lfs.github.com/spec/v1\noid sha256:${oid}\nsize ${bytes.length}\n`;
    const run = async () => expectedPointer.trimEnd();
    await mkdir(path.join(root, "source-files", "example-source"), { recursive: true });
    const sourcePath = path.join(root, "collection", "sources", "example-source.json");
    const metadata = JSON.parse(await readFile(sourcePath, "utf8"));
    metadata.captures = [
      { file: "example-source/record.pdf", capturedAt: null, method: "supplied-file" },
    ];
    await writeFile(sourcePath, `${JSON.stringify(metadata, null, 2)}\n`);
    const pointerPath = path.join(root, "source-files", "example-source", "record.pdf");

    await writeFile(pointerPath, expectedPointer);
    expect(await checkCaptures(root, false, { run: run as never })).toMatchObject({ ok: true });
    await expect(checkCaptures(root, true, { run: run as never })).rejects.toThrow(
      "is not hydrated",
    );

    await writeFile(pointerPath, bytes);
    expect(await checkCaptures(root, true, { run: run as never })).toMatchObject({ ok: true });
    await writeFile(pointerPath, Buffer.from("%PDF-1.7\nchanged\n"));
    await expect(checkCaptures(root, true, { run: run as never })).rejects.toThrow(
      "SHA-256 or size",
    );

    const mismatched = `version https://git-lfs.github.com/spec/v1\noid sha256:${"a".repeat(64)}\nsize ${bytes.length}\n`;
    await writeFile(pointerPath, mismatched);
    await expect(checkCaptures(root, true, { run: run as never })).rejects.toThrow(
      "pointer does not match",
    );
  });

  it("captures with a bounded mocked SingleFile command and removes failed staging", async () => {
    const root = await fixture();
    const run = async (
      _executable: string,
      args: readonly string[],
      _options?: { cwd?: string },
    ) => {
      await writeFile(args[3], "<!doctype html><html><body>Saved</body></html>");
      return "";
    };
    const result = await captureSource(root, "example-source", "https://example.org/item", 3000, {
      run: run as never,
      exists: async () => true,
      now: fixedNow,
    });
    expect(result).toMatchObject({
      ok: true,
      method: "singlefile",
      originalUrl: "https://example.org/item",
    });
    expect(String(result.file)).toContain("research-local/source-captures/example-source-");
    await expect(
      captureSource(root, "example-source", "https://example.org/item", 0, {
        run: async () => {
          throw Error("single-file failed");
        },
        exists: async () => true,
      }),
    ).rejects.toThrow("single-file failed");
  });
});
