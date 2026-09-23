import type { APIRoute } from "astro";
import { query } from "../../lib/database";
import { currentPublicCollection } from "../../lib/public-collection";

export const GET: APIRoute = async () => {
  try {
    const rows = await query<{ record: unknown }>(
      "select record from publication.published_record where visible order by item_id",
    );
    return Response.json(currentPublicCollection(rows.map((row) => row.record)), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return new Response("Public collection unavailable", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
};
