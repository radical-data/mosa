import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import { localeIds, pageIds, pagePath } from "../src/i18n/routes";
import { verifyWebsiteHttp } from "./lib/website-http";

const origin = process.argv[2] ?? "http://127.0.0.1:8080";
await verifyWebsiteHttp(origin, {
  // Model HTTPS termination at the proxy while the container receives HTTP.
  "X-Forwarded-Host": "museumofstolenartefacts.org",
  "X-Forwarded-Proto": "https",
  "X-Forwarded-Port": "443",
});
for (const page of pageIds)
  for (const locale of localeIds) {
    assert.equal(
      (await fetch(new URL(pagePath(page, locale), origin), { redirect: "manual" })).status,
      200,
    );
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
const assetPath = (await homepage.text()).match(/\b(?:href|src)="(\/_astro\/[^"?]+)["?]/)?.[1];
assert.ok(assetPath, "Spanish homepage references a built fingerprinted asset");
const asset = await fetch(new URL(assetPath, origin), { redirect: "manual" });
assert.equal(asset.status, 200, "fingerprinted asset is served");
assert.equal(asset.headers.get("cache-control"), "public, max-age=31536000, immutable");
await asset.body?.cancel();
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
  `Verified the root redirect, fourteen pages, ${objectIds.length * localeIds.length} object pages, cache policy and genuine 404s.`,
);
