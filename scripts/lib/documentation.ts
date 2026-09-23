import { readFile, stat } from "node:fs/promises";
import path from "node:path";

type Node = {
  type: string;
  children?: Node[];
  value?: string;
  url?: string;
  identifier?: string;
  alt?: string | null;
  position?: { start: { line: number } };
};

function* walk(node: Node): Generator<Node> {
  yield node;
  for (const child of node.children ?? []) yield* walk(child);
}

function text(node: Node): string {
  if (node.type === "html") return "";
  return node.value ?? node.alt ?? node.children?.map(text).join("") ?? "";
}

export async function documentReferences(markdown: string) {
  const [{ default: GithubSlugger }, { fromMarkdown }] = await Promise.all([
    import("github-slugger"),
    import("mdast-util-from-markdown"),
  ]);
  const nodes = [...walk(fromMarkdown(markdown))];
  const slugger = new GithubSlugger();
  const anchors = new Set<string>();
  const links: { url: string; line: number }[] = [];
  const commands: { recipe: string; line: number }[] = [];
  const definitions = new Map(
    nodes.filter((node) => node.type === "definition").map((node) => [node.identifier, node.url]),
  );
  for (const node of nodes) {
    const line = node.position?.start.line ?? 1;
    if (node.type === "heading") anchors.add(slugger.slug(text(node)));
    if (node.type === "html") {
      for (const match of (node.value ?? "").matchAll(/\b(?:id|name)=["']([^"']+)["']/gu))
        anchors.add(match[1]);
    }
    const url =
      node.type === "linkReference" || node.type === "imageReference"
        ? definitions.get(node.identifier)
        : node.type === "link" || node.type === "image"
          ? node.url
          : undefined;
    if (url) links.push({ url, line });
    if (node.type === "code" || node.type === "inlineCode") {
      for (const match of (node.value ?? "").matchAll(/\bjust\s+([a-z][\w-]*)/gu)) {
        commands.push({
          recipe: match[1],
          line: line + (node.value?.slice(0, match.index).match(/\n/g)?.length ?? 0),
        });
      }
    }
  }
  return { anchors, links, commands };
}

export async function checkDocumentation(root: string, files: string[], recipes: Set<string>) {
  const errors: string[] = [];
  let linkCount = 0;
  let commandCount = 0;
  const cache = new Map<string, Awaited<ReturnType<typeof documentReferences>>>();
  const parse = async (file: string) => {
    let document = cache.get(file);
    if (!document) {
      document = await documentReferences(await readFile(file, "utf8"));
      cache.set(file, document);
    }
    return document;
  };
  for (const file of files) {
    const absolute = path.join(root, file);
    if (!(await stat(absolute).catch(() => undefined))?.isFile()) continue;
    const document = await parse(absolute);
    for (const { recipe, line } of document.commands) {
      commandCount++;
      if (!recipes.has(recipe)) errors.push(`${file}:${line}: unknown just recipe ${recipe}`);
    }
    for (const { url, line } of document.links) {
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/iu.test(url)) continue;
      linkCount++;
      try {
        const [pathname, fragment] = url.split("#", 2);
        const target = pathname
          ? path.resolve(path.dirname(absolute), decodeURIComponent(pathname.split("?", 1)[0]))
          : absolute;
        const info = await stat(target).catch(() => undefined);
        if (!info) errors.push(`${file}:${line}: missing target ${url}`);
        else if (
          fragment &&
          info.isFile() &&
          /\.md$/iu.test(target) &&
          !(await parse(target)).anchors.has(decodeURIComponent(fragment))
        ) {
          errors.push(`${file}:${line}: missing anchor ${url}`);
        }
      } catch (error) {
        errors.push(`${file}:${line}: invalid link ${url}: ${String(error)}`);
      }
    }
  }
  return { errors, linkCount, commandCount };
}
