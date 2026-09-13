import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://museumofstolenartefacts.org",
  output: "static",
  trailingSlash: "always",
  integrations: [sitemap()],
  server: { port: 4322 },
});
