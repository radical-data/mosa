import type { CollectionData, Holder } from "./collection-model";
import type { MappedObject, SourcedClaim } from "./collection-record";

export interface VisitHolder {
  holder: Holder;
  objects: MappedObject[];
}

/** Destinations come from attributed holding relationships, regardless of public access. */
export function getVisitHolders(data: CollectionData): VisitHolder[] {
  const objects = new Map(data.objects.map((object) => [object.id, object]));
  const assessments = new Map((data.locations ?? []).map((entry) => [entry.id, entry]));
  const byHolder = new Map<string, Map<string, SourcedClaim[]>>();
  const holdersByObject = new Map<string, Set<string>>();
  for (const source of data.sources) {
    for (const claim of source.claims) {
      if (claim.predicate !== "held_by" || !claim.holderId) continue;
      const entries = byHolder.get(claim.holderId) ?? new Map<string, SourcedClaim[]>();
      const claims = entries.get(claim.objectId) ?? [];
      claims.push({ source, claim });
      entries.set(claim.objectId, claims);
      byHolder.set(claim.holderId, entries);
      const holderIds = holdersByObject.get(claim.objectId) ?? new Set<string>();
      holderIds.add(claim.holderId);
      holdersByObject.set(claim.objectId, holderIds);
    }
  }
  return (data.holders ?? [])
    .filter((holder) => byHolder.has(holder.id))
    .map((holder) => ({
      holder,
      objects: [...(byHolder.get(holder.id) ?? [])]
        .flatMap(([objectId, claims]) => {
          const object = objects.get(objectId);
          if (!object) return [];
          const assessment = assessments.get(objectId);
          return [
            {
              object,
              holder,
              claims,
              status:
                assessment?.status ??
                ((holdersByObject.get(objectId)?.size ?? 0) > 1 ? "uncertain" : "reported"),
              ...(assessment?.note ? { note: assessment.note } : {}),
            } satisfies MappedObject,
          ];
        })
        .sort((a, b) => a.object.name.localeCompare(b.object.name, "en")),
    }))
    .sort((a, b) => a.holder.name.localeCompare(b.holder.name, "en"));
}
