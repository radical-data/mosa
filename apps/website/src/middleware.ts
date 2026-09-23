import { defineMiddleware } from "astro:middleware";
import { pageIds, pagePath } from "./i18n/routes";

const redirects = new Map<string, string>([["/", "/es/"]]);
for (const page of pageIds) {
  if (page === "home") continue;
  redirects.set(`/${page}`, pagePath(page, "es"));
  redirects.set(`/${page}/`, pagePath(page, "es"));
}

export const onRequest = defineMiddleware(async ({ url }, next) => {
  const target = redirects.get(url.pathname);
  if (target) {
    const destination = new URL(target, url);
    destination.search = url.search;
    return new Response(null, { status: 301, headers: { Location: destination.href } });
  }
  const response = await next();
  if (/^\/(?:es\/(?:coleccion|visita)|en\/(?:collection|visit))\//.test(url.pathname))
    response.headers.set("Cache-Control", "no-store");
  return response;
});
