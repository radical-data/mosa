import { describe, expect, it } from "vitest";
import { runSourceCli } from "./source";

describe("source CLI argument validation", () => {
  it("allows at most one optional source ID for capture", async () => {
    await expect(
      runSourceCli(["capture", "one", "two", "--url", "https://example.org/item"]),
    ).rejects.toThrow("capture accepts at most one source ID");
  });

  it("rejects unknown capture options and a missing URL before launching a browser", async () => {
    await expect(runSourceCli(["capture", "--unexpected", "value"])).rejects.toThrow(
      "Unknown option --unexpected",
    );
    await expect(runSourceCli(["capture"])).rejects.toThrow("--url is required");
  });
});
