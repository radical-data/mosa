import type { APIRoute } from "astro";
import { collectionObjects, editorialPublications, sourceRecords } from "../data/collection";
import {
  localeIds,
  locales,
  pageIds,
  pagePath,
  publicRecordPath,
  publicSectionPath,
  siteURL,
} from "../i18n/routes";

const escapeXML = (value: string) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
const item = (paths: Record<"es" | "en", string>, locale: "es" | "en") => {
  const links = localeIds.map(
    (id) =>
      `<xhtml:link rel="alternate" hreflang="${locales[id].hreflang}" href="${escapeXML(new URL(paths[id], siteURL).href)}"/>`,
  );
  links.push(
    `<xhtml:link rel="alternate" hreflang="x-default" href="${escapeXML(new URL(paths.es, siteURL).href)}"/>`,
  );
  return `<url><loc>${escapeXML(new URL(paths[locale], siteURL).href)}</loc>${links.join("")}</url>`;
};

export const GET: APIRoute = async () => {
  const urls = pageIds.flatMap((page) => {
    const paths = { es: pagePath(page, "es"), en: pagePath(page, "en") };
    return localeIds.map((locale) => item(paths, locale));
  });
  for (const record of collectionObjects)
    for (const locale of localeIds)
      urls.push(
        item(
          {
            es: `${pagePath("collection", "es")}${record.id}/`,
            en: `${pagePath("collection", "en")}${record.id}/`,
          },
          locale,
        ),
      );
  for (const source of sourceRecords)
    for (const locale of localeIds)
      urls.push(
        item(
          {
            es: publicRecordPath("sources", source.id, "es"),
            en: publicRecordPath("sources", source.id, "en"),
          },
          locale,
        ),
      );
  for (const editorial of editorialPublications)
    for (const locale of localeIds)
      urls.push(
        item(
          {
            es: publicRecordPath("editorials", editorial.id, "es"),
            en: publicRecordPath("editorials", editorial.id, "en"),
          },
          locale,
        ),
      );
  for (const section of ["sources", "editorials"] as const) {
    const paths = {
      es: publicSectionPath(section, "es"),
      en: publicSectionPath(section, "en"),
    };
    for (const locale of localeIds) urls.push(item(paths, locale));
  }
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join("")}</urlset>`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
};
