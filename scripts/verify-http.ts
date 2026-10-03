import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import { localeIds, pageIds, pagePath, resourceIds, resourcePath } from "../src/i18n/routes";
import { verifyWebsiteHttp } from "./lib/website-http";

const origin = process.argv[2] ?? "http://127.0.0.1:8080";
const legacyImageReference = /["'(=\s]\/images\//i;
const legacyFontReference = /["'(=\s]\/fonts\/[^\s"')]+\.woff2(?:[?#][^\s"')]+)?/i;
const builtAssetReference = /(\/_astro\/[^"'()\s,?#]+)/g;
await verifyWebsiteHttp(origin, {
  // Model HTTPS termination at the proxy while the container receives HTTP.
  "X-Forwarded-Host": "museumofstolenartefacts.org",
  "X-Forwarded-Proto": "https",
  "X-Forwarded-Port": "443",
});
const htmlPages: string[] = [];
for (const page of pageIds)
  for (const locale of localeIds) {
    const path = pagePath(page, locale);
    const response = await fetch(new URL(path, origin), { redirect: "manual" });
    assert.equal(response.status, 200, `${path}: page is served`);
    htmlPages.push(await response.text());
  }
for (const resource of resourceIds)
  for (const locale of localeIds) {
    const path = resourcePath(resource, locale);
    const response = await fetch(new URL(path, origin), { redirect: "manual" });
    assert.equal(response.status, 200, `${path}: resource page`);
    const html = await response.text();
    assert.match(html, /<main[\s>]/, `${path}: rendered resource content`);
    htmlPages.push(html);
  }
const objectIds = (await readdir(new URL("../collection/objects/", import.meta.url)))
  .filter((name) => name.endsWith(".json"))
  .map((name) => name.slice(0, -5));
for (const objectId of objectIds)
  for (const locale of localeIds) {
    const collection = locale === "es" ? "coleccion" : "collection";
    const response = await fetch(new URL(`/${locale}/${collection}/${objectId}/`, origin));
    assert.equal(response.status, 200, `${locale}/${collection}/${objectId}: object page`);
    assert.match(await response.text(), /data-record-id=/, `${objectId}: rendered object record`);
  }
const homepage = await fetch(new URL("/es/", origin));
assert.equal(homepage.status, 200, "Spanish homepage is served");
const homepageHTML = await homepage.text();
const englishHomepage = await fetch(new URL(pagePath("home", "en"), origin));
assert.equal(englishHomepage.status, 200, "English homepage is served");
const englishHomepageHTML = await englishHomepage.text();
htmlPages.push(homepageHTML, englishHomepageHTML);
const picture = englishHomepageHTML.match(/<picture\b[^>]*>[\s\S]*?<\/picture>/i)?.[0];
assert.ok(picture, "English homepage includes a responsive picture");
assert.match(picture, /<img\b[^>]*\bsrcset=/i, "responsive image has a srcset");
assert.match(picture, /<img\b[^>]*\bsizes=/i, "responsive image has sizes");
assert.match(
  picture,
  /<img\b[^>]*\bwidth="\d+"[^>]*\bheight="\d+"/i,
  "responsive image has intrinsic dimensions",
);
assert.match(picture, /<source\b[^>]*type="image\/avif"/i, "responsive image offers AVIF");
assert.match(picture, /<source\b[^>]*type="image\/webp"/i, "responsive image offers WebP");

for (const [index, html] of htmlPages.entries()) {
  assert.doesNotMatch(
    html,
    legacyImageReference,
    `active HTML ${index + 1}: no legacy /images/ references`,
  );
  assert.doesNotMatch(
    html,
    legacyFontReference,
    `active HTML ${index + 1}: no legacy /fonts/*.woff2 references`,
  );
}

const siteAssetPaths = new Set<string>();
for (const html of htmlPages)
  for (const match of html.matchAll(builtAssetReference)) siteAssetPaths.add(match[1]);
assert.ok(siteAssetPaths.size, "active pages reference built fingerprinted assets");
const stylesheetPaths = new Set<string>();
for (const html of htmlPages)
  for (const tag of html.matchAll(/<link\b[^>]*>/gi))
    if (/\brel="stylesheet"/i.test(tag[0])) {
      const path = tag[0].match(/\bhref="(\/_astro\/[^"?#]+\.css)(?:[?#][^"]*)?"/i)?.[1];
      if (path) stylesheetPaths.add(path);
    }
const homepageStylesheetPaths = new Set<string>();
for (const html of [homepageHTML, englishHomepageHTML])
  for (const tag of html.matchAll(/<link\b[^>]*>/gi))
    if (/\brel="stylesheet"/i.test(tag[0])) {
      const path = tag[0].match(/\bhref="(\/_astro\/[^"?#]+\.css)(?:[?#][^"]*)?"/i)?.[1];
      if (path) homepageStylesheetPaths.add(path);
    }
assert.ok(homepageStylesheetPaths.size, "English homepage references built stylesheets");
for (const path of stylesheetPaths) {
  const response = await fetch(new URL(path, origin), { redirect: "manual" });
  assert.equal(response.status, 200, `${path}: homepage stylesheet is served`);
  const css = await response.text();
  assert.doesNotMatch(css, legacyImageReference, `${path}: no legacy /images/ references`);
  assert.doesNotMatch(css, legacyFontReference, `${path}: no legacy /fonts/*.woff2 references`);
  if (homepageStylesheetPaths.has(path)) {
    assert.doesNotMatch(css, /visit-map/i, `${path}: homepage CSS excludes Visit Map styles`);
    assert.doesNotMatch(
      css,
      /resource-guide/i,
      `${path}: homepage CSS excludes resource guide styles`,
    );
  }
  for (const match of css.matchAll(builtAssetReference)) siteAssetPaths.add(match[1]);
}
for (const assetPath of siteAssetPaths) {
  const asset = await fetch(new URL(assetPath, origin), { redirect: "manual" });
  assert.equal(asset.status, 200, `${assetPath}: fingerprinted asset is served`);
  assert.equal(
    asset.headers.get("cache-control"),
    "public, max-age=31536000, immutable",
    `${assetPath}: immutable cache policy`,
  );
  await asset.body?.cancel();
}
for (const path of [
  "/about/",
  "/collection/",
  "/visit/",
  "/events/",
  "/resources/",
  "/contact/",
  "/nl/",
  "/rap/",
  "/es/about/",
  "/es/coleccion/588adff0-0fe0-4ed5-9fbf-1f95c3211c7a/",
]) {
  const response = await fetch(new URL(path, origin), { redirect: "manual" });
  assert.equal(response.status, 404, `${path}: genuine 404`);
}
console.log(
  `Verified the root redirect, fourteen pages, ${resourceIds.length * localeIds.length} resource pages, ${objectIds.length * localeIds.length} object pages, responsive images, immutable asset caching and genuine 404s.`,
);
