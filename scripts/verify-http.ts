import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import { localeIds, pageIds, pagePath } from "../src/i18n/routes";

const origin = process.argv[2] ?? "http://127.0.0.1:8080";
const query = "?q=Rapa%20Nui&concept=taoa&type=individual&view=list";
const rootResponse = await fetch(new URL(`/${query}`, origin), { redirect: "manual" });
assert.equal(rootResponse.status, 301, "/: permanent HTTP redirect");
const rootTarget = new URL(rootResponse.headers.get("location") ?? "", origin);
assert.equal(rootTarget.pathname + rootTarget.search, `/es/${query}`, "/: preserve query string");
assert.equal((await fetch(rootTarget, { redirect: "manual" })).status, 200, "/: no redirect loop");
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
const collectionResponse = await fetch(new URL("/es/coleccion/", origin));
assert.equal(collectionResponse.headers.get("cache-control"), "no-store");
for (const path of [
  "/about/",
  "/collection/",
  "/visit/",
  "/events/",
  "/resources/",
  "/contact/",
  "/missing-page/",
  "/es/missing-page/",
  "/en/missing-page/",
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
