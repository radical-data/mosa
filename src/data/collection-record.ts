import {
  type Claim,
  type CollectionData,
  type GeocodedLocation,
  type Holder,
  type ObjectLocation,
  qualifyClaim,
  type Source,
} from "./collection-model";

export interface SourcedClaim {
  claim: Claim;
  source: Source;
}

export function claimValueLanguage(claim: Pick<Claim, "language">, sourceLanguage: string) {
  const language = claim.language ?? sourceLanguage;
  return language === "und" ? undefined : language;
}

export function sourceImagesForObject(source: Source, objectId: string) {
  const sourceDepictsObject = source.relationships?.some(
    (relationship) =>
      relationship.type === "depicts" &&
      relationship.target.type === "object" &&
      relationship.target.id === objectId,
  );
  return source.images.filter((image) =>
    image.depicts === undefined ? sourceDepictsObject : image.depicts.includes(objectId),
  );
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
      return {
        ...source,
        claims: source.claims.filter((claim) => claim.objectId === objectId),
        images: sourceImagesForObject(source, objectId),
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

export interface MappedObject {
  object: CollectionData["objects"][number];
  holder?: Holder;
  status: ObjectLocation["status"];
  note?: ObjectLocation["note"];
  claims: SourcedClaim[];
}

export interface MappedLocation {
  key: string;
  location: GeocodedLocation;
  holders: Holder[];
  objects: MappedObject[];
}

export interface UnresolvedObject extends MappedObject {
  reason: "unassessed" | "unknown" | "unresolved-holder" | "multiple-holders" | "unmapped-holder";
}

/** Build a map/list projection without inferring a location from claim wording. */
export function getLocationProjection(data: CollectionData) {
  const holders = new Map((data.holders ?? []).map((holder) => [holder.id, holder]));
  const locations = new Map((data.locations ?? []).map((location) => [location.id, location]));
  const claimsByObject = new Map<string, SourcedClaim[]>();
  for (const source of data.sources)
    for (const claim of source.claims) {
      const claims = claimsByObject.get(claim.objectId) ?? [];
      claims.push({ claim, source });
      claimsByObject.set(claim.objectId, claims);
    }

  const mappedByLocation = new Map<
    string,
    { location: GeocodedLocation; objects: MappedObject[] }
  >();
  const unresolved: UnresolvedObject[] = [];
  for (const object of data.objects) {
    const location = locations.get(object.id);
    const objectClaims = claimsByObject.get(object.id) ?? [];
    let holder: Holder | undefined;
    let geocodedLocation: GeocodedLocation | undefined;
    let groupKey: string | undefined;
    let status: ObjectLocation["status"] = location?.status ?? "reported";
    let reason: UnresolvedObject["reason"] | undefined;
    let claims: SourcedClaim[];

    if (location) {
      const selectedClaims = location.claimReferences
        .map((reference) =>
          objectClaims.find(({ source, claim }) => qualifyClaim(source.id, claim.id) === reference),
        )
        .filter((entry): entry is SourcedClaim => !!entry);
      const selectedHolderIds = new Set(
        selectedClaims.map(({ claim }) => claim.holderId).filter((id): id is string => !!id),
      );
      holder = location.holderId
        ? holders.get(location.holderId)
        : selectedHolderIds.size === 1
          ? holders.get([...selectedHolderIds][0])
          : undefined;
      claims = selectedClaims;
      if (location.status === "unknown") reason = "unknown";
      else if (location.location) {
        geocodedLocation = location.location;
        groupKey = `object:${object.id}`;
      } else if (holder?.location) {
        geocodedLocation = holder.location;
        groupKey = `holder:${holder.id}`;
      } else {
        reason = "unmapped-holder";
      }
    } else {
      status = "reported";
      const heldBy = objectClaims.filter(({ claim }) => claim.predicate === "held_by");
      claims = heldBy;
      if (!heldBy.length) reason = "unassessed";
      else if (heldBy.some(({ claim }) => !claim.holderId)) reason = "unresolved-holder";
      else {
        const holderIds = new Set(heldBy.map(({ claim }) => claim.holderId as string));
        if (holderIds.size !== 1) reason = "multiple-holders";
        else {
          holder = holders.get([...holderIds][0]);
          if (!holder?.location) reason = "unmapped-holder";
          else {
            geocodedLocation = holder.location;
            groupKey = `holder:${holder.id}`;
          }
        }
      }
    }

    const entry: MappedObject = {
      object,
      ...(holder ? { holder } : {}),
      status,
      ...(location?.note ? { note: location.note } : {}),
      claims,
    };
    if (geocodedLocation && groupKey) {
      const group = mappedByLocation.get(groupKey) ?? { location: geocodedLocation, objects: [] };
      const objects = group.objects;
      objects.push(entry);
      mappedByLocation.set(groupKey, group);
    } else {
      unresolved.push({ ...entry, reason: reason ?? "unmapped-holder" });
    }
  }

  const mapped = [...mappedByLocation.entries()]
    .map(([key, { location, objects }]) => {
      const groupedHolders = new Map<string, Holder>();
      for (const entry of objects)
        if (entry.holder) groupedHolders.set(entry.holder.id, entry.holder);
      return {
        key,
        location,
        holders: [...groupedHolders.values()].sort((a, b) => a.name.localeCompare(b.name)),
        objects: objects.sort((a, b) => a.object.id.localeCompare(b.object.id)),
      } satisfies MappedLocation;
    })
    .sort((a, b) => a.location.name.localeCompare(b.location.name) || a.key.localeCompare(b.key));
  return {
    locations: mapped,
    unresolved: unresolved.sort((a, b) => a.object.id.localeCompare(b.object.id)),
  };
}
