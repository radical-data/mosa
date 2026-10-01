import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyWebsiteHttp } from "./website-http";

const origin = "https://museum.example";
const html =
  '<!doctype html><html lang="es"><section class="source-index article-index"></section><article data-record-id="object-1" class="article-body"></article></html>';

function responseFor(url: URL): Response {
  const path = url.pathname;
  const headers = { "cache-control": "no-cache" };
  if (["/", "/es", "/en"].includes(path))
    return new Response(null, {
      status: 301,
      headers: { ...headers, location: `${path === "/" ? "/es/" : `${path}/`}${url.search}` },
    });
  return new Response(html, {
    status: path.includes("missing") ? 404 : 200,
    headers,
  });
}

function serve(change?: (url: URL, response: Response) => Response) {
  const fetch = vi.fn(async (input: Parameters<typeof globalThis.fetch>[0]) => {
    const url = new URL(String(input));
    const response = responseFor(url);
    return change ? change(url, response) : response;
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

afterEach(() => vi.unstubAllGlobals());

describe("public website HTTP verification", () => {
  it("checks the public routes without following redirects or sending hosting credentials", async () => {
    const fetch = serve();
    await expect(verifyWebsiteHttp(origin)).resolves.toBeUndefined();
    const paths = fetch.mock.calls.map(([url]) => new URL(String(url)).pathname);
    expect(paths).toEqual(
      expect.arrayContaining([
        "/",
        "/es",
        "/en",
        "/es/",
        "/en/",
        "/es/coleccion/",
        "/en/collection/",
        "/en/sources/",
        "/es/fuentes/",
        "/en/articles/",
        "/es/articulos/",
        "/en/sources/bm-hoa-hakananai-a-photograph/",
        "/es/fuentes/bm-hoa-hakananai-a-photograph/",
        "/en/articles/hoa-haka-nana-ia/",
        "/es/articulos/hoa-haka-nana-ia/",
        "/missing-page/",
        "/_astro/missing.js",
      ]),
    );
    for (const call of vi.mocked(globalThis.fetch).mock.calls) {
      expect(call[1]).toMatchObject({ redirect: "manual", cache: "no-store" });
      expect(call[1]?.headers).toBeUndefined();
      expect(call[1]?.signal).toBeInstanceOf(AbortSignal);
    }
  });

  it.each([
    "http://museum.example:8080/es/",
    "https://museum.example:8080/es/",
    "http://museum.example/es/",
    "https://other.example/es/",
  ])("rejects an origin-changing redirect to %s", async (location) => {
    serve((url, response) => {
      if (url.pathname === "/") response.headers.set("location", location);
      return response;
    });
    await expect(verifyWebsiteHttp(origin)).rejects.toThrow("preserve the public origin");
  });

  it("rejects redirects that lose the query string", async () => {
    serve((url, response) => {
      if (url.pathname === "/") response.headers.set("location", "/es/");
      return response;
    });
    await expect(verifyWebsiteHttp(origin)).rejects.toThrow("query string");
  });

  it("rejects missing redirect locations", async () => {
    serve((_url, response) => {
      response.headers.delete("location");
      return response;
    });
    await expect(verifyWebsiteHttp(origin)).rejects.toThrow("Location header");
  });

  it("rejects a homepage redirect loop", async () => {
    serve((url, response) =>
      url.pathname === "/es/"
        ? new Response(null, { status: 301, headers: { location: "/" } })
        : response,
    );
    await expect(verifyWebsiteHttp(origin)).rejects.toThrow("without another redirect");
  });

  it("rejects a collection page without rendered records", async () => {
    serve((url, response) =>
      url.pathname === "/en/collection/"
        ? new Response("<html></html>", { headers: response.headers })
        : response,
    );
    await expect(verifyWebsiteHttp(origin)).rejects.toThrow("rendered collection");
  });

  it("rejects an SPA fallback for a missing page", async () => {
    serve((url, response) =>
      url.pathname === "/missing-page/"
        ? new Response(html, { headers: response.headers })
        : response,
    );
    await expect(verifyWebsiteHttp(origin)).rejects.toThrow("genuine 404");
  });

  it("rejects permanent caching of a missing asset", async () => {
    serve((url, response) => {
      if (url.pathname === "/_astro/missing.js")
        response.headers.set("cache-control", "public, max-age=31536000, immutable");
      return response;
    });
    await expect(verifyWebsiteHttp(origin)).rejects.toThrow("revalidate errors");
  });
});
