import node from "@astrojs/node";
import { defineConfig } from "astro/config";
import { validateLocalisation } from "./scripts/validate-localisation.ts";
import { siteURL } from "./src/i18n/routes.ts";
export default defineConfig({
  site: siteURL,
  output: "server",
  trailingSlash: "ignore",
  i18n: {
    defaultLocale: "es",
    locales: ["es", "en"],
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  integrations: [
    { name: "localisation-checks", hooks: { "astro:build:start": () => validateLocalisation() } },
  ],
  adapter: node({ mode: "standalone" }),
  server: { host: "0.0.0.0", port: 8080 },
});
