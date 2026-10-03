import type { ImageMetadata } from "astro";
import type { SiteImageId } from "../data/site-image-ids";
import colonialTransport from "./site-images/colonial-transport.webp";
import communityGathering from "./site-images/community-gathering.webp";
import fundingLogo from "./site-images/funding-logo.webp";
import kavakava from "./site-images/kavakava.webp";
import logoDark from "./site-images/logo-dark.png";
import logoLight from "./site-images/logo-light.png";
import mahute from "./site-images/mahute.webp";
import rapaNuiAbsence from "./site-images/rapa-nui-absence.webp";
import rongorongo from "./site-images/rongorongo.webp";
import woodenFigure from "./site-images/wooden-figure.webp";
import workshop from "./site-images/workshop.webp";

export const siteImages = {
  "colonial-transport": colonialTransport,
  "community-gathering": communityGathering,
  "funding-logo": fundingLogo,
  kavakava,
  "logo-dark": logoDark,
  "logo-light": logoLight,
  mahute,
  "rapa-nui-absence": rapaNuiAbsence,
  rongorongo,
  "wooden-figure": woodenFigure,
  workshop,
} satisfies Record<SiteImageId, ImageMetadata>;
