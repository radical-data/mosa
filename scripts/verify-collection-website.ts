import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { runCommand } from "./lib/run-command";

// Runs sequentially: temporarily substitutes a synthetic public snapshot, then
// restores the original even after a failed build. Never run alongside a build.
async function verify() {
  const file = "apps/website/public/collection-snapshot.json";
  const original = await readFile(file, "utf8");
  const statement = {
    text: "PUBLIC-OBJECT-SENTINEL",
    language: "rap",
    attributedTo: "Synthetic museum",
    sources: ["https://example.org/source"],
  };
  const snapshot = {
    schemaVersion: 1,
    releaseId: "11111111-1111-4111-8111-111111111111",
    records: [
      {
        id: "22222222-2222-4222-8222-222222222222",
        name: statement,
        holder: { ...statement, text: "PUBLIC-HOLDER-SENTINEL", language: "en" },
        identifier: {
          namespace: "test",
          value: "PUBLIC-ID-SENTINEL",
          source: "https://example.org/source",
        },
      },
    ],
  };
  const build = () =>
    runCommand("pnpm", ["--filter", "@mosa/website", "build"], { cwd: process.cwd() });
  try {
    await writeFile(file, `${JSON.stringify(snapshot)}\n`);
    await build();
    for (const page of ["es/coleccion", "en/collection"]) {
      const html = await readFile(`apps/website/dist/${page}/index.html`, "utf8");
      for (const value of [
        statement.text,
        "PUBLIC-HOLDER-SENTINEL",
        "PUBLIC-ID-SENTINEL",
        "https://example.org/source",
      ])
        assert(html.includes(value));
      assert(!html.includes("collection-mamari"));
    }
    await writeFile(
      file,
      JSON.stringify({
        ...snapshot,
        releaseId: "33333333-3333-4333-8333-333333333333",
        records: [],
      }),
    );
    await build();
    for (const page of ["es/coleccion", "en/collection", "es/visita", "en/visit"]) {
      const html = await readFile(`apps/website/dist/${page}/index.html`, "utf8");
      assert(!html.includes("PUBLIC-OBJECT-SENTINEL") && !html.includes("PUBLIC-HOLDER-SENTINEL"));
      assert(html.includes("33333333-3333-4333-8333-333333333333"));
    }
    console.log("Verified populated and withdrawn website releases in both languages.");
  } finally {
    await writeFile(file, original);
  }
  await build();
}
verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
