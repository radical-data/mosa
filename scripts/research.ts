import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  initialiseRegister,
  inspectRegister,
  inspectSharedRegisters,
  recordBatch,
  type Stage,
  type StatusFilter,
  stages,
  statuses,
} from "./lib/research-progress";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const usage =
  "Usage: just research check (all shared registers) | just research init|sync|check|status <source-id> [--institution text] [--object id] [--stage identity|capture|claims|images] [--status value] [--limit N] | record <source-id> --file path --revision N";
export async function runResearchCli(argv = process.argv.slice(2), repositoryRoot = root) {
  if (argv.length === 1 && argv[0] === "check") return inspectSharedRegisters(repositoryRoot);
  const [command, sourceId, ...options] = argv;
  if (!["init", "sync", "check", "status", "record"].includes(command) || !sourceId)
    throw Error(usage);
  const allowed =
    command === "record"
      ? ["file", "revision"]
      : command === "status"
        ? ["institution", "object", "stage", "status", "limit"]
        : [];
  const flags = new Map<string, string>();
  for (let i = 0; i < options.length; i += 2) {
    const key = options[i].replace(/^--/, "");
    const value = options[i + 1];
    if (
      !options[i].startsWith("--") ||
      !allowed.includes(key) ||
      flags.has(key) ||
      !value ||
      value.startsWith("--")
    )
      throw Error(`Invalid option ${options[i]}. ${usage}`);
    flags.set(key, value);
  }
  if (command === "init" || command === "sync") {
    const result = await initialiseRegister(repositoryRoot, sourceId, command === "sync");
    return {
      ok: true,
      sourceId,
      revision: result.revision,
      active: result.inventories.at(-1)?.entries.length,
    };
  }
  if (command === "record") {
    const file = flags.get("file");
    const revision = flags.get("revision");
    if (!file || !revision || !/^[1-9]\d*$/.test(revision))
      throw Error("record requires --file and a positive integer --revision");
    const result = await recordBatch(
      repositoryRoot,
      sourceId,
      JSON.parse(await readFile(path.resolve(repositoryRoot, file), "utf8")),
      Number(revision),
    );
    return { ok: true, sourceId, revision: result.revision, batches: result.batches.length };
  }
  const filter: StatusFilter = {};
  for (const key of ["institution", "object", "status"] as const)
    if (flags.has(key)) filter[key] = flags.get(key);
  if (flags.has("stage")) {
    if (!stages.includes(flags.get("stage") as Stage)) throw Error("Invalid stage");
    filter.stage = flags.get("stage") as Stage;
  }
  if (
    filter.status &&
    !(filter.stage ? statuses[filter.stage] : Object.values(statuses).flat()).includes(
      filter.status,
    )
  )
    throw Error("Invalid status for selected stage");
  if (flags.has("limit")) {
    if (!/^\d+$/.test(flags.get("limit") ?? ""))
      throw Error("limit must be a non-negative integer");
    filter.limit = Number(flags.get("limit"));
  }
  if (command === "check") filter.limit = 0;
  return inspectRegister(repositoryRoot, sourceId, filter);
}
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    const result = await runResearchCli();
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (!result.ok) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(
      `${JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }, null, 2)}\n`,
    );
    process.exitCode = 1;
  }
}
