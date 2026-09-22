import { afterEach, expect, it, vi } from "vitest";
import { boundedBytes, sha256, sourceStorage } from "./storage";
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
  expect(sha256(bytes)).toHaveLength(64);
  fetcher
    .mockResolvedValueOnce(new Response("duplicate", { status: 409 }))
    .mockResolvedValueOnce(new Response("wrong"));
  await expect(sourceStorage().put("abc/def/abc", bytes, "application/pdf")).rejects.toThrow(
    /checksum/,
  );
});
