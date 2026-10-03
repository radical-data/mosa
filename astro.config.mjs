import { defineConfig, fontProviders } from "astro/config";
import { validateLocalisation } from "./scripts/validate-localisation.ts";
import { siteURL } from "./src/i18n/routes.ts";
export default defineConfig({
  site: siteURL,
  output: "static",
  trailingSlash: "ignore",
  i18n: {
    defaultLocale: "es",
    locales: ["es", "en"],
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  integrations: [
    { name: "localisation-checks", hooks: { "astro:build:start": () => validateLocalisation() } },
  ],
  fonts: [
    {
      name: "General Sans",
      cssVariable: "--font-general-sans",
      provider: fontProviders.local(),
      weights: [300, 400, 500, 600],
      styles: ["normal"],
      display: "swap",
      fallbacks: ["Arial", "sans-serif"],
      options: {
        variants: [
          { src: ["./src/assets/fonts/general-sans-300.woff2"], weight: 300, style: "normal" },
          { src: ["./src/assets/fonts/general-sans-400.woff2"], weight: 400, style: "normal" },
          { src: ["./src/assets/fonts/general-sans-500.woff2"], weight: 500, style: "normal" },
          { src: ["./src/assets/fonts/general-sans-600.woff2"], weight: 600, style: "normal" },
        ],
      },
    },
    {
      name: "MoSA English Fallback",
      cssVariable: "--font-noto-sans-eng",
      provider: fontProviders.local(),
      weights: [400],
      styles: ["normal"],
      display: "swap",
      fallbacks: [],
      optimizedFallbacks: false,
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/noto-sans-eng.woff2"],
            weight: 400,
            style: "normal",
            unicodeRange: ["U+014A-014B"],
          },
        ],
      },
    },
  ],
  server: { host: "0.0.0.0", port: 4322 },
  preview: { host: "0.0.0.0", port: 4322 },
});
