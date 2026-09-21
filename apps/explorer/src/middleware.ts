import { defineMiddleware } from "astro:middleware";
import { authenticatedActor, checkOrigin } from "./lib/capture/access";
import { CaptureError } from "./lib/capture/model";

export const onRequest = defineMiddleware(async (context, next) => {
  if (!context.url.pathname.startsWith("/research")) return next();
  let response: Response;
  try {
    if (context.request.method === "POST") checkOrigin(context.request);
    if (context.url.pathname !== "/research/sign-in") {
      const actor = await authenticatedActor(context);
      if (!actor) return context.redirect("/research/sign-in", 303);
      context.locals.researcher = actor;
    }
    response = await next();
  } catch (error) {
    response = new Response(
      error instanceof CaptureError
        ? error.message
        : "Research entry is temporarily unavailable. Please try again.",
      { status: error instanceof CaptureError ? 403 : 503 },
    );
  }
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Referrer-Policy", "same-origin");
  return response;
});
