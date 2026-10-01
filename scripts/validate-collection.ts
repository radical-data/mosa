import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseArticleFrontmatter,
  parseObject,
  parseSource,
  validateArticleSubjects,
  validateCollection,
} from "../src/data/collection-model";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const root = path.join(repositoryRoot, "collection");
const articleRoot = path.join(repositoryRoot, "articles");
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
const articleIds = new Set<string>();
const articleNames = (await readdir(articleRoot, { withFileTypes: true }).catch(() => []))
  .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
  .map((entry) => entry.name)
  .sort();
for (const name of articleNames) {
  const metadata = parseArticleFrontmatter(
    await readFile(path.join(articleRoot, name), "utf8"),
    name,
  );
  if (articleIds.has(metadata.id)) throw Error(`${name}: duplicate article id ${metadata.id}`);
  articleIds.add(metadata.id);
  validateArticleSubjects(metadata, checked, name);
}
console.log(
  `Validated ${objects.length} objects, ${sources.length} sources, ${checked.claims.size} claims, ${imageFiles.size} images and ${articleIds.size} articles.`,
);
