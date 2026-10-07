// Progressive enhancement only: every language link has an ordinary equivalent URL.
export function updateLanguageLinks() {
  const catalogueKeys = [
    "scope",
    "q",
    "view",
    "sort",
    "holder",
    "country",
    "kind",
    "images",
    "photos",
    "limit",
  ];
  for (const link of document.querySelectorAll<HTMLAnchorElement>("[data-language-link]")) {
    const target = new URL(link.href);
    target.search = "";
    if (link.dataset.page === "collection") {
      const parameters = new URLSearchParams(location.search);
      const isCatalogueRoute =
        /^\/(?:en\/sources|es\/fuentes)(?:\/[^/]+)?\/?$/.test(location.pathname) ||
        /^\/(?:en\/collection|es\/coleccion)(?:\/[^/]+)?\/?$/.test(location.pathname);
      for (const key of isCatalogueRoute ? catalogueKeys : []) {
        const value = parameters.get(key);
        if (value) target.searchParams.set(key, value);
      }
      // Preserve the previous collection query vocabulary for bookmarked links.
      if (/^\/(?:en\/collection|es\/coleccion)(?:\/[^/]+)?\/?$/.test(location.pathname)) {
        for (const key of ["concept", "type"]) {
          const value = parameters.get(key);
          if (value) target.searchParams.set(key, value);
        }
      }
    }
    const anchors: string[] = JSON.parse(link.dataset.anchors ?? "[]");
    target.hash = anchors.some((anchor) => `#${anchor}` === location.hash) ? location.hash : "";
    link.href = `${target.pathname}${target.search}${target.hash}`;
  }
}
