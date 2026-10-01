import assert from "node:assert/strict";
import { localeIds, pagePath, publicRecordPath, publicSectionPath } from "../../src/i18n/routes";

/** Small public HTTP contract, used by both container tests and release verification. */
export async function verifyWebsiteHttp(
  origin: string,
  headers?: RequestInit["headers"],
): Promise<void> {
  const request = (path: string) =>
    fetch(new URL(path, origin), {
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
      headers,
    });
  const query = `?q=Rapa%20Nui&concept=taoa&type=individual&view=list&verify=${Date.now()}`;
  for (const path of ["/", ...localeIds.map((locale) => `/${locale}`)])
    for (const search of ["", query]) {
      const response = await request(`${path}${search}`);
      assert.equal(response.status, 301, `${path}: permanent HTTP redirect`);
      const location = response.headers.get("location");
      assert.ok(location, `${path}: redirect has a Location header`);
      const target = new URL(location, origin);
      assert.equal(target.origin, new URL(origin).origin, `${path}: preserve the public origin`);
      assert.equal(
        location,
        `${path === "/" ? pagePath("home", "es") : `${path}/`}${search}`,
        `${path}: relative redirect preserves the path and query string`,
      );
      assert.equal(
        response.headers.get("cache-control"),
        "no-cache",
        `${path}: revalidate redirects`,
      );
      await response.body?.cancel();
    }

  for (const locale of localeIds)
    for (const page of ["home", "collection"] as const) {
      const path = pagePath(page, locale);
      const response = await request(`${path}${query}`);
      assert.equal(response.status, 200, `${path}: page is available without another redirect`);
      assert.equal(response.headers.get("cache-control"), "no-cache", `${path}: revalidate pages`);
      const html = await response.text();
      assert.match(html, /<html[\s>]/i, `${path}: HTML page`);
      if (page === "collection")
        assert.match(html, /data-record-id=/, `${path}: rendered collection`);
    }

  const sourceId = "bm-hoa-hakananai-a-photograph";
  const articleId = "hoa-haka-nana-ia";
  for (const locale of localeIds) {
    for (const [path, marker] of [
      [publicSectionPath("sources", locale), "source-index"],
      [publicRecordPath("sources", sourceId, locale), "data-record-id="],
      [publicSectionPath("articles", locale), "article-index"],
      [publicRecordPath("articles", articleId, locale), "article-body"],
    ]) {
      const response = await request(path);
      assert.equal(response.status, 200, `${path}: public collection route`);
      assert.equal(response.headers.get("cache-control"), "no-cache", `${path}: revalidate pages`);
      assert.match(await response.text(), new RegExp(marker), `${path}: expected rendered content`);
    }
  }

  for (const path of [
    "/missing-page/",
    "/es/missing-page/",
    "/en/missing-page/",
    "/_astro/missing.js",
  ]) {
    const response = await request(`${path}${query}`);
    assert.equal(response.status, 404, `${path}: genuine 404`);
    assert.equal(response.headers.get("cache-control"), "no-cache", `${path}: revalidate errors`);
    assert.match(await response.text(), /<html[\s>]/i, `${path}: custom HTML error page`);
  }
}
