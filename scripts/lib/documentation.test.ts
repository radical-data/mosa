import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { checkDocumentation, documentReferences } from "./documentation";

describe("documentation checks", () => {
  it("handles reference links, Unicode and duplicate headings, and ignores links in code", async () => {
    const parsed = await documentReferences(
      [
        "# Café and `code`",
        "# Café and code",
        "Setext heading\n---",
        "[guide][ref]",
        "![image](image.png)",
        "[ref]: <guide with spaces.md#café>",
        "```sh",
        "just test-unit scripts/example.test.ts",
        "[fake](missing.md)",
        "```",
        "Prose just mentions things. Use `just docs-check`.",
      ].join("\n\n"),
    );
    expect([...parsed.anchors]).toEqual(["café-and-code", "café-and-code-1", "setext-heading"]);
    expect(parsed.links.map((link) => link.url)).toEqual([
      "guide with spaces.md#café",
      "image.png",
    ]);
    expect(parsed.commands.map((command) => command.recipe)).toEqual(["test-unit", "docs-check"]);
  });

  it("reports broken files, anchors and recipes while accepting valid local and external links", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "mosa-docs-test-"));
    try {
      await writeFile(path.join(root, "guide.md"), "# Café\n\n# Café\n");
      await writeFile(
        path.join(root, "README.md"),
        [
          "[valid](guide.md#caf%C3%A9-1)",
          "[directory](.)",
          "[web](https://example.org/missing)",
          "[missing](absent.md)",
          "[anchor](guide.md#absent)",
          "`just missing-recipe`",
          "`just dev`",
        ].join("\n\n"),
      );
      const result = await checkDocumentation(root, ["README.md"], new Set(["dev"]));
      expect(result.errors).toHaveLength(3);
      expect(result.errors.join("\n")).toContain("missing target absent.md");
      expect(result.errors.join("\n")).toContain("missing anchor guide.md#absent");
      expect(result.errors.join("\n")).toContain("unknown just recipe missing-recipe");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
