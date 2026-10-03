// Keep the stable content IDs independent of Astro's image metadata imports so
// data validation and unit tests do not load the image pipeline.
export const siteImageIds = [
  "colonial-transport",
  "community-gathering",
  "funding-logo",
  "kavakava",
  "logo-dark",
  "logo-light",
  "mahute",
  "rapa-nui-absence",
  "rongorongo",
  "wooden-figure",
  "workshop",
] as const;

export type SiteImageId = (typeof siteImageIds)[number];
