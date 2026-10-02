import labels from "../content/pages/reference-labels.json";
import type { Locale } from "../i18n/routes";

export {
  collectionMapLocations,
  collectionMapUnresolved,
  collectionRecords,
  getObjectRecord,
  visitHolders,
} from "./collection";
export { getResources } from "./resources";

export const contactEmail = "mosa@radicaldata.org";
export const conceptIds = [
  "stoneMoai",
  "taoa",
  "iviTupuna",
  "moaiKavakava",
  "sacredGeography",
  "outOfFrame",
  "moai",
] as const;
export const typeIds = ["individual", "type", "ancestors"] as const;
const rapConcepts: readonly string[] = ["taoa", "iviTupuna", "moaiKavakava", "moai"];
export const getConcepts = (locale: Locale) =>
  conceptIds.map((id) => ({
    id,
    label: labels[locale][id],
    language: rapConcepts.includes(id) ? "rap" : undefined,
  }));
export const getTypes = (locale: Locale) =>
  typeIds.map((id) => ({ id, label: labels[locale][id] }));
