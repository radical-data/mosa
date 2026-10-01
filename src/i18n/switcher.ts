// Progressive enhancement only: every language link has an ordinary equivalent URL.
export function updateLanguageLinks() {
  for (const link of document.querySelectorAll<HTMLAnchorElement>("[data-language-link]")) {
    const target = new URL(link.href);
    target.search = "";
    if (link.dataset.page === "collection") {
      const parameters = new URLSearchParams(location.search);
      const sourceRoute = /^\/(?:en\/sources|es\/fuentes)(?:\/[^/]+)?\/?$/.test(location.pathname);
      const keys = sourceRoute ? ["q", "kind", "topic"] : ["q", "concept", "type", "view"];
      for (const key of keys) {
        const value = parameters.get(key);
        if (value) target.searchParams.set(key, value);
      }
    }
    const anchors: string[] = JSON.parse(link.dataset.anchors ?? "[]");
    target.hash = anchors.some((anchor) => `#${anchor}` === location.hash) ? location.hash : "";
    link.href = `${target.pathname}${target.search}${target.hash}`;
  }
}
