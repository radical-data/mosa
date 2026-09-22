import { afterEach, expect, it, vi } from "vitest";
import { boundedBytes, SourceStorageError, sha256, sourceStorage } from "./storage";
import { validatePdf } from "./store";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
it("rejects disguised, empty and oversized PDF uploads", () => {
  expect(() => validatePdf(Buffer.from("<html>"), "application/pdf")).toThrow(/PDF/);
  expect(() => validatePdf(Buffer.from("%PDF-1.4\n"), "text/html")).toThrow(/PDF/);
  expect(() => validatePdf(Buffer.alloc(20_000_001), "application/pdf")).toThrow(/20 MB/);
  expect(() => validatePdf(Buffer.from("%PDF-1.4\n%%EOF"), "application/pdf")).not.toThrow();
});
it("bounds content without trusting content-length", async () => {
  await expect(
    boundedBytes(new Response("12345", { headers: { "Content-Length": "1" } }), 4),
  ).rejects.toThrow(/size/);
});
it("verifies immutable bytes after retrying an already stored upload", async () => {
  vi.stubEnv("SOURCE_STORAGE_URL", "https://storage.example");
  vi.stubEnv("SOURCE_STORAGE_KEY", "secret");
  const bytes = Buffer.from("%PDF-1.4\n%%EOF");
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(new Response("duplicate", { status: 409 }))
    .mockResolvedValueOnce(new Response(bytes));
  vi.stubGlobal("fetch", fetcher);
  await sourceStorage().put("abc/def/abc", bytes, "application/pdf");
  expect(fetcher.mock.calls[0][1].headers["x-upsert"]).toBe("false");
  expect(fetcher.mock.calls[0][1].headers.Authorization).toBe("Bearer secret");
  expect(sha256(bytes)).toHaveLength(64);
  fetcher
    .mockResolvedValueOnce(new Response("duplicate", { status: 409 }))
    .mockResolvedValueOnce(new Response("wrong"));
  await expect(sourceStorage().put("abc/def/abc", bytes, "application/pdf")).rejects.toThrow(
    /checksum/,
  );
});
it("reports missing runtime storage credentials before making a request", () => {
  vi.stubEnv("SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("SOURCE_STORAGE_URL", undefined);
  vi.stubEnv("SOURCE_STORAGE_KEY", "  ");
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  expect(sourceStorage).toThrow(SourceStorageError);
  expect(sourceStorage).toThrow(/administrator needs to finish storage setup/);
  expect(fetcher).not.toHaveBeenCalled();
});
it("uses modern secret keys only as API keys for both upload and read-back", async () => {
  vi.stubEnv("SOURCE_STORAGE_URL", "https://storage.example");
  vi.stubEnv("SOURCE_STORAGE_KEY", " sb_secret_example ");
  const bytes = Buffer.from("original source");
  const fetcher = vi.fn(async (_url: URL, options: RequestInit) => {
    const headers = new Headers(options.headers);
    if (headers.has("authorization") || headers.get("apikey") !== "sb_secret_example")
      return new Response("Invalid JWT", { status: 401 });
    return new Response(options.method === "POST" ? "{}" : bytes);
  });
  vi.stubGlobal("fetch", fetcher);
  await sourceStorage().put("abc/def/abc", bytes, "text/html");
  expect(fetcher).toHaveBeenCalledTimes(2);
});
it("reports a rejected upload without exposing the key or service response", async () => {
  vi.stubEnv("SOURCE_STORAGE_URL", "https://storage.example");
  vi.stubEnv("SOURCE_STORAGE_KEY", "sb_secret_example");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response("private service detail", { status: 403 })),
  );
  await expect(
    sourceStorage().put("abc/def/abc", Buffer.from("source"), "text/html"),
  ).rejects.toMatchObject({
    code: "storage_upload_failed",
    status: 403,
    message: expect.not.stringMatching(/sb_secret|private service detail/),
  });
});
