import type { APIRoute } from "astro";
import { researchTransaction } from "../../../../lib/capture/access";
import { CaptureError } from "../../../../lib/capture/model";
import { sha256, sourceStorage } from "../../../../lib/sources/storage";
import { getVersion } from "../../../../lib/sources/store";

export const GET: APIRoute = async ({ params, locals }) => {
  const version = await researchTransaction(locals.researcher, (c) =>
    getVersion(c, params.id ?? ""),
  );
  if (version.state !== "ready") throw new CaptureError("This source upload is not finished.");
  const bytes = await sourceStorage().get(version.storage_key);
  if (sha256(bytes) !== version.sha256) throw new Error("Source checksum mismatch");
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": version.media_type,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(version.filename)}`,
      "Content-Security-Policy": "sandbox; default-src 'none'",
      "X-Content-Type-Options": "nosniff",
    },
  });
};
