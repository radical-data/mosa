import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import { validateLocalisation } from "./scripts/validate-localisation.ts";
import { localeIds, locales, pageIds, pagePath, siteURL } from "./src/i18n/routes.ts";

const pageURLs = pageIds.flatMap((page) =>
  localeIds.map((locale) => new URL(pagePath(page, locale), siteURL).href),
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
      filter: (page) => pageURLs.includes(page),
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
        return item;
      },
    }),
  ],
  server: { port: 4322 },
});
