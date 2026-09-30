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
    .map((source) => ({
      ...source,
      claims: source.claims.filter((claim) => claim.objectId === objectId),
      images: source.images.filter((image) => image.objectId === objectId),
    }))
    .filter(
      (source) =>
        source.objectIds?.includes(objectId) ||
        source.claims.length > 0 ||
        source.images.length > 0,
    );
  const claims: SourcedClaim[] = sources.flatMap((source) =>
    source.claims.map((claim) => ({ claim, source })),
  );
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
