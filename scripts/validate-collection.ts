import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseEditorialFrontmatter,
  parseObject,
  parseSource,
  validateCollection,
  validateEditorialSubjects,
} from "../src/data/collection-model";

const root = fileURLToPath(new URL("../collection/", import.meta.url));
const files = async (directory: string, extension: string) =>
  (await readdir(path.join(root, directory), { withFileTypes: true }).catch(() => []))
    .filter((entry) => entry.isFile() && entry.name.endsWith(extension))
    .map((entry) => entry.name)
    .sort();
const json = async (directory: string, name: string) =>
  JSON.parse(await readFile(path.join(root, directory, name), "utf8")) as unknown;

const objectNames = await files("objects", ".json");
const sourceNames = await files("sources", ".json");
const objects = await Promise.all(
  objectNames.map(async (name) => parseObject(await json("objects", name), name)),
);
const sources = await Promise.all(
  sourceNames.map(async (name) => parseSource(await json("sources", name), name)),
);
const imageEntries = await readdir(path.join(root, "images"), {
  recursive: true,
  withFileTypes: true,
}).catch(() => []);
const imageFiles = new Set(
  imageEntries
    .filter((entry) => entry.isFile() && /\.(?:avif|jpe?g|png|webp)$/i.test(entry.name))
    .map((entry) =>
      path
        .relative(path.join(root, "images"), path.join(entry.parentPath, entry.name))
        .split(path.sep)
        .join("/"),
    ),
);
for (const image of imageFiles) {
  const content = await readFile(path.join(root, "images", image));
  if (
    content.subarray(0, 42).toString("utf8").startsWith("version https://git-lfs.github.com/spec/")
  )
    throw Error(`images/${image}: Git LFS content is not hydrated`);
}
const checked = validateCollection(
  { objects, sources },
  {
    imageFiles,
  },
);
const editorialIds = new Set<string>();
for (const name of await files("editorials", ".md")) {
  const metadata = parseEditorialFrontmatter(
    await readFile(path.join(root, "editorials", name), "utf8"),
    name,
  );
  if (editorialIds.has(metadata.id)) throw Error(`${name}: duplicate editorial id ${metadata.id}`);
  editorialIds.add(metadata.id);
  validateEditorialSubjects(metadata, checked, name);
}
console.log(
  `Validated ${objects.length} objects, ${sources.length} sources, ${checked.claims.size} claims, ${imageFiles.size} images and ${editorialIds.size} editorials.`,
);
