export const siteURL = "https://museumofstolenartefacts.org/";
export const locales = {
  es: { name: "Español", language: "es-CL", format: "es-CL", hreflang: "es" },
  en: { name: "English", language: "en-GB", format: "en-GB", hreflang: "en" },
} as const;
export type Locale = keyof typeof locales;
export const localeIds = Object.keys(locales) as Locale[];
export const routes = {
  home: { es: "/es/", en: "/en/" },
  about: { es: "/es/sobre-mosa/", en: "/en/about/" },
  collection: { es: "/es/coleccion/", en: "/en/collection/" },
  visit: { es: "/es/visita/", en: "/en/visit/" },
  events: { es: "/es/eventos/", en: "/en/events/" },
  resources: { es: "/es/recursos/", en: "/en/resources/" },
  contact: { es: "/es/contacto/", en: "/en/contact/" },
} as const;
export type PageId = keyof typeof routes;
export const pageIds = Object.keys(routes) as PageId[];
export function pagePath(page: PageId, locale: Locale): string {
  return routes[page][locale];
}
export function absolutePageURL(page: PageId, locale: Locale): string {
  return new URL(pagePath(page, locale), siteURL).href;
}
export type PublicSection = "sources" | "editorials";
export function publicSectionPath(section: PublicSection, locale: Locale): string {
  if (section === "sources") return locale === "en" ? "/en/sources/" : "/es/fuentes/";
  return locale === "en" ? "/en/editorials/" : "/es/editoriales/";
}
export function publicRecordPath(
  section: PublicSection | "objects",
  id: string,
  locale: Locale,
): string {
  const base =
    section === "objects" ? pagePath("collection", locale) : publicSectionPath(section, locale);
  return `${base}${encodeURIComponent(id)}/`;
}
// Anchors are stable identities shared by both templates. No guessed fragments.
export const anchors: Record<PageId, readonly string[]> = {
  home: ["main", "collection-title", "resources-title", "events-title"],
  about: ["main"],
  collection: ["main", "more-information", "collection-results"],
  visit: ["main"],
  events: ["main"],
  resources: ["main", "guide", "letter", "directory", "generator"],
  contact: ["main", "contact-privacy-title", "contact-email-help"],
};
export function languageLink(page: PageId, locale: Locale, current: URL): string {
  let targetPath = pagePath(page, locale);
  let filterKeys: string[] = [];
  const path = current.pathname;
  const sourceMatch = /^\/(?:en\/sources|es\/fuentes)(?:\/([^/]+))?\/?$/.exec(path);
  const editorialMatch = /^\/(?:en\/editorials|es\/editoriales)(?:\/([^/]+))?\/?$/.exec(path);
  const objectPrefix =
    path.startsWith(pagePath("collection", "en")) || path.startsWith(pagePath("collection", "es"));
  if (sourceMatch) {
    targetPath = sourceMatch[1]
      ? publicRecordPath("sources", decodeURIComponent(sourceMatch[1]), locale)
      : publicSectionPath("sources", locale);
    filterKeys = ["q", "kind", "topic"];
  } else if (editorialMatch) {
    targetPath = editorialMatch[1]
      ? publicRecordPath("editorials", decodeURIComponent(editorialMatch[1]), locale)
      : publicSectionPath("editorials", locale);
  } else if (page === "collection" && objectPrefix) {
    const objectMatch = /^\/(?:en\/collection|es\/coleccion)(?:\/([^/]+))?\/?$/.exec(path);
    targetPath = objectMatch?.[1]
      ? publicRecordPath("objects", decodeURIComponent(objectMatch[1]), locale)
      : pagePath(page, locale);
    filterKeys = ["q", "concept", "type", "view"];
  }
  const target = new URL(targetPath, current.origin);
  for (const key of filterKeys) {
    const value = current.searchParams.get(key);
    if (value) target.searchParams.set(key, value);
  }
  if (anchors[page].some((anchor) => `#${anchor}` === current.hash)) target.hash = current.hash;
  return `${target.pathname}${target.search}${target.hash}`;
}
