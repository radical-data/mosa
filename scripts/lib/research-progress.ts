import { createHash, randomUUID } from "node:crypto";
import { lstat, mkdir, open, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseSource, type Source } from "../../src/data/collection-model";
import { runCommand } from "./run-command";

export const stages = ["identity", "capture", "claims", "images"] as const;
export type Stage = (typeof stages)[number];
export const statuses: Record<Stage, readonly string[]> = {
  identity: ["pending", "verified", "ambiguous", "not-found", "blocked", "deferred"],
  capture: ["pending", "complete", "partial", "blocked", "deferred"],
  claims: ["pending", "complete", "partial", "blocked", "deferred", "unavailable"],
  images: ["pending", "complete", "partial", "blocked", "deferred", "unavailable"],
};
export interface Outcome {
  status: string;
  note: string;
  refs: string[];
  nextAction?: string;
}
export type Update = { objectId: string } & Partial<Record<Stage, Outcome>>;
export interface Batch {
  id: string;
  checkedAt: string;
  scope: string;
  searches: { url: string; query: string; result: string }[];
  evidence: string[];
  evidenceLimitations?: string[];
  checks: { command: string; result: "passed" | "failed"; note: string }[];
  commits: string[];
  updates: Update[];
}
interface Entry {
  objectId: string;
  holders: string[];
  catalogueNumbers: string[];
  descriptions: string[];
}
interface Inventory {
  recordedAt: string;
  sourceHash: string;
  reference: string;
  entries: Entry[];
}
interface RecordedBatch extends Batch {
  recordedAt: string;
  inventory: number;
  sourceHashes: Record<string, string>;
}
export interface Register {
  version: 1;
  sourceId: string;
  revision: number;
  inventories: Inventory[];
  batches: RecordedBatch[];
}
interface Dependencies {
  now?: () => Date;
  run?: typeof runCommand;
}
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const hash = (value: unknown) => digest(JSON.stringify(value));
function requireThat(condition: unknown, message: string): asserts condition {
  if (!condition) throw Error(message);
}
function text(value: unknown, label: string): asserts value is string {
  requireThat(typeof value === "string" && value.trim(), `${label} must be non-empty text`);
}
function id(value: unknown) {
  text(value, "ID");
  requireThat(idPattern.test(value), `Invalid ID: ${value}`);
}
function record(
  value: unknown,
  keys: string[],
  label: string,
): asserts value is Record<string, unknown> {
  requireThat(
    value && typeof value === "object" && !Array.isArray(value),
    `${label} must be an object`,
  );
  for (const key of Object.keys(value))
    requireThat(keys.includes(key), `${label}: unknown field ${key}`);
}
function strings(value: unknown, label: string): asserts value is string[] {
  requireThat(Array.isArray(value), `${label} must be an array`);
  for (const item of value) text(item, label);
  requireThat(new Set(value).size === value.length, `${label} contains duplicates`);
}
function url(value: unknown) {
  text(value, "URL");
  const parsed = new URL(value);
  requireThat(
    ["http:", "https:"].includes(parsed.protocol) && !parsed.username && !parsed.password,
    "Expected an http(s) URL without credentials",
  );
}
function date(value: unknown) {
  text(value, "Date");
  requireThat(
    /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(value).toISOString().slice(0, 10) === value,
    "checkedAt must be a valid YYYY-MM-DD date",
  );
}
function timestamp(value: unknown) {
  text(value, "Timestamp");
  requireThat(new Date(value).toISOString() === value, "Expected an ISO UTC timestamp");
}
const batchKeys = [
  "id",
  "checkedAt",
  "scope",
  "searches",
  "evidence",
  "evidenceLimitations",
  "checks",
  "commits",
  "updates",
];
export function parseBatch(value: unknown): Batch {
  record(value, batchKeys, "batch");
  id(value.id);
  date(value.checkedAt);
  text(value.scope, "scope");
  strings(value.evidence, "evidence");
  if (value.evidenceLimitations !== undefined)
    strings(value.evidenceLimitations, "evidenceLimitations");
  requireThat(value.evidence.length, "A batch needs an evidence reference");
  strings(value.commits, "commits");
  for (const commit of value.commits)
    requireThat(/^[a-f0-9]{7,40}$/.test(commit), `Invalid commit: ${commit}`);
  requireThat(Array.isArray(value.searches), "searches must be an array");
  for (const search of value.searches) {
    record(search, ["url", "query", "result"], "search");
    url(search.url);
    text(search.query, "query");
    text(search.result, "result");
  }
  requireThat(Array.isArray(value.checks), "checks must be an array");
  for (const check of value.checks) {
    record(check, ["command", "result", "note"], "check");
    text(check.command, "command");
    text(check.note, "check note");
    requireThat(["passed", "failed"].includes(String(check.result)), "Invalid check result");
  }
  requireThat(Array.isArray(value.updates) && value.updates.length, "updates must be non-empty");
  const seen = new Set<string>();
  for (const update of value.updates) {
    record(update, ["objectId", ...stages], "update");
    id(update.objectId);
    const objectId = String(update.objectId);
    requireThat(!seen.has(objectId), `Duplicate object update: ${objectId}`);
    seen.add(objectId);
    requireThat(
      stages.some((stage) => update[stage]),
      `${objectId}: no stage supplied`,
    );
    for (const stage of stages) {
      const outcome = update[stage];
      if (outcome === undefined) continue;
      record(outcome, ["status", "note", "refs", "nextAction"], stage);
      requireThat(
        statuses[stage].includes(String(outcome.status)),
        `${stage}: invalid status ${outcome.status}`,
      );
      text(outcome.note, `${stage} note`);
      strings(outcome.refs, `${stage} refs`);
      if (outcome.nextAction !== undefined) text(outcome.nextAction, "nextAction");
      if (["verified", "complete", "partial"].includes(String(outcome.status)))
        requireThat(outcome.refs.length, `${stage}: ${outcome.status} requires refs`);
      if (
        ["ambiguous", "not-found", "partial", "blocked", "deferred"].includes(
          String(outcome.status),
        )
      )
        text(outcome.nextAction, `${stage} nextAction`);
      if (outcome.status === "not-found")
        requireThat(value.searches.length, "not-found needs recorded searches");
      if (stage === "identity") for (const ref of outcome.refs) url(ref);
    }
  }
  return value as unknown as Batch;
}

// Never follow symlinks into public paths or outside the checkout, including in a parent directory.
async function safePath(root: string, relative: string, missing = false) {
  requireThat(
    !path.isAbsolute(relative) && !relative.split(/[\\/]/).includes(".."),
    `Unsafe path: ${relative}`,
  );
  const resolved = path.resolve(root, relative);
  requireThat(resolved.startsWith(`${path.resolve(root)}${path.sep}`), `Unsafe path: ${relative}`);
  let cursor = path.resolve(root);
  for (const segment of path.relative(root, resolved).split(path.sep)) {
    cursor = path.join(cursor, segment);
    try {
      requireThat(
        !(await lstat(cursor)).isSymbolicLink(),
        `Symlink paths are not allowed: ${cursor}`,
      );
    } catch (error) {
      if (missing && (error as NodeJS.ErrnoException).code === "ENOENT") continue;
      throw error;
    }
  }
  return resolved;
}
async function file(root: string, relative: string) {
  const resolved = await safePath(root, relative);
  requireThat((await lstat(resolved)).isFile(), `Expected a file: ${relative}`);
  return resolved;
}
export function registerPath(sourceId: string) {
  id(sourceId);
  return `research/progress/${sourceId}.json`;
}
function legacyRegisterPath(sourceId: string) {
  id(sourceId);
  return `research-local/progress/${sourceId}.json`;
}
async function exists(root: string, relative: string) {
  try {
    await file(root, relative);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}
async function registerLocation(root: string, sourceId: string) {
  const shared = registerPath(sourceId);
  if (await exists(root, shared)) return shared;
  return legacyRegisterPath(sourceId);
}
async function source(root: string, sourceId: string) {
  id(sourceId);
  const raw = await readFile(await file(root, `collection/sources/${sourceId}.json`), "utf8");
  return { value: parseSource(JSON.parse(raw), `${sourceId}.json`), hash: hash(JSON.parse(raw)) };
}
function linked(s: Source, objectId: string) {
  return (
    s.objectIds?.includes(objectId) ||
    s.claims.some((c) => c.objectId === objectId) ||
    s.images.some((i) => i.objectId === objectId)
  );
}
async function inventory(root: string, sourceId: string, now: string): Promise<Inventory> {
  const s = await source(root, sourceId);
  const objectIds = [
    ...new Set([
      ...(s.value.objectIds ?? []),
      ...s.value.claims.map((c) => c.objectId),
      ...s.value.images.map((i) => i.objectId),
    ]),
  ].sort();
  const entries = [];
  for (const objectId of objectIds) {
    await file(root, `collection/objects/${objectId}.json`);
    const values = (predicates: string[]) =>
      [
        ...new Set(
          s.value.claims
            .filter((c) => c.objectId === objectId && predicates.includes(c.predicate))
            .map((c) => c.value),
        ),
      ].sort();
    entries.push({
      objectId,
      holders: values(["held_by"]),
      catalogueNumbers: values(["catalogue_number"]),
      descriptions: values(["has_name", "classified_as"]),
    });
  }
  return { recordedAt: now, sourceHash: s.hash, reference: s.value.reference, entries };
}
export function parseRegister(value: unknown): Register {
  record(value, ["version", "sourceId", "revision", "inventories", "batches"], "register");
  requireThat(value.version === 1, "Unsupported register version");
  id(value.sourceId);
  requireThat(Number.isInteger(value.revision) && Number(value.revision) >= 1, "Invalid revision");
  requireThat(Array.isArray(value.inventories) && value.inventories.length, "Missing inventories");
  for (const inv of value.inventories) {
    record(inv, ["recordedAt", "sourceHash", "reference", "entries"], "inventory");
    timestamp(inv.recordedAt);
    requireThat(
      typeof inv.sourceHash === "string" && /^[a-f0-9]{64}$/.test(inv.sourceHash),
      "Invalid source hash",
    );
    text(inv.reference, "reference");
    requireThat(Array.isArray(inv.entries), "Invalid entries");
    const seen = new Set<string>();
    for (const entry of inv.entries) {
      record(entry, ["objectId", "holders", "catalogueNumbers", "descriptions"], "entry");
      id(entry.objectId);
      const entryId = String(entry.objectId);
      requireThat(!seen.has(entryId), `Duplicate entry: ${entryId}`);
      seen.add(entryId);
      for (const key of ["holders", "catalogueNumbers", "descriptions"]) strings(entry[key], key);
    }
  }
  requireThat(Array.isArray(value.batches), "Missing batches");
  const seen = new Set<string>();
  for (const batch of value.batches) {
    record(batch, [...batchKeys, "recordedAt", "inventory", "sourceHashes"], "recorded batch");
    const { recordedAt, inventory: index, sourceHashes, ...input } = batch;
    const parsed = parseBatch(input);
    timestamp(recordedAt);
    requireThat(
      Number.isInteger(index) && Number(index) >= 0 && Number(index) < value.inventories.length,
      "Invalid inventory index",
    );
    const entries = (value.inventories[Number(index)] as Inventory).entries;
    for (const update of parsed.updates)
      requireThat(
        entries.some((e) => e.objectId === update.objectId),
        `Batch object absent from inventory: ${update.objectId}`,
      );
    requireThat(!seen.has(parsed.id), `Duplicate batch: ${parsed.id}`);
    seen.add(parsed.id);
    requireThat(
      sourceHashes && typeof sourceHashes === "object" && !Array.isArray(sourceHashes),
      "Invalid sourceHashes",
    );
    for (const [key, h] of Object.entries(sourceHashes)) {
      id(key);
      requireThat(typeof h === "string" && /^[a-f0-9]{64}$/.test(h), "Invalid source hash");
    }
  }
  requireThat(
    value.revision === value.inventories.length + value.batches.length,
    "Revision/history mismatch",
  );
  return value as unknown as Register;
}
export async function readRegister(root: string, sourceId: string) {
  const r = parseRegister(
    JSON.parse(await readFile(await file(root, await registerLocation(root, sourceId)), "utf8")),
  );
  requireThat(r.sourceId === sourceId, "Register source ID mismatch");
  return r;
}
function plainBatch(batch: RecordedBatch): Batch {
  const { recordedAt: _time, inventory: _index, sourceHashes: _hashes, ...input } = batch;
  return input;
}
const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(",")}}`;
  return JSON.stringify(value);
};
export function currentEntries(r: Register) {
  const latest = r.inventories.at(-1) as Inventory;
  return latest.entries.map((entry) => {
    const outcomes: Partial<Record<Stage, { outcome: Outcome; batch: RecordedBatch }>> = {};
    // Ignore decisions before the latest membership/identity metadata change, retaining their history.
    let since = r.inventories.length - 1;
    while (
      since > 0 &&
      hash(r.inventories[since - 1].entries.find((e) => e.objectId === entry.objectId) ?? null) ===
        hash(entry)
    )
      since--;
    for (const batch of r.batches) {
      if (batch.inventory < since) continue;
      const update = batch.updates.find((u) => u.objectId === entry.objectId);
      if (!update) continue;
      for (const stage of stages)
        if (update[stage]) outcomes[stage] = { outcome: update[stage], batch };
    }
    return { ...entry, outcomes };
  });
}
async function validateRefs(root: string, objectId: string, stage: Stage, outcome: Outcome) {
  const hashes: Record<string, string> = {};
  for (const ref of outcome.refs) {
    if (stage === "identity") {
      url(ref);
      continue;
    }
    const slash = ref.indexOf("/");
    const sourceId = stage === "capture" ? ref : ref.slice(0, slash);
    requireThat(stage === "capture" || slash > 0, `Invalid ${stage} reference: ${ref}`);
    const s = await source(root, sourceId);
    requireThat(linked(s.value, objectId), `${ref} does not link object ${objectId}`);
    hashes[sourceId] = s.hash;
    if (stage === "capture") {
      requireThat(s.value.captures?.length, `${ref} has no registered capture`);
      for (const capture of s.value.captures)
        if (capture.file) await file(root, `source-files/${sourceId}/${capture.file}`);
    } else if (stage === "claims") {
      requireThat(
        s.value.claims.some((c) => c.id === ref.slice(slash + 1) && c.objectId === objectId),
        `Missing object-specific claim: ${ref}`,
      );
    } else {
      const image = s.value.images.find(
        (i) => i.file === ref.slice(slash + 1) && i.objectId === objectId,
      );
      requireThat(image, `Missing object-specific image: ${ref}`);
      requireThat(image.rights && image.credit, `Image lacks rights or credit: ${ref}`);
      await file(root, `collection/images/${image.file}`);
    }
  }
  return hashes;
}
async function validateEvidence(root: string, batch: Batch, deps: Dependencies, shared = true) {
  for (const ref of batch.evidence) {
    if (/^https?:\/\//.test(ref)) url(ref);
    else {
      if (shared)
        requireThat(
          /^(collection|source-files|research)\//.test(ref),
          `Shared evidence must use collection/, source-files/ or research/: ${ref}. Share reviewed evidence or describe its absence in evidenceLimitations.`,
        );
      await file(root, ref);
    }
  }
  for (const commit of batch.commits)
    await (deps.run ?? runCommand)("git", ["rev-parse", "--verify", `${commit}^{commit}`], {
      cwd: root,
      captureOutput: true,
    });
}
async function mutate(root: string, sourceId: string, action: () => Promise<Register>) {
  requireThat(
    (await exists(root, registerPath(sourceId))) ||
      !(await exists(root, legacyRegisterPath(sourceId))),
    `Legacy register is read-only: ${legacyRegisterPath(sourceId)}. Migrate reviewed evidence and the register to ${registerPath(sourceId)} before writing.`,
  );
  const destination = await safePath(root, registerPath(sourceId), true);
  await mkdir(path.dirname(destination), { recursive: true });
  const lockPath = `${destination}.lock`;
  const lock = await open(lockPath, "wx", 0o600).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "EEXIST")
      throw Error(
        `Register is locked: ${lockPath}. Check for an active writer before removing a stale lock.`,
      );
    throw error;
  });
  const temporary = `${destination}.${randomUUID()}.tmp`;
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() }));
    const next = await action();
    parseRegister(next);
    await writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, { flag: "wx", mode: 0o600 });
    await rename(temporary, destination);
    return next;
  } finally {
    await rm(temporary, { force: true });
    await lock.close();
    await rm(lockPath);
  }
}
export async function initialiseRegister(
  root: string,
  sourceId: string,
  sync = false,
  deps: Dependencies = {},
) {
  return mutate(root, sourceId, async () => {
    const inv = await inventory(root, sourceId, (deps.now?.() ?? new Date()).toISOString());
    let existing: Register | undefined;
    try {
      existing = await readRegister(root, sourceId);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    if (!existing) return { version: 1, sourceId, revision: 1, inventories: [inv], batches: [] };
    if (existing.inventories.at(-1)?.sourceHash === inv.sourceHash) return existing;
    requireThat(sync, "Seed source changed; inspect the change and run research sync");
    return {
      ...existing,
      revision: existing.revision + 1,
      inventories: [...existing.inventories, inv],
    };
  });
}
export async function recordBatch(
  root: string,
  sourceId: string,
  input: unknown,
  revision: number,
  deps: Dependencies = {},
) {
  const batch = parseBatch(input);
  return mutate(root, sourceId, async () => {
    const r = await readRegister(root, sourceId);
    const previous = r.batches.find((b) => b.id === batch.id);
    if (previous) {
      requireThat(
        canonical(plainBatch(previous)) === canonical(batch),
        `Batch ID already used with different content: ${batch.id}`,
      );
      return r;
    }
    requireThat(
      Number.isInteger(revision) && revision === r.revision,
      `Revision conflict: expected ${r.revision}, received ${revision}; reread status`,
    );
    requireThat(
      (await source(root, sourceId)).hash === r.inventories.at(-1)?.sourceHash,
      "Seed source changed; inspect the change and run research sync",
    );
    await validateEvidence(root, batch, deps);
    const entries = currentEntries(r);
    const sourceHashes: Record<string, string> = {};
    for (const update of batch.updates) {
      const entry = entries.find((e) => e.objectId === update.objectId);
      requireThat(entry, `Object is not in the current inventory: ${update.objectId}`);
      await file(root, `collection/objects/${update.objectId}.json`);
      const identity = update.identity ?? entry.outcomes.identity?.outcome;
      for (const stage of stages) {
        const outcome = update[stage];
        if (!outcome) continue;
        if (stage !== "identity" && ["complete", "partial"].includes(outcome.status))
          requireThat(
            identity?.status === "verified",
            `${update.objectId}: verify identity before recording completed work`,
          );
        Object.assign(sourceHashes, await validateRefs(root, update.objectId, stage, outcome));
      }
    }
    return {
      ...r,
      revision: r.revision + 1,
      batches: [
        ...r.batches,
        {
          ...batch,
          recordedAt: (deps.now?.() ?? new Date()).toISOString(),
          inventory: r.inventories.length - 1,
          sourceHashes,
        },
      ],
    };
  });
}
export interface StatusFilter {
  institution?: string;
  object?: string;
  stage?: Stage;
  status?: string;
  limit?: number;
}
interface ProgressRow extends Entry {
  stages: Record<Stage, Outcome & { batchId?: string; checkedAt?: string }>;
  issues: string[];
  complete: boolean;
}
export async function inspectRegister(
  root: string,
  sourceId: string,
  filter: StatusFilter = {},
  deps: Dependencies = {},
) {
  const location = await registerLocation(root, sourceId);
  const shared = location === registerPath(sourceId);
  const r = await readRegister(root, sourceId);
  const issues: string[] = [];
  const seedChanged = (await source(root, sourceId)).hash !== r.inventories.at(-1)?.sourceHash;
  if (seedChanged) issues.push("Seed source changed; inspect it and run research sync");
  const all = currentEntries(r);
  const rows: ProgressRow[] = [];
  const batchIssues = new Map<string, string>();
  for (const batch of r.batches) {
    try {
      await validateEvidence(root, batch, deps, shared);
    } catch (error) {
      const issue = `Batch ${batch.id}: ${error instanceof Error ? error.message : String(error)}`;
      batchIssues.set(batch.id, issue);
      issues.push(issue);
    }
  }
  for (const entry of all) {
    const entryIssues: string[] = seedChanged
      ? ["Seed source changed; sync and review inventory"]
      : [];
    for (const batch of r.batches)
      if (batchIssues.has(batch.id) && batch.updates.some((u) => u.objectId === entry.objectId))
        entryIssues.push(batchIssues.get(batch.id) as string);
    try {
      await file(root, `collection/objects/${entry.objectId}.json`);
    } catch {
      entryIssues.push("Object record is missing or unsafe");
    }
    const states = {} as Record<Stage, Outcome & { batchId?: string; checkedAt?: string }>;
    for (const stage of stages) {
      const latest = entry.outcomes[stage];
      states[stage] = latest
        ? { ...latest.outcome, batchId: latest.batch.id, checkedAt: latest.batch.checkedAt }
        : {
            status: "pending",
            note: "No reviewed outcome recorded for this inventory entry.",
            refs: [],
          };
      if (!latest) continue;
      for (const check of latest.batch.checks)
        if (check.result === "failed")
          entryIssues.push(`${stage}: recorded check failed: ${check.command} (${check.note})`);
      try {
        const hashes = await validateRefs(root, entry.objectId, stage, latest.outcome);
        for (const [id, h] of Object.entries(hashes))
          if (latest.batch.sourceHashes[id] !== h)
            entryIssues.push(`${stage}: source ${id} changed since review`);
      } catch (error) {
        entryIssues.push(`${stage}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    if (
      states.identity.status !== "verified" &&
      stages.slice(1).some((s) => ["complete", "partial"].includes(states[s].status))
    )
      entryIssues.push("Identity is no longer verified; review dependent completed stages");
    issues.push(...entryIssues.map((i) => `${entry.objectId}: ${i}`));
    rows.push({
      objectId: entry.objectId,
      holders: entry.holders,
      catalogueNumbers: entry.catalogueNumbers,
      descriptions: entry.descriptions,
      stages: states,
      issues: entryIssues,
      complete:
        entryIssues.length === 0 &&
        states.identity.status === "verified" &&
        stages.slice(1).every((s) => ["complete", "unavailable"].includes(states[s].status)),
    });
  }
  const summary = Object.fromEntries(
    stages.map((stage) => [
      stage,
      Object.fromEntries(
        statuses[stage].map((status) => [
          status,
          rows.filter((r) => r.stages[stage].status === status).length,
        ]),
      ),
    ]),
  );
  const institutions = [
    ...new Set(rows.flatMap((r) => (r.holders.length ? r.holders : ["(holder not recorded)"]))),
  ]
    .sort()
    .map((name) => {
      const members = rows.filter((r) =>
        r.holders.length ? r.holders.includes(name) : name === "(holder not recorded)",
      );
      return {
        name,
        objects: members.length,
        identityVerified: members.filter((r) => r.stages.identity.status === "verified").length,
        complete: members.filter((r) => r.complete).length,
      };
    });
  const selected = rows.filter((row) => {
    if (filter.object && row.objectId !== filter.object) return false;
    if (
      filter.institution &&
      !row.holders.some((h) =>
        h.toLocaleLowerCase().includes(filter.institution?.toLocaleLowerCase() ?? ""),
      )
    )
      return false;
    if (filter.status)
      return filter.stage
        ? row.stages[filter.stage].status === filter.status
        : stages.some((s) => row.stages[s].status === filter.status);
    return (
      filter.object ||
      (filter.stage
        ? !["verified", "complete", "unavailable"].includes(row.stages[filter.stage].status) ||
          row.issues.length
        : !row.complete)
    );
  });
  const historical = new Set(r.inventories.flatMap((i) => i.entries.map((e) => e.objectId)));
  return {
    ok: issues.length === 0,
    sourceId,
    file: location,
    warnings: shared
      ? []
      : [`Legacy register is read-only: ${location}. Migrate it before recording more work.`],
    evidenceLimitations: r.batches
      .filter(
        (batch) =>
          batch.evidenceLimitations?.length &&
          (!filter.object || batch.updates.some((update) => update.objectId === filter.object)),
      )
      .map((batch) => ({ batchId: batch.id, notes: batch.evidenceLimitations })),
    revision: r.revision,
    active: rows.length,
    needsReview: rows.filter((row) => row.issues.length > 0).length,
    completed: rows.filter((row) => row.complete).length,
    inactive: historical.size - rows.length,
    batches: r.batches.length,
    summary,
    institutions,
    issues,
    ...(filter.object
      ? {
          history: r.batches
            .filter((batch) => batch.updates.some((update) => update.objectId === filter.object))
            .map((batch) => ({
              ...batch,
              updates: batch.updates.filter((update) => update.objectId === filter.object),
            })),
        }
      : {}),
    matching: selected.length,
    queue: selected.slice(0, filter.limit ?? 30),
  };
}

export async function inspectSharedRegisters(root: string, deps: Dependencies = {}) {
  let names: string[];
  try {
    names = await readdir(await safePath(root, "research/progress"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    names = [];
  }
  const registers = [];
  for (const name of names.filter((name) => name.endsWith(".json")).sort()) {
    const sourceId = name.slice(0, -5);
    try {
      const { ok, revision, active, completed, needsReview, evidenceLimitations, issues } =
        await inspectRegister(root, sourceId, { limit: 0 }, deps);
      registers.push({
        sourceId,
        ok,
        revision,
        active,
        completed,
        needsReview,
        evidenceLimitations,
        issues,
      });
    } catch (error) {
      registers.push({
        sourceId,
        ok: false,
        issues: [error instanceof Error ? error.message : String(error)],
      });
    }
  }
  return { ok: registers.every((register) => register.ok), registers };
}
