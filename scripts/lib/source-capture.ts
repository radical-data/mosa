import { createHash } from "node:crypto";
import { lstat, mkdir, mkdtemp, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseSource, type SourceCapture } from "../../src/data/collection-model";
import { runCommand } from "./run-command";

const sourceIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const lfsPointer =
  /^version https:\/\/git-lfs\.github\.com\/spec\/v1\noid sha256:([a-f0-9]{64})\nsize (\d+)\n?$/;
export type CaptureMethod = SourceCapture["method"];
export interface CaptureDependencies {
  run?: typeof runCommand;
  now?: () => Date;
  platform?: NodeJS.Platform;
  exists?: (file: string) => Promise<boolean>;
  browserScript?: string;
}
const exists = async (file: string) =>
  lstat(file).then(
    () => true,
    () => false,
  );
const safeId = (id: string) => {
  if (!sourceIdPattern.test(id)) throw Error(`Invalid source ID: ${id}`);
};
const validUrl = (value: string | undefined, field: string) => {
  if (value === undefined) return;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw Error(`${field} must be a valid http(s) URL`);
  }
  if (!["http:", "https:"].includes(parsed.protocol))
    throw Error(`${field} must be a valid http(s) URL`);
};
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const isLfsPointer = (bytes: Buffer) => lfsPointer.exec(bytes.toString("utf8"));
const signatureExtension = (bytes: Buffer): string | undefined => {
  if (bytes.subarray(0, 5).toString() === "%PDF-") return ".pdf";
  if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return ".jpg";
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return ".png";
  if (bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP")
    return ".webp";
  if (
    bytes.subarray(4, 12).toString() === "ftypavif" ||
    bytes.subarray(4, 12).toString() === "ftypavis"
  )
    return ".avif";
  if (
    bytes.subarray(0, 4).equals(Buffer.from([0x49, 0x49, 0x2a, 0x00])) ||
    bytes.subarray(0, 4).equals(Buffer.from([0x4d, 0x4d, 0x00, 0x2a]))
  )
    return ".tif";
  const start = bytes
    .subarray(0, 4096)
    .toString("utf8")
    .replace(/^\uFEFF/, "")
    .trimStart();
  if (/^(?:<!doctype\s+html|<html\b|<head\b|<body\b)/i.test(start)) return ".html";
  return undefined;
};

async function findBrowser(platform = process.platform, env = process.env, hasBrowser = exists) {
  const override = env.MOSA_CAPTURE_BROWSER;
  if (override) return (await hasBrowser(override)) ? override : "";
  const candidates =
    platform === "darwin"
      ? [
          "/Applications/Chromium.app/Contents/MacOS/Chromium",
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
        ]
      : platform === "linux"
        ? [
            "/usr/bin/chromium",
            "/usr/bin/chromium-browser",
            "/usr/bin/google-chrome",
            "/usr/bin/google-chrome-stable",
          ]
        : [];
  for (const candidate of candidates) if (await hasBrowser(candidate)) return candidate;
  return "";
}

export async function doctor(root: string, dependencies: CaptureDependencies = {}) {
  const canRun = dependencies.run ?? runCommand;
  const browser = await findBrowser(
    dependencies.platform,
    process.env,
    dependencies.exists ?? exists,
  );
  const checks = {
    singleFile: false,
    browser: false,
    gitLfs: false,
    researchLocal: false,
  };
  const notes: string[] = [];
  try {
    await canRun("pnpm", ["exec", "single-file", "--version"], { cwd: root, captureOutput: true });
    checks.singleFile = true;
  } catch (error) {
    notes.push(`Install project dependencies so pnpm exec single-file works: ${String(error)}`);
  }
  if (browser) checks.browser = true;
  else
    notes.push(
      "Set MOSA_CAPTURE_BROWSER to a Chromium executable path, or install Chromium/Chrome in a recognised location.",
    );
  try {
    await canRun("git", ["lfs", "version"], { cwd: root, captureOutput: true });
    checks.gitLfs = true;
  } catch {
    notes.push("Install Git LFS to store and hydrate preserved capture files.");
  }
  const staging = path.join(root, "research-local", "source-captures");
  await mkdir(staging, { recursive: true });
  try {
    const probe = await mkdtemp(path.join(staging, ".doctor-"));
    await rm(probe, { recursive: true, force: true });
    checks.researchLocal = true;
  } catch {
    checks.researchLocal = false;
  }
  if (!checks.researchLocal)
    notes.push("Cannot create research-local/source-captures; check workspace permissions.");
  return {
    ok: Object.values(checks).every(Boolean),
    command: "doctor",
    checks,
    browser: browser || null,
    staging,
    notes,
  };
}

export async function captureSource(
  root: string,
  sourceId: string,
  url: string,
  waitMs = 0,
  dependencies: CaptureDependencies = {},
) {
  safeId(sourceId);
  const sourcePath = path.join(root, "collection", "sources", `${sourceId}.json`);
  parseSource(JSON.parse(await readFile(sourcePath, "utf8")), `${sourceId}.json`);
  validUrl(url, "--url");
  if (!Number.isInteger(waitMs) || waitMs < 0 || waitMs > 30_000)
    throw Error("--wait must be an integer from 0 to 30000 milliseconds");
  const canRun = dependencies.run ?? runCommand;
  const browser = await findBrowser(
    dependencies.platform,
    process.env,
    dependencies.exists ?? exists,
  );
  if (!browser)
    throw Error("No Chromium browser found. Set MOSA_CAPTURE_BROWSER to its executable path.");
  const staging = path.join(root, "research-local", "source-captures");
  await mkdir(staging, { recursive: true });
  const work = await mkdtemp(path.join(staging, `${sourceId}-`));
  const output = path.join(work, `${sourceId}.html`);
  const profile = path.join(work, "profile");
  await mkdir(profile, { recursive: true });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  try {
    const args = [
      "exec",
      "single-file",
      url,
      output,
      "--browser-executable-path",
      browser,
      "--browser-profile",
      profile,
      "--browser-wait-until",
      "networkIdle",
      "--browser-load-max-time",
      "45000",
      "--browser-capture-max-time",
      "45000",
      "--browser-wait-until-fallback",
      "true",
    ];
    if (waitMs) args.push("--browser-wait-delay", String(waitMs));
    if (dependencies.browserScript) args.push("--browser-script", dependencies.browserScript);
    await canRun("pnpm", args, { cwd: root, captureOutput: true, signal: controller.signal });
    const bytes = await readFile(output);
    if (signatureExtension(bytes) !== ".html")
      throw Error("SingleFile did not produce a recognisable HTML capture");
    const capturedAt = (dependencies.now?.() ?? new Date()).toISOString();
    const diagnostic = {
      ok: true,
      command: "capture",
      sourceId,
      originalUrl: url,
      capturedAt,
      method: "singlefile" satisfies CaptureMethod,
      ...(dependencies.browserScript
        ? {
            browserScript: path
              .relative(root, dependencies.browserScript)
              .split(path.sep)
              .join("/"),
          }
        : {}),
      file: path.relative(root, output).split(path.sep).join("/"),
      bytes: bytes.byteLength,
      sha256: hash(bytes),
      message: "Capture saved to private staging. Review it, then register it explicitly.",
    };
    await writeFile(path.join(work, "capture.json"), `${JSON.stringify(diagnostic, null, 2)}\n`);
    return diagnostic;
  } catch (error) {
    await rm(work, { recursive: true, force: true });
    throw error;
  } finally {
    clearTimeout(timeout);
    await rm(profile, { recursive: true, force: true });
  }
}

export interface RegisterCaptureOptions {
  file: string;
  method: CaptureMethod;
  capturedAt: string | null;
  originalUrl?: string;
  archiveUrl?: string;
  note?: string;
  name?: string;
}
const validFilename = (name: string) => {
  if (
    name !== path.basename(name) ||
    name === "." ||
    name === ".." ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:pdf|html|jpe?g|png|webp|avif|tiff?)$/.test(name)
  )
    throw Error("--name must be a plain filename without directories");
};
const safeContainedFile = async (root: string, target: string) => {
  const resolved = path.resolve(root, target);
  if (!resolved.startsWith(`${path.resolve(root)}${path.sep}`))
    throw Error("Capture path escapes the repository root");
  await ensureNoSymlinkComponents(root, resolved);
  const info = await lstat(resolved);
  if (!info.isFile()) throw Error("Capture input must be a regular file");
  return resolved;
};

const ensureNoSymlinkComponents = async (root: string, target: string) => {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, target);
  if (!resolved.startsWith(`${resolvedRoot}${path.sep}`) && resolved !== resolvedRoot)
    throw Error("Path escapes the repository root");
  let current = resolvedRoot;
  for (const part of path.relative(resolvedRoot, resolved).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    try {
      const info = await lstat(current);
      if (info.isSymbolicLink()) throw Error(`Symlink paths are not allowed: ${current}`);
      if (current !== resolved && !info.isDirectory())
        throw Error(`Expected directory: ${current}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") break;
      throw error;
    }
  }
};

export async function registerCapture(
  root: string,
  sourceId: string,
  options: RegisterCaptureOptions,
  dependencies: CaptureDependencies = {},
) {
  safeId(sourceId);
  const capturedAt = options.capturedAt;
  const sourcePath = path.join(root, "collection", "sources", `${sourceId}.json`);
  const sourceObject = JSON.parse(await readFile(sourcePath, "utf8")) as Record<string, unknown>;
  parseSource(sourceObject, `${sourceId}.json`);
  const inputPath = path.isAbsolute(options.file) ? options.file : path.resolve(root, options.file);
  const input = await safeContainedFile(root, inputPath);
  const bytes = await readFile(input);
  if (isLfsPointer(bytes))
    throw Error("Capture file is a Git LFS pointer; hydrate it before registering");
  const extension = signatureExtension(bytes);
  if (!extension) throw Error("Capture file has no recognised PDF, HTML or common image signature");
  let name = options.name;
  if (name) {
    validFilename(name);
    const requestedExtension = path.extname(name).toLowerCase();
    const aliases: Record<string, string[]> = {
      ".jpeg": [".jpg", ".jpeg"],
      ".jpg": [".jpg", ".jpeg"],
      ".tiff": [".tif", ".tiff"],
      ".tif": [".tif", ".tiff"],
    };
    if (requestedExtension !== extension && !aliases[extension]?.includes(requestedExtension))
      throw Error(`--name extension must match the file signature (${extension})`);
  } else {
    const timestamp = capturedAt ?? (dependencies.now?.() ?? new Date()).toISOString();
    name = `${timestamp.toLowerCase().replace(/[:.]/g, "-")}${extension}`;
  }
  const directory = path.join(root, "source-files", sourceId);
  await ensureNoSymlinkComponents(root, path.join("source-files", sourceId));
  const dest = path.join(directory, name);
  const relative = `${sourceId}/${name}`;
  const captures = Array.isArray(sourceObject.captures)
    ? (sourceObject.captures as SourceCapture[])
    : [];
  const digest = hash(bytes);
  let existingEntry: SourceCapture | undefined;
  for (const capture of captures) {
    if (!capture.file) continue;
    const old = path.resolve(root, "source-files", capture.file);
    if (!old.startsWith(`${path.resolve(root, "source-files")}${path.sep}`)) continue;
    await ensureNoSymlinkComponents(root, path.relative(root, old));
    const oldBytes = await readFile(old).catch(() => undefined);
    if (oldBytes && !isLfsPointer(oldBytes) && hash(oldBytes) === digest) {
      existingEntry = capture;
      break;
    }
  }
  const entry: SourceCapture = existingEntry ?? {
    file: relative,
    ...(options.originalUrl ? { originalUrl: options.originalUrl } : {}),
    ...(options.archiveUrl ? { archiveUrl: options.archiveUrl } : {}),
    capturedAt,
    method: options.method,
    ...(options.note ? { note: options.note } : {}),
  };
  const updated = existingEntry
    ? sourceObject
    : { ...sourceObject, captures: [...captures, entry] };
  const parsed = parseSource(updated, `${sourceId}.json`);
  const tmp = `${sourcePath}.${process.pid}.${Math.random().toString(16).slice(2)}.tmp`;
  let created = false;
  try {
    if (!existingEntry) {
      await mkdir(directory, { recursive: true });
      if (await exists(dest)) {
        await ensureNoSymlinkComponents(root, path.relative(root, dest));
        if ((await lstat(dest)).isSymbolicLink())
          throw Error(`Refusing to use symlink capture destination: ${relative}`);
        const existingBytes = await readFile(dest);
        if (hash(existingBytes) !== digest)
          throw Error(`Refusing to overwrite existing capture: ${relative}`);
      } else {
        await writeFile(dest, bytes, { flag: "wx" });
        created = true;
      }
      await writeFile(tmp, `${JSON.stringify(updated, null, 2)}\n`, { flag: "wx" });
      await rename(tmp, sourcePath);
    }
  } catch (error) {
    await rm(tmp, { force: true });
    if (created) await rm(dest, { force: true });
    throw error;
  }
  return {
    ok: true,
    command: "register",
    sourceId: parsed.id,
    capture: entry,
    reusedIdenticalFile: !created,
    alreadyRegistered: !!existingEntry,
    bytes: bytes.byteLength,
    sha256: digest,
    message: existingEntry
      ? "Byte-identical capture already registered for this source."
      : "Capture registered in source metadata.",
  };
}

const expectedLfs = async (root: string, sourceRelativePath: string, canRun: typeof runCommand) => {
  for (const ref of [":", "HEAD:"]) {
    try {
      const pointer = await canRun("git", ["show", `${ref}source-files/${sourceRelativePath}`], {
        cwd: root,
        captureOutput: true,
      });
      const parsed = lfsPointer.exec(`${pointer}\n`);
      if (parsed) return { oid: parsed[1], size: Number(parsed[2]) };
    } catch {
      // A new file can be absent from both the index and HEAD.
    }
  }
  return undefined;
};

export async function checkCaptures(
  root: string,
  includeContent = false,
  dependencies: CaptureDependencies = {},
) {
  const canRun = dependencies.run ?? runCommand;
  const sourcesDirectory = path.join(root, "collection", "sources");
  const files = (await readdir(sourcesDirectory)).filter((file) => file.endsWith(".json")).sort();
  const diagnostics: string[] = [];
  let captureCount = 0;
  for (const filename of files) {
    const source = parseSource(
      JSON.parse(await readFile(path.join(sourcesDirectory, filename), "utf8")),
      filename,
    );
    for (const [index, capture] of (source.captures ?? []).entries()) {
      captureCount++;
      if (!capture.file) continue;
      let target: string;
      try {
        await ensureNoSymlinkComponents(root, path.join("source-files", capture.file));
        target = await safeContainedFile(path.join(root, "source-files"), capture.file);
      } catch (error) {
        diagnostics.push(`${filename}: captures[${index}].file ${capture.file}: ${String(error)}`);
        continue;
      }
      const bytes = await readFile(target);
      const pointer = isLfsPointer(bytes);
      if (pointer) {
        if (!includeContent) continue;
        const lfs = await expectedLfs(root, capture.file, canRun);
        if (!lfs) {
          diagnostics.push(
            `${filename}: ${capture.file} is an LFS pointer but no matching pointer is available in the index or HEAD`,
          );
          continue;
        }
        if (pointer[1] !== lfs.oid || Number(pointer[2]) !== lfs.size) {
          diagnostics.push(
            `${filename}: ${capture.file} Git LFS pointer does not match the staged or HEAD pointer`,
          );
          continue;
        }
        diagnostics.push(
          `${filename}: ${capture.file} is not hydrated; expected sha256:${lfs.oid} (${lfs.size} bytes)`,
        );
        continue;
      }
      const ext = path.extname(capture.file).toLowerCase();
      const actual = signatureExtension(bytes);
      const extensionMatches =
        actual === ext ||
        (actual === ".jpg" && ext === ".jpeg") ||
        (actual === ".tif" && ext === ".tiff");
      if (!extensionMatches)
        diagnostics.push(
          `${filename}: ${capture.file} content signature does not match its extension or is unsupported`,
        );
      if (includeContent) {
        const expected = await expectedLfs(root, capture.file, canRun);
        if (expected && (hash(bytes) !== expected.oid || bytes.byteLength !== expected.size))
          diagnostics.push(
            `${filename}: ${capture.file} SHA-256 or size does not match its Git LFS pointer`,
          );
      }
    }
  }
  if (diagnostics.length) throw Error(diagnostics.join("\n"));
  return {
    ok: true,
    command: "check",
    sources: files.length,
    captures: captureCount,
    contentChecked: includeContent,
    message: `Validated capture metadata for ${files.length} sources and ${captureCount} captures${includeContent ? " including file content" : ""}.`,
  };
}
