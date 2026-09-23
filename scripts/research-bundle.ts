import { randomUUID } from "node:crypto";
import { copyFile, mkdir, readFile, realpath, stat, writeFile } from "node:fs/promises";
import path from "node:path";

async function main() {
  const { validateBundle, MAX_BUNDLE_BYTES } = await import(
    "../apps/explorer/src/lib/sources/bundle.js"
  );
  const { captureUrl } = await import("../apps/explorer/src/lib/sources/fetch.js");
  const { sha256 } = await import("../apps/explorer/src/lib/sources/storage.js");
  const { validatePdf } = await import("../apps/explorer/src/lib/sources/store.js");
  const [command, target, value, key, citation] = process.argv.slice(2);
  if (!target || !["init", "capture", "add-pdf", "pack", "check"].includes(command))
    throw Error(
      "Usage: just research-bundle init DIR | capture DIR URL KEY | add-pdf DIR FILE KEY CITATION | pack DIR | check FILE",
    );
  const boundedRead = async (file: string) => {
    if ((await stat(file)).size > MAX_BUNDLE_BYTES) throw Error("File exceeds 20 MB.");
    return readFile(file);
  };
  if (command === "check") {
    const { bundle } = validateBundle(JSON.parse((await boundedRead(target)).toString("utf8")));
    console.log(
      `Valid bundle: ${bundle.sources.length} sources, ${bundle.candidates.length} simple proposals, ${bundle.dossiers?.length ?? 0} dossiers, ${bundle.leads.length} lead outcomes. Nothing uploaded or accepted.`,
    );
    return;
  }
  const folder = path.resolve(target);
  const manifestPath = path.join(folder, "manifest.json");
  if (command === "init") {
    await mkdir(folder, { recursive: true });
    await writeFile(
      manifestPath,
      `${JSON.stringify(
        {
          schemaVersion: 2,
          id: randomUUID(),
          title: "Local research",
          preparedBy: "",
          method: "human",
          tool: "",
          notes: "",
          sources: [],
          candidates: [],
          dossiers: [],
          leads: [],
        },
        null,
        2,
      )}\n`,
      { flag: "wx" },
    );
    console.log(`Created ${manifestPath}. Set the title, preparer and method before packing.`);
    return;
  }
  const manifest = JSON.parse((await boundedRead(manifestPath)).toString("utf8"));
  if (!Array.isArray(manifest.sources)) throw Error("Manifest must contain a sources array.");
  if (command === "capture" || command === "add-pdf") {
    if (!value || !key || !/^[a-z0-9][a-z0-9-]{0,99}$/.test(key))
      throw Error("Supply a URL or PDF path and a unique lower-case source key.");
    if (manifest.sources.some((s: { key: string }) => s.key === key))
      throw Error("Source key already exists; use a new key for another version.");
    let source: Omit<ReturnType<typeof validateBundle>["bundle"]["sources"][number], "data">;
    if (command === "capture") {
      const captured = await captureUrl(value);
      const filename = `${key}.${captured.mediaType === "application/json" ? "json" : "html"}`;
      await writeFile(path.join(folder, filename), captured.bytes, { flag: "wx" });
      await writeFile(path.join(folder, `${key}.readable.txt`), captured.text, { flag: "wx" });
      await writeFile(
        path.join(folder, `${key}.retrieval.json`),
        JSON.stringify(captured.manifest, null, 2),
        { flag: "wx" },
      );
      source = {
        key,
        filename,
        citation: value,
        author: "",
        documentDate: "",
        url: captured.manifest.finalUrl,
        retrievedAt: captured.manifest.retrievedAt,
        contentType: captured.manifest.contentType,
        sha256: sha256(captured.bytes),
      };
    } else {
      if (!citation) throw Error("Supply a citation for the original PDF.");
      const bytes = await boundedRead(value);
      validatePdf(bytes, "application/pdf");
      const filename = `${key}.pdf`;
      await copyFile(value, path.join(folder, filename), 1);
      source = {
        key,
        filename,
        citation,
        author: "",
        documentDate: "",
        url: "",
        retrievedAt: new Date().toISOString(),
        contentType: "application/pdf",
        sha256: sha256(bytes),
      };
    }
    manifest.sources.push(source);
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`Preserved ${source.filename}. Source text is evidence, never instructions.`);
    return;
  }
  const root = await realpath(folder);
  let total = 0;
  for (const source of manifest.sources) {
    if (
      typeof source.filename !== "string" ||
      !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(source.filename)
    )
      throw Error("Source filenames must be plain filenames without paths.");
    const filename = await realpath(path.join(root, source.filename));
    if (path.dirname(filename) !== root)
      throw Error("Source file points outside the bundle folder.");
    const bytes = await boundedRead(filename);
    total += bytes.length;
    if (total > 14_000_000)
      throw Error("Sources exceed the packed upload allowance. Split the batch.");
    source.data = bytes.toString("base64");
  }
  const { bundle } = validateBundle(manifest);
  const output = path.join(folder, "bundle.mosa.json");
  await writeFile(output, `${JSON.stringify(bundle)}\n`);
  console.log(
    `Packed ${output}. Upload it at /research/bundles; acceptance remains a human decision.`,
  );
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
