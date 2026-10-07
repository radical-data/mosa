import presentation from "../content/collection-presentation.json";
import { buildCatalogueHolders, buildCatalogueItems } from "./catalogue-browse";
import { collectionHolders, collectionRecords, sourceRecords } from "./collection";

export type { CatalogueDetail, CatalogueHolder, CatalogueItem } from "./catalogue-browse";

export const catalogueHolders = buildCatalogueHolders(collectionHolders);
export const catalogueItems = buildCatalogueItems(
  collectionRecords,
  sourceRecords,
  collectionHolders,
  presentation.galleryOnlySourceIds,
);
