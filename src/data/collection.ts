import type { ImageMetadata, MarkdownInstance } from "astro";
import {
  type Claim,
  type CollectionImage,
  type CollectionObject,
  type EditorialMetadata,
  parseEditorialFrontmatter,
  parseObject,
  parseSource,
  qualifyClaim,
  type Source,
  validateCollection,
} from "./collection-model";

const objectModules = import.meta.glob<unknown>("../../collection/objects/*.json", {
  eager: true,
  import: "default",
});
const sourceModules = import.meta.glob<unknown>("../../collection/sources/*.json", {
  eager: true,
  import: "default",
});
const imageModules = import.meta.glob<ImageMetadata>(
  "../../collection/images/**/*.{avif,jpeg,jpg,png,webp}",
  { eager: true, import: "default" },
);
const editorialModules = import.meta.glob<MarkdownInstance<Record<string, unknown>>>(
  "../../collection/editorials/*.md",
  { eager: true },
);

const basename = (file: string) => file.slice(file.lastIndexOf("/") + 1);
const imageName = (file: string) => file.split("/collection/images/")[1];
const objects = Object.entries(objectModules).map(([file, value]) =>
  parseObject(value, basename(file)),
);
const sources = Object.entries(sourceModules).map(([file, value]) =>
  parseSource(value, basename(file)),
);
const checked = validateCollection(
  { objects, sources },
  {
    imageFiles: new Set(Object.keys(imageModules).map(imageName)),
  },
);

export interface EditorialEntry extends EditorialMetadata {
  Content: MarkdownInstance<Record<string, unknown>>["Content"];
}

export interface SourcedClaim {
  claim: Claim;
  source: Source;
}

export interface SourcedImage {
  image: CollectionImage;
  source: Source;
  asset: ImageMetadata;
}

export interface ObjectSource extends Source {
  claims: Claim[];
  images: CollectionImage[];
}

export interface CollectionRecord {
  object: CollectionObject;
  sources: ObjectSource[];
  claims: SourcedClaim[];
  foregroundedClaims: SourcedClaim[];
  images: SourcedImage[];
  editorials: EditorialEntry[];
  searchExact: string;
  searchFoldable: string;
}

const editorials: EditorialEntry[] = Object.entries(editorialModules).map(([file, module]) => {
  const raw = Object.entries(module.frontmatter)
    .map(([key, value]) => `${key}: ${value === null ? "null" : String(value)}`)
    .join("\n");
  const metadata = parseEditorialFrontmatter(`---\n${raw}\n---\n`, basename(file));
  return { ...metadata, Content: module.Content };
});

export const collectionObjects = checked.objects;
export const collectionSources = checked.sources;

export function getObjectRecord(objectId: string): CollectionRecord | undefined {
  const object = checked.objects.find((entry) => entry.id === objectId);
  if (!object) return undefined;
  const objectSources = checked.sources
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
  const claims = objectSources.flatMap((source) =>
    source.claims.map((claim) => ({ claim, source })),
  );
  const claimById = new Map(
    claims.map((entry) => [qualifyClaim(entry.source.id, entry.claim.id), entry]),
  );
  const recordEditorials = editorials
    .filter((entry) => entry.objectId === objectId)
    .sort((a, b) => a.id.localeCompare(b.id));
  const recordImages = objectSources.flatMap((source) =>
    source.images.map((image) => {
      const asset =
        imageModules[
          Object.keys(imageModules).find((file) => imageName(file) === image.file) ?? ""
        ];
      if (!asset) throw Error(`Missing image asset ${image.file}`);
      return { image, source, asset };
    }),
  );
  return {
    object,
    sources: objectSources,
    claims,
    foregroundedClaims: object.foregroundedClaims.map((id) => {
      const entry = claimById.get(id);
      if (!entry) throw Error(`Missing foregrounded claim ${id}`);
      return entry;
    }),
    images: recordImages,
    editorials: recordEditorials,
    searchExact: [
      object.id,
      object.name,
      ...objectSources.map((source) => source.reference),
      ...claims.map(({ claim, source }) => `${claim.predicate} ${claim.value} ${source.reference}`),
    ].join(" "),
    searchFoldable: object.name,
  };
}

export const collectionRecords = checked.objects.map((object) => {
  const record = getObjectRecord(object.id);
  if (!record) throw Error(`Missing collection object ${object.id}`);
  return record;
});
