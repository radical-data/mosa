import { copyFile, lstat, mkdir, mkdtemp, readdir, realpath, rm, symlink } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { runCommand } from "./run-command";

export async function repositoryFiles(root: string): Promise<string[]> {
  const output = await runCommand(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    {
      cwd: root,
      captureOutput: true,
    },
  );
  return [...new Set(output.split("\0").filter(Boolean))];
}

// Copy current source, including uncommitted work, but never local research,
// credentials, build output or Supabase's link/stack metadata.
export async function createVerificationWorkspace(root: string): Promise<string> {
  root = await realpath(root);
  const destination = await mkdtemp(path.join(tmpdir(), "mosa-verify-"));
  try {
    const files = await repositoryFiles(root);
    const manifests = new Set<string>();
    for (const file of files) {
      const parts = file.split("/");
      if (
        parts.some((part) =>
          [
            ".git",
            ".agents",
            ".codex",
            "node_modules",
            "dist",
            ".astro",
            ".temp",
            "research-local",
          ].includes(part),
        )
      )
        continue;
      if (
        parts.some(
          (part) => part === ".env" || (part.startsWith(".env.") && part !== ".env.example"),
        )
      )
        continue;
      const source = path.join(root, file);
      const stat = await lstat(source).catch((error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return undefined; // Uncommitted deletion.
        throw error;
      });
      if (!stat) continue;
      if (!stat.isFile()) throw new Error(`Verification source must be a regular file: ${file}`);
      const target = path.join(destination, file);
      await mkdir(path.dirname(target), { recursive: true });
      await copyFile(source, target);
      if (path.basename(file) === "package.json") manifests.add(path.dirname(file));
    }
    // Share installed third-party dependencies, but resolve workspace packages
    // to the copied source. Keep build caches inside the temporary workspace.
    const linkDependencies = async (relative: string): Promise<void> => {
      const source = path.join(root, relative);
      const entries = await readdir(source).catch((error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return [];
        throw error;
      });
      await mkdir(path.join(destination, relative), { recursive: true });
      for (const name of entries) {
        if ([".cache", ".vite", ".vite-temp"].includes(name)) continue;
        const entry = path.join(relative, name);
        if (name.startsWith("@")) {
          await linkDependencies(entry);
          continue;
        }
        const resolved = await realpath(path.join(root, entry));
        const local = path.relative(root, resolved);
        const target = manifests.has(local) ? path.join(destination, local) : resolved;
        await symlink(target, path.join(destination, entry));
      }
    };
    for (const directory of manifests) await linkDependencies(path.join(directory, "node_modules"));
    return destination;
  } catch (error) {
    await rm(destination, { recursive: true, force: true });
    throw error;
  }
}

export async function withVerificationWorkspace(
  root: string,
  verify: (workspace: string, signal: AbortSignal) => Promise<void>,
): Promise<void> {
  const controller = new AbortController();
  const interrupt = () => controller.abort();
  process.once("SIGINT", interrupt);
  process.once("SIGTERM", interrupt);
  let workspace: string | undefined;
  try {
    workspace = await createVerificationWorkspace(root);
    controller.signal.throwIfAborted();
    await verify(workspace, controller.signal);
  } finally {
    if (workspace) await rm(workspace, { recursive: true, force: true });
    process.removeListener("SIGINT", interrupt);
    process.removeListener("SIGTERM", interrupt);
  }
}

// The operating system selects an unused loopback port. If another process wins
// the subsequent bind, verification fails; it never falls back to a fixed port.
export async function availablePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Unable to allocate a test port");
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  return address.port;
}
