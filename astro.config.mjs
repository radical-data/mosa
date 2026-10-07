import { defineConfig, fontProviders } from "astro/config";
import { validateLocalisation } from "./scripts/validate-localisation.ts";
import { siteURL } from "./src/i18n/routes.ts";

// Astro's Fontshare adapter currently expands variable ranges into static weights.
const generalSansVariableProvider = {
  name: "fontshare-general-sans-variable",
  resolveFont: () => ({
    fonts: [
      {
        src: [
          {
            url: "https://cdn.fontshare.com/wf/LHQJ5KSAL7VGAEIDSTEXCCOIUKFLT2I6/GW57XUEG4ZBVMLZZTQZTGYPROITRRQ5W/JA3IZUEMJ2J6WWT2OQVJOAWDXO3YL4YG.woff2",
            format: "woff2",
          },
        ],
        weight: [200, 700],
        style: "normal",
      },
    ],
  }),
};

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
      provider: generalSansVariableProvider,
      weights: ["200 700"],
      styles: ["normal"],
      display: "swap",
      fallbacks: ["Arial", "sans-serif"],
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
