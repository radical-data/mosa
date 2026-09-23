import { createHash } from "node:crypto";
import { type PublicCollection, parseCollection } from "@mosa/public-collection";

export function currentPublicCollection(records: unknown[]): PublicCollection {
  const ordered = [...records].sort((a, b) => {
    const id = (value: unknown) =>
      value && typeof value === "object" && "id" in value ? String(value.id) : "";
    return id(a).localeCompare(id(b));
  });
  const hash = createHash("sha256").update(JSON.stringify(ordered)).digest("hex");
  const releaseId = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
  return parseCollection({ schemaVersion: 2, releaseId, records: ordered });
}
