import assert from "node:assert/strict";
import { localeIds, pageIds, pagePath } from "../src/i18n/routes";

const origin = process.argv[2] ?? "http://127.0.0.1:8080";
for (const page of pageIds) {
  const legacy = page === "home" ? ["/"] : [`/${page}`, `/${page}/`];
  for (const path of legacy) {
    const query = "?q=Rapa%20Nui&concept=taoa&type=individual&view=list";
    const response = await fetch(new URL(path + query, origin), { redirect: "manual" });
    assert.equal(response.status, 301, `${path}: permanent HTTP redirect`);
    const target = new URL(response.headers.get("location") ?? "", origin);
    assert.equal(
      target.pathname + target.search,
      pagePath(page, "es") + query,
      `${path}: preserve query string`,
    );
    const destination = await fetch(target, { redirect: "manual" });
    assert.equal(destination.status, 200, `${path}: no redirect loop`);
  }
}
for (const page of pageIds)
  for (const locale of localeIds) {
    assert.equal(
      (await fetch(new URL(pagePath(page, locale), origin), { redirect: "manual" })).status,
      200,
    );
  }
for (const path of [
  "/missing-page/",
  "/es/missing-page/",
  "/en/missing-page/",
  "/nl/",
  "/rap/",
  "/es/about/",
]) {
  const response = await fetch(new URL(path, origin), { redirect: "manual" });
  assert.equal(response.status, 404, `${path}: genuine 404`);
}
console.log(
  "Verified all legacy 301 redirects, preserved queries, fourteen pages, no redirect loops and genuine 404s.",
);
