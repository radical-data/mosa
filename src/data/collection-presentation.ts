export interface CollectionPresentationLeadImage {
  sourceId: string;
  file: string;
}

export interface CollectionPresentationConfig {
  featuredObjectIds: string[];
  leadImages?: Record<string, CollectionPresentationLeadImage>;
}

export interface PresentationImage {
  image: { file: string };
  source: { id: string; kind: string };
}

export interface ResolvedCollectionPresentation<TImage extends PresentationImage> {
  featuredObjectIds: string[];
  imagesByObjectId: Map<string, TImage[]>;
}

export function resolveCollectionPresentation<TImage extends PresentationImage>(
  config: CollectionPresentationConfig,
  objectIds: readonly string[],
  depictingGalleries: ReadonlyMap<string, readonly TImage[]>,
): ResolvedCollectionPresentation<TImage> {
  const knownObjectIds = new Set(objectIds);
  const featuredObjectIds = config.featuredObjectIds;
  const duplicateFeaturedId = featuredObjectIds.find(
    (objectId, index) => featuredObjectIds.indexOf(objectId) !== index,
  );

  if (duplicateFeaturedId) {
    throw new Error(
      `Collection presentation lists featured object "${duplicateFeaturedId}" more than once; remove the duplicate from src/content/collection-presentation.json.`,
    );
  }

  for (const objectId of featuredObjectIds) {
    if (!knownObjectIds.has(objectId)) {
      throw new Error(
        `Collection presentation featuredObjectIds contains unknown object "${objectId}"; correct the ID in src/content/collection-presentation.json or add the object under collection/objects/.`,
      );
    }
  }

  const imagesByObjectId = new Map<string, TImage[]>();
  for (const objectId of objectIds) {
    const gallery = [...(depictingGalleries.get(objectId) ?? [])].sort(
      (a, b) =>
        Number(b.source.kind === "photograph") - Number(a.source.kind === "photograph") ||
        a.source.id.localeCompare(b.source.id) ||
        a.image.file.localeCompare(b.image.file),
    );
    imagesByObjectId.set(objectId, gallery);
  }

  for (const [objectId, leadImage] of Object.entries(config.leadImages ?? {})) {
    if (!knownObjectIds.has(objectId)) {
      throw new Error(
        `Collection presentation leadImages contains unknown object "${objectId}"; correct the key in src/content/collection-presentation.json or add the object under collection/objects/.`,
      );
    }

    const gallery = imagesByObjectId.get(objectId) ?? [];
    const leadIndex = gallery.findIndex(
      ({ image, source }) => source.id === leadImage.sourceId && image.file === leadImage.file,
    );
    if (leadIndex < 0) {
      throw new Error(
        `Collection presentation lead image for "${objectId}" (source "${leadImage.sourceId}", file "${leadImage.file}") is not in that object's depicting gallery; check the source's depicts relationship and image file in src/content/collection-presentation.json.`,
      );
    }
    const [selectedLead] = gallery.splice(leadIndex, 1);
    if (selectedLead) gallery.unshift(selectedLead);
  }

  return { featuredObjectIds: [...featuredObjectIds], imagesByObjectId };
}
