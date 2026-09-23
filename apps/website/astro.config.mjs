import { readFileSync } from "node:fs";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import { validateLocalisation } from "./scripts/validate-localisation.ts";
import { localeIds, locales, pageIds, pagePath, siteURL } from "./src/i18n/routes.ts";

const pageURLs = pageIds.flatMap((page) =>
  localeIds.map((locale) => new URL(pagePath(page, locale), siteURL).href),
);
const publicCollection = JSON.parse(
  readFileSync(new URL("./public/collection-snapshot.json", import.meta.url), "utf8"),
);
const detailURLs = publicCollection.records.flatMap((record) =>
  "kind" in record
    ? localeIds.map(
        (locale) => new URL(`${pagePath("collection", locale)}${record.id}/`, siteURL).href,
      )
    : [],
);
export default defineConfig({
  site: siteURL,
  output: "static",
  trailingSlash: "always",
  i18n: {
    defaultLocale: "es",
    locales: ["es", "en"],
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  integrations: [
    { name: "localisation-checks", hooks: { "astro:build:start": () => validateLocalisation() } },
    sitemap({
      filter: (page) => pageURLs.includes(page) || detailURLs.includes(page),
      serialize(item) {
        const page = pageIds.find((id) =>
          localeIds.some((locale) => new URL(pagePath(id, locale), siteURL).href === item.url),
        );
        if (page)
          item.links = [
            ...localeIds.map((locale) => ({
              lang: locales[locale].hreflang,
              url: new URL(pagePath(page, locale), siteURL).href,
            })),
            { lang: "x-default", url: new URL(pagePath(page, "es"), siteURL).href },
          ];
        else if (detailURLs.includes(item.url)) {
          const record = publicCollection.records.find(
            (entry) =>
              "kind" in entry &&
              localeIds.some(
                (locale) =>
                  new URL(`${pagePath("collection", locale)}${entry.id}/`, siteURL).href ===
                  item.url,
              ),
          );
          if (record)
            item.links = [
              ...localeIds.map((locale) => ({
                lang: locales[locale].hreflang,
                url: new URL(`${pagePath("collection", locale)}${record.id}/`, siteURL).href,
              })),
              {
                lang: "x-default",
                url: new URL(`${pagePath("collection", "es")}${record.id}/`, siteURL).href,
              },
            ];
        }
        return item;
      },
    }),
  ],
  server: { port: 4322 },
});
