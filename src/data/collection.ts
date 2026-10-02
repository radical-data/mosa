import type { ImageMetadata, MarkdownInstance } from "astro";
import { stringify as stringifyYaml } from "yaml";
import {
  type ArticleMetadata,
  type CollectionImage,
  type CollectionObject,
  parseArticleFrontmatter,
  parseHolder,
  parseLocation,
  parseObject,
  parseSource,
  type Source,
  validateArticlePublicationSource,
  validateArticleSubjects,
  validateCollection,
  validateUniqueSourceArticleLinks,
} from "./collection-model";
import {
  getLocationProjection,
  getObjectAccounts,
  getSourceRelationships,
  type SourcedClaim,
  sourceImagesForObject,
} from "./collection-record";
import { getVisitHolders } from "./visit-holders";

const objectModules = import.meta.glob<unknown>("../../collection/objects/*.json", {
  eager: true,
  import: "default",
});
const sourceModules = import.meta.glob<unknown>("../../collection/sources/*.json", {
  eager: true,
  import: "default",
});
const holderModules = import.meta.glob<unknown>("../../collection/holders/*.json", {
  eager: true,
  import: "default",
});
const locationModules = import.meta.glob<unknown>("../../collection/locations/*.json", {
  eager: true,
  import: "default",
});
const imageModules = import.meta.glob<ImageMetadata>(
  "../../collection/images/**/*.{avif,jpeg,jpg,png,webp}",
  { eager: true, import: "default" },
);
const articleModules = import.meta.glob<MarkdownInstance<Record<string, unknown>>>(
  "../../articles/*.md",
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
const holders = Object.entries(holderModules).map(([file, value]) =>
  parseHolder(value, basename(file)),
);
const locations = Object.entries(locationModules).map(([file, value]) =>
  parseLocation(value, basename(file)),
);
const checked = validateCollection(
  { objects, sources, holders, locations },
  {
    imageFiles: new Set(Object.keys(imageModules).map(imageName)),
  },
);
const collectionMap = getLocationProjection(checked);

export const collectionMapLocations = collectionMap.locations;
export const collectionMapUnresolved = collectionMap.unresolved;
export const visitHolders = getVisitHolders(checked);

export interface ArticleEntry extends ArticleMetadata {
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
  articles: ArticleEntry[];
  searchExact: string;
  searchFoldable: string;
}

const articles: ArticleEntry[] = Object.entries(articleModules).map(([file, module]) => {
  const raw = stringifyYaml(module.frontmatter);
  const metadata = parseArticleFrontmatter(`---\n${raw}---\n`, basename(file));
  validateArticleSubjects(
    metadata,
    { objects: checked.objects, sources: checked.sources },
    basename(file),
  );
  validateArticlePublicationSource(metadata, checked.sources, basename(file));
  return { ...metadata, Content: module.Content };
});
validateUniqueSourceArticleLinks(checked.sources, articles);

export const collectionObjects = checked.objects;
export const collectionSources = checked.sources;
export const collectionHolders = checked.holders;
export const collectionLocations = checked.locations;
export const collectionLocationProjection = getLocationProjection(checked);
export const articlePublications = articles;

function imageAsset(image: CollectionImage): ImageMetadata {
  const asset =
    imageModules[Object.keys(imageModules).find((file) => imageName(file) === image.file) ?? ""];
  if (!asset) throw Error(`Missing image asset ${image.file}`);
  return asset;
}

export const sourceRecords: SourceEntry[] = checked.sources.map((source) => ({
  ...source,
  imagesWithAssets: source.images.map((image) => ({
    image,
    source,
    asset: imageAsset(image),
  })),
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
    articles: articles
      .filter((article) =>
        article.subjects?.some((subject) => subject.type === "source" && subject.id === sourceId),
      )
      .sort((a, b) => a.id.localeCompare(b.id)),
    publicationArticle: articles.find((article) => article.id === source.articleId),
  };
}

export function getArticleRecord(articleId: string) {
  return articles.find((entry) => entry.id === articleId);
}

export function getObjectRecord(objectId: string): CollectionRecord | undefined {
  const accounts = getObjectAccounts(checked, objectId);
  if (!accounts) return undefined;
  const { object, sources: objectSources, claims } = accounts;
  const recordArticles = articles
    .filter((entry) =>
      entry.subjects?.some((subject) => subject.type === "object" && subject.id === objectId),
    )
    .sort((a, b) => a.id.localeCompare(b.id));
  const recordImages = objectSources.flatMap((source) =>
    sourceImagesForObject(source, objectId).map((image) => ({
      image,
      source,
      asset: imageAsset(image),
    })),
  );
  return {
    ...accounts,
    images: recordImages,
    articles: recordArticles,
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
