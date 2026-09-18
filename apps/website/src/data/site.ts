import labels from "../content/pages/reference-labels.json";
import resources from "../content/pages/resource-summaries.json";
import type { Locale } from "../i18n/routes";

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
// Design reference records only. IDs, names and institutions are independent of UI locale.
// These are not research claims or a public projection of the research database.
const records = [
  {
    id: "mamari",
    name: "mamari",
    concept: "taoa",
    type: "individual",
    institution: "Musei Vaticani",
    location: "vatican",
    image: "collection-mamari",
    originalLanguage: "es-CL",
  },
  {
    id: "hoa-hakananai-a",
    name: "hoa",
    concept: "stoneMoai",
    type: "individual",
    institution: "British Museum",
    location: "london",
    image: "collection-hoa-hakananai-a",
    originalLanguage: "rap",
  },
  {
    id: "moai-kavakava",
    name: "kavakava",
    concept: "moaiKavakava",
    type: "type",
    institution: "Museum of New Zealand Te Papa Tongarewa",
    location: "wellington",
    image: "collection-kavakava",
    originalLanguage: "rap",
  },
  {
    id: "mahute",
    name: "mahute",
    concept: "",
    type: "individual",
    institution: "Peabody Museum of Archaeology and Ethnology",
    location: "cambridge",
    image: "collection-mahute",
    originalLanguage: "es-CL",
  },
  {
    id: "wooden-figure",
    name: "woodenFigure",
    concept: "moai",
    type: "individual",
    institution: "Museo delle Civiltà",
    location: "rome",
    image: "collection-wooden-figure",
    originalLanguage: "es-CL",
  },
  {
    id: "ivi-tupuna",
    name: "ivi",
    concept: "iviTupuna",
    type: "ancestors",
    institution: "Staatliche Museen zu Berlin",
    location: "berlin",
    image: "collection-ivi-tupuna",
    originalLanguage: "rap",
  },
] as const;
export function getCollection(locale: Locale) {
  return records.map((record) => ({
    ...record,
    originalName: labels.es[record.name],
    name: labels[locale][record.name],
    nameLanguage: record.originalLanguage === "rap" ? "rap" : undefined,
    location: labels[locale][record.location],
    typeLabel: labels[locale][record.type],
    conceptLabel: record.concept ? labels[locale][record.concept] : "",
    conceptLanguage: rapConcepts.includes(record.concept) ? "rap" : undefined,
    // Rapa Nui spelling is matched exactly (case-insensitively), without accent folding.
    searchExact: [
      labels.es[record.name],
      labels.en[record.name],
      record.institution,
      "Rapa Nui",
      record.concept ? labels.es[record.concept] : "",
      record.concept ? labels.en[record.concept] : "",
    ].join(" "),
    searchFoldable: [
      labels.es[record.location],
      labels.en[record.location],
      record.institution,
    ].join(" "),
  }));
}
const resourceIds = ["guide", "letter", "directory", "generator"] as const;
export function getResources(locale: Locale) {
  const copy = resources[locale];
  return resourceIds.map((id) => ({
    id,
    title: copy[`${id}Title`],
    description: copy[`${id}Description`],
  }));
}
export const programme = {
  date: "2026-09-19",
  timeZone: "Europe/London",
  institution: "British Museum",
} as const;
export const archiveEvent = { date: "2026-07-25", timeZone: "Pacific/Easter" } as const;
