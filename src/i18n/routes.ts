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
export const resourceRoutes = {
  guide: { es: "/es/recursos/guia-de-restitucion/", en: "/en/resources/restitution-guide/" },
  letter: { es: "/es/recursos/modelo-de-carta/", en: "/en/resources/restitution-letter-template/" },
  directory: {
    es: "/es/recursos/directorio-de-organizaciones/",
    en: "/en/resources/organisation-directory/",
  },
  actors: { es: "/es/recursos/mapeo-de-actores/", en: "/en/resources/participant-map/" },
} as const;
export type ResourceId = keyof typeof resourceRoutes;
export const resourceIds = Object.keys(resourceRoutes) as ResourceId[];
export function resourcePath(resource: ResourceId, locale: Locale): string {
  return resourceRoutes[resource][locale];
}
export function pagePath(page: PageId, locale: Locale): string {
  return routes[page][locale];
}
export function absolutePageURL(page: PageId, locale: Locale): string {
  return new URL(pagePath(page, locale), siteURL).href;
}
export type PublicSection = "sources" | "articles";
export function publicSectionPath(section: PublicSection, locale: Locale): string {
  if (section === "sources") return locale === "en" ? "/en/sources/" : "/es/fuentes/";
  return locale === "en" ? "/en/articles/" : "/es/articulos/";
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
  about: ["main", "team"],
  collection: ["main", "more-information", "collection-results"],
  visit: ["main"],
  events: ["main"],
  resources: [
    "main",
    "guide",
    "letter",
    "directory",
    "actors",
    "readings",
    "begin",
    "translate",
    "sustain",
    "reconnect",
  ],
  contact: ["main", "contact-privacy-title", "contact-email-help", "newsletter"],
};
export function languageLink(page: PageId, locale: Locale, current: URL): string {
  let targetPath = pagePath(page, locale);
  let filterKeys: string[] = [];
  const path = current.pathname;
  const resourceMatch = Object.entries(resourceRoutes).find(
    ([, paths]) => paths.es === path || paths.en === path,
  );
  if (page === "resources" && resourceMatch)
    targetPath = resourcePath(resourceMatch[0] as ResourceId, locale);
  const sourceMatch = /^\/(?:en\/sources|es\/fuentes)(?:\/([^/]+))?\/?$/.exec(path);
  const articleMatch = /^\/(?:en\/articles|es\/articulos)(?:\/([^/]+))?\/?$/.exec(path);
  const objectPrefix =
    path.startsWith(pagePath("collection", "en")) || path.startsWith(pagePath("collection", "es"));
  if (sourceMatch) {
    targetPath = sourceMatch[1]
      ? publicRecordPath("sources", decodeURIComponent(sourceMatch[1]), locale)
      : publicSectionPath("sources", locale);
    filterKeys = ["q", "kind", "topic"];
  } else if (articleMatch) {
    targetPath = articleMatch[1]
      ? publicRecordPath("articles", decodeURIComponent(articleMatch[1]), locale)
      : publicSectionPath("articles", locale);
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
  const validAnchors = resourceMatch
    ? resourceMatch[0] === "guide"
      ? ["main", "begin", "translate", "sustain", "reconnect"]
      : ["main"]
    : anchors[page];
  if (validAnchors.some((anchor) => `#${anchor}` === current.hash)) target.hash = current.hash;
  return `${target.pathname}${target.search}${target.hash}`;
}
