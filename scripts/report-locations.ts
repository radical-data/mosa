import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface ObjectRecord {
  name: string;
}

interface ClaimRecord {
  id: string;
  objectId: string;
  predicate: string;
  value: string;
  holderId?: string;
}

interface SourceRecord {
  claims: ClaimRecord[];
}

interface HolderRecord {
  name: string;
  location?: {
    name: string;
    precision: "site" | "locality" | "region" | "country";
    longitude: number;
    latitude: number;
    reference: string;
  };
}

interface LocationRecord {
  status: "reported" | "historical" | "uncertain" | "unknown";
  claimReferences: string[];
  holderId?: string;
  location?: HolderRecord["location"];
}

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const collectionRoot = path.join(repositoryRoot, "collection");

async function records<T>(directory: string) {
  const root = path.join(collectionRoot, directory);
  const names = await readdir(root).catch(() => []);
  return new Map(
    await Promise.all(
      names
        .filter((name) => name.endsWith(".json"))
        .sort()
        .map(
          async (name) =>
            [
              name.slice(0, -5),
              JSON.parse(await readFile(path.join(root, name), "utf8")) as T,
            ] as const,
        ),
    ),
  );
}

const objects = await records<ObjectRecord>("objects");
const sources = await records<SourceRecord>("sources");
const holders = await records<HolderRecord>("holders");
const locations = await records<LocationRecord>("locations");

const claimsByObject = new Map<string, Array<ClaimRecord & { sourceId: string }>>();
for (const [sourceId, source] of sources)
  for (const claim of source.claims ?? []) {
    const claims = claimsByObject.get(claim.objectId) ?? [];
    claims.push({ ...claim, sourceId });
    claimsByObject.set(claim.objectId, claims);
  }

const mapped: Array<{ objectId: string; locationName: string }> = [];
const unresolved = new Map<string, string[]>();
const rawHolderClaims = new Map<
  string,
  { holderIds: Set<string>; objects: Set<string>; claims: number }
>();

for (const [objectId] of objects) {
  const holdingClaims = (claimsByObject.get(objectId) ?? []).filter(
    ({ predicate }) => predicate === "held_by",
  );
  for (const claim of holdingClaims) {
    const entry = rawHolderClaims.get(claim.value) ?? {
      holderIds: new Set<string>(),
      objects: new Set<string>(),
      claims: 0,
    };
    if (claim.holderId) entry.holderIds.add(claim.holderId);
    entry.objects.add(objectId);
    entry.claims += 1;
    rawHolderClaims.set(claim.value, entry);
  }

  const explicit = locations.get(objectId);
  if (explicit?.status === "unknown") {
    unresolved.set(objectId, ["explicitly unknown"]);
    continue;
  }

  let location = explicit?.location;
  const referencedHolderIds = new Set(
    (explicit?.claimReferences ?? []).flatMap((reference) => {
      const claim = (claimsByObject.get(objectId) ?? []).find(
        ({ sourceId, id }) => `${sourceId}/${id}` === reference,
      );
      return claim?.holderId ? [claim.holderId] : [];
    }),
  );
  const selectedHolderId =
    explicit?.holderId ??
    (referencedHolderIds.size === 1 ? [...referencedHolderIds][0] : undefined);
  if (!location && selectedHolderId) location = holders.get(selectedHolderId)?.location;

  if (!explicit) {
    const missingHolderIds = holdingClaims.filter(({ holderId }) => !holderId);
    const holderIds = new Set(
      holdingClaims.flatMap(({ holderId }) => (holderId ? [holderId] : [])),
    );
    if (missingHolderIds.length > 0)
      unresolved.set(objectId, [`${missingHolderIds.length} unresolved holding claim(s)`]);
    else if (holderIds.size > 1) unresolved.set(objectId, ["conflicting resolved holders"]);
    else if (holderIds.size === 1) {
      const [holderId] = holderIds;
      location = holders.get(holderId)?.location;
      if (!location) unresolved.set(objectId, [`holder ${holderId} has no mapped location`]);
    } else unresolved.set(objectId, ["no resolved holding claim"]);
  }

  if (location) mapped.push({ objectId, locationName: location.name });
  else if (!unresolved.has(objectId)) unresolved.set(objectId, ["selected location is missing"]);
}

const escapeCell = (value: string) => value.replaceAll("|", "\\|").replaceAll("\n", " ");
console.log(`# Location coverage\n`);
console.log(`- Objects: ${objects.size}`);
console.log(`- Holders: ${holders.size}`);
console.log(
  `- Holders with mapped locations: ${[...holders.values()].filter(({ location }) => location).length}`,
);
console.log(`- Explicit assessments: ${locations.size}`);
console.log(`- Mapped objects: ${mapped.length}`);
console.log(`- Unresolved objects: ${unresolved.size}\n`);

console.log("## Reported holder wording\n");
console.log("| Reported value | Claims | Objects | Resolved holder IDs |");
console.log("| --- | ---: | ---: | --- |");
for (const [value, entry] of [...rawHolderClaims].sort((a, b) => a[0].localeCompare(b[0], "en")))
  console.log(
    `| ${escapeCell(value)} | ${entry.claims} | ${entry.objects.size} | ${
      [...entry.holderIds].sort().join(", ") || "—"
    } |`,
  );

console.log("\n## Unresolved objects\n");
if (unresolved.size === 0) console.log("None.");
else {
  console.log("| Object | Reason |");
  console.log("| --- | --- |");
  for (const [objectId, reasons] of [...unresolved].sort(([a], [b]) => a.localeCompare(b)))
    console.log(
      `| ${escapeCell(objects.get(objectId)?.name ?? objectId)} (${objectId}) | ${reasons.join("; ")} |`,
    );
}
