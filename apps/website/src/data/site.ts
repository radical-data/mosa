import { type PublicCollection, parseCollection } from "@mosa/public-collection";
import snapshot from "../../public/collection-snapshot.json";
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
// All collection facts come from the strictly validated public export.
export const publicCollection = parseCollection(snapshot);
export function collectionRecords(data: PublicCollection) {
  return data.records.map((record) =>
    "kind" in record
      ? {
          ...record,
          searchExact: [
            record.label,
            ...record.identifiers.map((entry) => `${entry.namespace} ${entry.value}`),
            ...record.claims.map(
              (claim) => `${claim.subject.label} ${claim.predicate} ${claim.value.text}`,
            ),
          ].join(" "),
          searchFoldable: record.label,
        }
      : {
          ...record,
          institution: record.holder.text,
          searchExact: [
            record.name.text,
            record.holder.text,
            record.name.attributedTo,
            record.holder.attributedTo,
            record.identifier.namespace,
            record.identifier.value,
          ].join(" "),
          // Preserve original-name spelling; fold accents only in institution search.
          searchFoldable: record.holder.text,
        },
  );
}
export function getCollection(_locale: Locale) {
  return collectionRecords(publicCollection);
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
