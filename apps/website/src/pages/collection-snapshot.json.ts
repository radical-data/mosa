import type { APIRoute } from "astro";
import { liveCollection } from "../data/live-collection";

export const GET: APIRoute = async () => {
  try {
    return Response.json(await liveCollection(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return new Response("Public collection unavailable", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
};
