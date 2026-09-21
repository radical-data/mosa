import { afterEach, describe, expect, it, vi } from "vitest";
import { authRequest, boundedForm, checkOrigin } from "./access";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe("research HTTP boundary", () => {
  it("rejects cross-origin and missing-origin writes", () => {
    vi.stubEnv("RESEARCH_ORIGIN", "https://research.example.org");
    for (const origin of ["https://evil.example", "null", ""])
      expect(() =>
        checkOrigin(
          new Request("https://research.example.org/research", {
            method: "POST",
            headers: { origin, "content-type": "application/x-www-form-urlencoded" },
          }),
        ),
      ).toThrow();
    expect(() =>
      checkOrigin(
        new Request("https://research.example.org/research", {
          method: "POST",
          headers: {
            origin: "https://research.example.org",
            "content-type": "application/x-www-form-urlencoded",
          },
        }),
      ),
    ).not.toThrow();
  });
  it("bounds streamed form bodies even without Content-Length", async () => {
    await expect(
      boundedForm(
        new Request("http://localhost", {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: "a=".padEnd(65000, "x"),
        }),
      ),
    ).rejects.toThrow(/too large/);
  });
  it("verifies tokens with the configured Auth server, without following redirects", async () => {
    vi.stubEnv("SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "test-key");
    const fetcher = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetcher);
    await authRequest("user", undefined, "test-token");
    expect(fetcher.mock.calls[0][0].href).toBe("https://project.supabase.co/auth/v1/user");
    expect(fetcher.mock.calls[0][1]).toMatchObject({
      redirect: "error",
      headers: { Authorization: "Bearer test-token" },
    });
  });
});
