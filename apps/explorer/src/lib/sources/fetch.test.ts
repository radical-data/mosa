import { describe, expect, it } from "vitest";
import { captureUrl, publicAddress, publicUrl, readable } from "./fetch";

const bytes = (s: string) => Buffer.from(s);
const html =
  "<html><body><h1>Wooden figure</h1><p>Catalogue entry describing a wooden figure from Rapa Nui.</p><script>steal()</script></body></html>";
describe("bounded catalogue preservation", () => {
  it("rejects non-public destinations, alternative IP notation and unsafe protocols", () => {
    for (const ip of [
      "127.0.0.1",
      "10.0.0.1",
      "169.254.169.254",
      "100.64.1.2",
      "192.168.1.1",
      "::1",
      "::ffff:127.0.0.1",
      "fc00::1",
      "2002:7f00:1::",
    ])
      expect(publicAddress(ip)).toBe(false);
    for (const url of [
      "http://2130706433",
      "http://0x7f000001",
      "https://user:pass@example.org",
      "file:///a",
      "http://example.org:8000",
    ])
      expect(() => publicUrl(url)).toThrow();
    expect(publicAddress("8.8.8.8")).toBe(true);
  });
  it("checks all DNS answers and every redirect before requesting it", async () => {
    let calls = 0;
    const transport = async () => {
      calls++;
      return { status: 302, headers: { location: "http://127.0.0.1/secrets" }, bytes: bytes("") };
    };
    await expect(
      captureUrl(
        "https://example.org",
        async () => [
          { address: "8.8.8.8", family: 4 },
          { address: "10.1.1.1", family: 4 },
        ],
        transport,
      ),
    ).rejects.toThrow(/non-public/);
    expect(calls).toBe(0);
    await expect(
      captureUrl("https://example.org", async () => [{ address: "8.8.8.8", family: 4 }], transport),
    ).rejects.toThrow(/public web/);
    expect(calls).toBe(1);
  });
  it("preserves original bytes and a script-free readable derivative", async () => {
    const result = await captureUrl(
      "https://example.org/item",
      async () => [{ address: "8.8.8.8", family: 4 }],
      async (_u, address) => {
        expect(address.address).toBe("8.8.8.8");
        return { status: 200, headers: { "content-type": "text/html" }, bytes: bytes(html) };
      },
    );
    expect(result.bytes).toEqual(bytes(html));
    expect(result.text).toContain("Wooden figure");
    expect(result.text).not.toContain("steal");
  });
  it("fails challenges, login pages, empty shells, invalid JSON and excess bytes", () => {
    for (const value of [
      "<script>render()</script>",
      "<p>Verify you are human before opening this collection catalogue</p>",
      '<input type="password">',
    ])
      expect(() => readable(bytes(value), "text/html")).toThrow();
    expect(() => readable(bytes("{broken"), "application/json")).toThrow();
    expect(() => readable(new Uint8Array(2_000_001), "text/html")).toThrow();
  });
});
