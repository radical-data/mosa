import type { Locale } from "../i18n/routes";
import about from "./pages/about.json";
import collection from "./pages/collection.json";
import contact from "./pages/contact.json";
import events from "./pages/events.json";
import home from "./pages/home.json";
import interfaceCopy from "./pages/interface.json";
import referenceLabels from "./pages/reference-labels.json";
import resourceSummaries from "./pages/resource-summaries.json";
import resources from "./pages/resources.json";
import visit from "./pages/visit.json";

export const content = {
  home,
  about,
  collection,
  visit,
  events,
  resources,
  contact,
  interface: interfaceCopy,
  "reference-labels": referenceLabels,
  "resource-summaries": resourceSummaries,
};
// Spanish supplies the key shape; the build checks both languages have those keys.
export function getCopy<P extends keyof typeof content>(
  page: P,
  locale: Locale,
): (typeof content)[P]["es"] {
  return content[page][locale] as (typeof content)[P]["es"];
}
