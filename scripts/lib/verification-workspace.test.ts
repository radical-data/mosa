import { mkdir, mkdtemp, readFile, realpath, rm, stat, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";
import { runCommand } from "./run-command";
import { withVerificationWorkspace } from "./verification-workspace";

it("isolates current source and workspace packages, excludes private files, and cleans up on failure", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "mosa-workspace-test-"));
  let copy = "";
  try {
    await runCommand("git", ["init", "--quiet", root]);
    for (const dir of [
      "packages/example",
      "research-local",
      "node_modules/@mosa",
      "dist",
      "supabase/.temp",
    ])
      await mkdir(path.join(root, dir), { recursive: true });
    await writeFile(path.join(root, "package.json"), "{}");
    await writeFile(path.join(root, "packages/example/package.json"), "{}");
    await writeFile(path.join(root, "source.ts"), "before");
    await runCommand("git", ["add", "source.ts"], { cwd: root });
    await writeFile(path.join(root, "source.ts"), "uncommitted");
    for (const file of [
      ".env",
      "research-local/private.txt",
      "dist/output",
      "supabase/.temp/project-ref",
    ])
      await writeFile(path.join(root, file), "private");
    await symlink(
      path.join(root, "packages/example"),
      path.join(root, "node_modules/@mosa/example"),
    );
    await expect(
      withVerificationWorkspace(root, async (workspace) => {
        copy = workspace;
        expect(await readFile(path.join(workspace, "source.ts"), "utf8")).toBe("uncommitted");
        expect(await realpath(path.join(workspace, "node_modules/@mosa/example"))).toBe(
          await realpath(path.join(workspace, "packages/example")),
        );
        for (const file of [".env", "research-local", "dist", "supabase/.temp"])
          expect(await stat(path.join(workspace, file)).catch(() => undefined)).toBeUndefined();
        await writeFile(path.join(workspace, "source.ts"), "changed in test");
        throw new Error("test failure");
      }),
    ).rejects.toThrow("test failure");
    expect(await readFile(path.join(root, "source.ts"), "utf8")).toBe("uncommitted");
    expect(await stat(copy).catch(() => undefined)).toBeUndefined();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

it("terminates a running command when verification is interrupted", async () => {
  const controller = new AbortController();
  const running = runCommand(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
    signal: controller.signal,
    captureOutput: true,
  });
  controller.abort();
  await expect(running).rejects.toThrow("Verification interrupted");
});
