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
export const githubURL = "https://github.com/radical-data/mosa";
export const instagramURL = "https://www.instagram.com/museumofstolenartefacts/";
export const mailchimpSignupAction =
  "https://radicaldata.us18.list-manage.com/subscribe/post?u=3484234c1c5960682945b6be0&id=712b203609&f_id=0094b6e6f0";
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
