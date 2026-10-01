import type { ImageMetadata, MarkdownInstance } from "astro";
import { stringify as stringifyYaml } from "yaml";
import {
  type CollectionImage,
  type CollectionObject,
  type EditorialMetadata,
  parseEditorialFrontmatter,
  parseObject,
  parseSource,
  type Source,
  validateCollection,
  validateEditorialSubjects,
} from "./collection-model";
import { getObjectAccounts, getSourceRelationships, type SourcedClaim } from "./collection-record";

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
  "../../editorials/*.md",
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

export interface SourcedImage {
  image: CollectionImage;
  source: Source;
  asset: ImageMetadata;
}

export interface SourceImage extends SourcedImage {}

export interface SourceEntry extends Source {
  imagesWithAssets: SourceImage[];
  searchText: string;
}

export interface CollectionRecord {
  object: CollectionObject;
  sources: Source[];
  claims: SourcedClaim[];
  foregroundedClaims: SourcedClaim[];
  originClaims: SourcedClaim[];
  holdingClaims: SourcedClaim[];
  images: SourcedImage[];
  editorials: EditorialEntry[];
  searchExact: string;
  searchFoldable: string;
}

const editorials: EditorialEntry[] = Object.entries(editorialModules).map(([file, module]) => {
  const raw = stringifyYaml(module.frontmatter);
  const metadata = parseEditorialFrontmatter(`---\n${raw}---\n`, basename(file));
  validateEditorialSubjects(
    metadata,
    { objects: checked.objects, sources: checked.sources },
    basename(file),
  );
  return { ...metadata, Content: module.Content };
});

export const collectionObjects = checked.objects;
export const collectionSources = checked.sources;
export const editorialPublications = editorials;

function imageAsset(image: CollectionImage): ImageMetadata {
  const asset =
    imageModules[Object.keys(imageModules).find((file) => imageName(file) === image.file) ?? ""];
  if (!asset) throw Error(`Missing image asset ${image.file}`);
  return asset;
}

export const sourceRecords: SourceEntry[] = checked.sources.map((source) => ({
  ...source,
  imagesWithAssets: source.images.map((image) => ({ image, source, asset: imageAsset(image) })),
  searchText: [source.title, source.author ?? "", source.reference, ...(source.topics ?? [])].join(
    " ",
  ),
}));

export function getSourceRecord(sourceId: string) {
  const relationships = getSourceRelationships(
    { objects: checked.objects, sources: checked.sources },
    sourceId,
  );
  if (!relationships) return undefined;
  const source = sourceRecords.find((entry) => entry.id === sourceId);
  if (!source) return undefined;
  return {
    ...relationships,
    source,
    images: source.imagesWithAssets,
    claims: source.claims.map((claim) => ({ claim, source })),
    editorials: editorials
      .filter((editorial) =>
        editorial.subjects?.some((subject) => subject.type === "source" && subject.id === sourceId),
      )
      .sort((a, b) => a.id.localeCompare(b.id)),
  };
}

export function getEditorialRecord(editorialId: string) {
  return editorials.find((entry) => entry.id === editorialId);
}

export function getObjectRecord(objectId: string): CollectionRecord | undefined {
  const accounts = getObjectAccounts(checked, objectId);
  if (!accounts) return undefined;
  const { object, sources: objectSources, claims } = accounts;
  const recordEditorials = editorials
    .filter((entry) =>
      entry.subjects?.some((subject) => subject.type === "object" && subject.id === objectId),
    )
    .sort((a, b) => a.id.localeCompare(b.id));
  const recordImages = objectSources
    .filter((source) =>
      source.relationships?.some(
        (relationship) =>
          relationship.type === "depicts" &&
          relationship.target.type === "object" &&
          relationship.target.id === objectId,
      ),
    )
    .flatMap((source) =>
      source.images.map((image) => ({ image, source, asset: imageAsset(image) })),
    );
  return {
    ...accounts,
    images: recordImages,
    editorials: recordEditorials,
    searchExact: [
      object.id,
      object.name,
      ...objectSources.map((source) => source.reference),
      ...claims.map(
        ({ claim, source }) =>
          `${claim.predicate} ${claim.value} ${source.title} ${source.reference}`,
      ),
    ].join(" "),
    searchFoldable: object.name,
  };
}

export const collectionRecords = checked.objects.map((object) => {
  const record = getObjectRecord(object.id);
  if (!record) throw Error(`Missing collection object ${object.id}`);
  return record;
});
