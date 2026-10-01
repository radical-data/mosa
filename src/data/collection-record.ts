import { type Claim, type CollectionData, qualifyClaim, type Source } from "./collection-model";

export interface SourcedClaim {
  claim: Claim;
  source: Source;
}

// Project validated records without choosing a preferred factual account.
export function getObjectAccounts(data: CollectionData, objectId: string) {
  const object = data.objects.find((entry) => entry.id === objectId);
  if (!object) return undefined;
  const sources: Source[] = data.sources
    .filter(
      (source) =>
        source.objectIds?.includes(objectId) ||
        source.claims.some((claim) => claim.objectId === objectId) ||
        source.relationships?.some(
          (relationship) =>
            relationship.type === "depicts" &&
            relationship.target.type === "object" &&
            relationship.target.id === objectId,
        ),
    )
    .map((source) => {
      const depictsObject = source.relationships?.some(
        (relationship) =>
          relationship.type === "depicts" &&
          relationship.target.type === "object" &&
          relationship.target.id === objectId,
      );
      return {
        ...source,
        claims: source.claims.filter((claim) => claim.objectId === objectId),
        images: depictsObject ? source.images : [],
      };
    });
  const objectClaims = sources.flatMap((source) =>
    source.claims
      .filter((claim) => claim.objectId === objectId)
      .map((claim) => ({ claim, source })),
  );
  const claims: SourcedClaim[] = objectClaims;
  const claimById = new Map(
    claims.map((entry) => [qualifyClaim(entry.source.id, entry.claim.id), entry]),
  );
  return {
    object,
    sources,
    claims,
    foregroundedClaims: object.foregroundedClaims.map((id) => {
      const entry = claimById.get(id);
      if (!entry) throw Error(`Missing foregrounded claim ${id}`);
      return entry;
    }),
    originClaims: claims.filter(({ claim }) =>
      ["made_at", "made_during", "found_at"].includes(claim.predicate),
    ),
    holdingClaims: claims.filter(({ claim }) =>
      ["held_by", "located_at"].includes(claim.predicate),
    ),
  };
}

export interface SourceRelationshipRecord {
  source: Source;
  type: "reproduces" | "discusses" | "is_part_of";
  locator?: string;
}

export function getSourceRelationships(data: CollectionData, sourceId: string) {
  const source = data.sources.find((entry) => entry.id === sourceId);
  if (!source) return undefined;
  const relatedObjects = new Set<string>(source.objectIds ?? []);
  for (const claim of source.claims) relatedObjects.add(claim.objectId);
  const outgoing = (source.relationships ?? []).flatMap((relationship) => {
    if (relationship.target.type !== "source" || relationship.type === "depicts") return [];
    const target = data.sources.find((entry) => entry.id === relationship.target.id);
    return target
      ? [{ source: target, type: relationship.type, locator: relationship.locator }]
      : [];
  });
  const incoming: SourceRelationshipRecord[] = data.sources.flatMap((candidate) =>
    (candidate.relationships ?? []).flatMap((relationship) =>
      relationship.target.type === "source" &&
      relationship.target.id === sourceId &&
      relationship.type !== "depicts"
        ? [{ source: candidate, type: relationship.type, locator: relationship.locator }]
        : [],
    ),
  );
  const depictingObjects = (source.relationships ?? []).flatMap((relationship) =>
    relationship.type === "depicts" && relationship.target.type === "object"
      ? [{ type: "object" as const, id: relationship.target.id }]
      : [],
  );
  return {
    source,
    outgoing,
    incoming,
    relatedObjects: [...relatedObjects],
    depictingObjects,
  };
}
