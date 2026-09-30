import { lstat, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  type CaptureMethod,
  captureSource,
  checkCaptures,
  doctor,
  registerCapture,
} from "./lib/source-capture";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const commands = ["doctor", "capture", "register", "check"] as const;
type Command = (typeof commands)[number];

function parseArgs(argv: string[]) {
  const command = argv[0] as Command | undefined;
  if (!command || !commands.includes(command))
    throw Error(
      "Usage: node --import tsx scripts/source.ts doctor|capture [<source-id>] --url <url> [--wait <ms>] [--script <path>]|register <source-id> --file <path> --method <method> --captured-at <ISO|null> [--original-url URL] [--archive-url URL] [--note text] [--name original.pdf]|check [--content]",
    );
  const positional: string[] = [];
  const flags = new Map<string, string>();
  const booleans = new Set<string>();
  for (let index = 1; index < argv.length; index++) {
    const item = argv[index];
    if (!item.startsWith("--")) {
      positional.push(item);
      continue;
    }
    if (item === "--content") {
      booleans.add("content");
      continue;
    }
    const key = item.slice(2);
    if (!key || !argv[index + 1] || argv[index + 1].startsWith("--"))
      throw Error(`${item} requires a value`);
    if (flags.has(key)) throw Error(`${item} was supplied more than once`);
    flags.set(key, argv[++index]);
  }
  return { command, positional, flags, booleans };
}
const required = (flags: Map<string, string>, key: string) => {
  const value = flags.get(key);
  if (value === undefined || !value.trim()) throw Error(`--${key} is required`);
  return value;
};
const only = (flags: Map<string, string>, allowed: string[]) => {
  for (const key of flags.keys())
    if (!allowed.includes(key)) throw Error(`Unknown option --${key}`);
};

export async function runSourceCli(argv = process.argv.slice(2)) {
  const { command, positional, flags, booleans } = parseArgs(argv);
  let result: unknown;
  if (booleans.size && command !== "check") throw Error("--content is only valid with check");
  if (command === "doctor") {
    if (positional.length) throw Error("doctor takes no positional arguments");
    only(flags, []);
    result = await doctor(root);
  } else if (command === "capture") {
    only(flags, ["url", "wait", "script"]);
    if (positional.length > 1) throw Error("capture accepts at most one source ID");
    const wait = flags.has("wait") ? Number(required(flags, "wait")) : 0;
    let browserScript: string | undefined;
    if (flags.has("script")) {
      const requested = path.resolve(root, required(flags, "script"));
      if (!(await realpath(requested)).startsWith(`${await realpath(root)}${path.sep}`))
        throw Error("--script must be inside the repository root");
      const info = await lstat(requested);
      if (!info.isFile() || info.isSymbolicLink())
        throw Error("--script must be a regular file, not a symlink");
      browserScript = requested;
    }
    result = await captureSource(root, positional[0], required(flags, "url"), wait, {
      browserScript,
    });
  } else if (command === "register") {
    only(flags, ["file", "method", "captured-at", "original-url", "archive-url", "note", "name"]);
    if (positional.length !== 1) throw Error("register requires exactly one source ID");
    const method = required(flags, "method") as CaptureMethod;
    const capturedValue = required(flags, "captured-at");
    result = await registerCapture(root, positional[0], {
      file: required(flags, "file"),
      method,
      capturedAt: capturedValue === "null" ? null : capturedValue,
      ...(flags.has("original-url") ? { originalUrl: flags.get("original-url") } : {}),
      ...(flags.has("archive-url") ? { archiveUrl: flags.get("archive-url") } : {}),
      ...(flags.has("note") ? { note: flags.get("note") } : {}),
      ...(flags.has("name") ? { name: flags.get("name") } : {}),
    });
  } else {
    only(flags, []);
    if (positional.length) throw Error("check takes no positional arguments");
    result = await checkCaptures(root, booleans.has("content"));
  }
  return result;
}

const invoked =
  process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (invoked) {
  try {
    const result = await runSourceCli();
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (typeof result === "object" && result && "ok" in result && !(result as { ok: boolean }).ok)
      process.exitCode = 1;
  } catch (error) {
    process.stderr.write(
      `${JSON.stringify({ ok: false, error: String(error instanceof Error ? error.message : error) }, null, 2)}\n`,
    );
    process.exitCode = 1;
  }
}
