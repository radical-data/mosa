import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseCollection } from "@mosa/public-collection";
import {
  absolutePageURL,
  anchors,
  localeIds,
  locales,
  pageIds,
  pagePath,
  siteURL,
} from "../src/i18n/routes";

const output = fileURLToPath(new URL("../dist/", import.meta.url));
const attribute = (tag: string, name: string) =>
  new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1]?.replaceAll("&amp;", "&");
const readPage = (path: string) => readFileSync(resolve(output, `.${path}`, "index.html"), "utf8");
let checked = 0;
const sitemap = readFileSync(resolve(output, "sitemap-0.xml"), "utf8");
assert.equal((sitemap.match(/<loc>/g) ?? []).length, pageIds.length * 2);
for (const page of pageIds)
  for (const locale of localeIds) {
    const path = pagePath(page, locale);
    const html = readPage(path);
    const label = `${page}.${locale}`;
    assert.ok(
      html.includes(`<html lang="${locales[locale].language}">`),
      `${label}: document language`,
    );
    assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1, `${label}: one main heading`);
    assert.ok(html.includes('id="main"'), `${label}: skip link target`);
    assert.ok(
      !html.includes('name="robots" content="noindex'),
      `${label}: public page is indexable`,
    );
    const links = Array.from(html.matchAll(/<link\b[^>]*>/g), ([tag]) => tag);
    assert.equal(
      attribute(links.find((tag) => attribute(tag, "rel") === "canonical") ?? "", "href"),
      absolutePageURL(page, locale),
    );
    for (const id of localeIds) {
      assert.equal(
        attribute(
          links.find((tag) => attribute(tag, "hreflang") === locales[id].hreflang) ?? "",
          "href",
        ),
        absolutePageURL(page, id),
      );
      assert.ok(sitemap.includes(`hreflang="${id}" href="${absolutePageURL(page, id)}"`));
      assert.ok(
        Array.from(html.matchAll(/<a\b[^>]*>/g), ([tag]) => tag).some(
          (tag) =>
            tag.includes("data-language-link") &&
            attribute(tag, "href") === pagePath(page, id) &&
            attribute(tag, "lang") === locales[id].language,
        ),
        `${label}: native language link to ${id}`,
      );
    }
    assert.equal(
      attribute(links.find((tag) => attribute(tag, "hreflang") === "x-default") ?? "", "href"),
      absolutePageURL(page, "es"),
    );
    assert.ok(
      html.includes("Open Call Fresh Perspectives 2024") &&
        html.includes('src="/images/funding-logo.webp"'),
      `${label}: funding acknowledgement`,
    );
    for (const anchor of anchors[page])
      assert.ok(html.includes(`id="${anchor}"`), `${label}: declared fragment ${anchor}`);
    // Check every native internal link, including cross-page fragments, without running JS.
    for (const [tag] of html.matchAll(/<a\b[^>]*>/g)) {
      const href = attribute(tag, "href");
      if (!href || href.startsWith("mailto:")) continue;
      const target = new URL(href, new URL(path, siteURL));
      if (target.origin !== new URL(siteURL).origin) continue;
      assert.ok(target.pathname.endsWith("/"), `${label}: unexpected internal URL ${href}`);
      assert.ok(
        existsSync(resolve(output, `.${target.pathname}`, "index.html")),
        `${label}: dead internal link ${href}`,
      );
      if (target.hash)
        assert.ok(
          readPage(target.pathname).includes(`id="${decodeURIComponent(target.hash.slice(1))}"`),
          `${label}: dead fragment ${href}`,
        );
    }
    assert.ok(
      !html.includes("[object Object]") && !html.includes(">undefined<"),
      `${label}: broken interpolation`,
    );
    checked++;
  }
assert.ok(!existsSync(resolve(output, "index.html")), "The root redirect belongs to the HTTP host");
assert.ok(
  !sitemap.includes("404.html") && !sitemap.includes(`<loc>${siteURL}about/</loc>`),
  "No legacy routes or error pages in sitemap",
);
console.log(
  `Verified ${checked} static pages: native links, fragments, languages, canonicals, sitemap and funding.`,
);

const collection = parseCollection(
  JSON.parse(readFileSync(resolve(output, "collection-snapshot.json"), "utf8")),
);
for (const locale of localeIds) {
  const html = readPage(pagePath("collection", locale));
  assert.ok(html.includes(`data-release-id="${collection.releaseId}"`));
  assert.equal((html.match(/data-record-id=/g) ?? []).length, collection.records.length);
  assert.ok(!html.includes('id="concept-filter"') && !html.includes('id="type-filter"'));
  assert.ok(!html.includes('class="collection-image"'));
  assert.ok(
    readPage(pagePath("visit", locale)).includes(`data-release-id="${collection.releaseId}"`),
  );
  assert.ok(!readPage(pagePath("home", locale)).includes("?concept="));
  for (const record of collection.records)
    assert.ok(html.includes(`data-record-id="${record.id}"`));
}
console.log(
  `Verified public collection release ${collection.releaseId}: ${collection.records.length} records.`,
);
