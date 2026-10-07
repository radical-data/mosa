import { shouldLoadMore } from "../components/catalogue-loading";
import { initialiseCollectionMasonry } from "../components/collection-masonry";
import type { CatalogueBrowseItem } from "../data/catalogue-browse";
import {
  catalogueParameters,
  effectiveCatalogueSort,
  matchCatalogues,
  readCatalogueState,
} from "../data/catalogue-browse";
import { formatNumber } from "./format";
import { updateLanguageLinks } from "./switcher";

const root = document.querySelector<HTMLElement>("[data-catalogue]");
const controls = root?.querySelectorAll<HTMLElement>("[data-catalogue-controls]");
const results = root?.querySelector<HTMLElement>("#collection-results");
const data = root?.querySelector<HTMLScriptElement>("#catalogue-data");
const locale = root?.dataset.locale === "es" ? "es" : "en";

if (root && controls && controls.length > 0 && results && data) {
  let items: CatalogueBrowseItem[] = [];
  try {
    items = JSON.parse(data.textContent ?? "[]") as CatalogueBrowseItem[];
  } catch {
    items = [];
  }
  const cards = new Map(
    Array.from(results.querySelectorAll<HTMLElement>("[data-catalogue-card][data-key]"), (card) => [
      card.dataset.key ?? "",
      card,
    ]),
  );
  const defaultScope = root.dataset.defaultScope === "sources" ? "sources" : "all";
  let state = readCatalogueState(new URLSearchParams(location.search), defaultScope);
  const filterControls = Array.from(
    root.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-filter]"),
  );
  const holderControl = root.querySelector<HTMLSelectElement>('[data-filter="holder"]');
  const holderOptions = Array.from(holderControl?.options ?? []);
  const holderNotice = root.querySelector<HTMLElement>("[data-holder-notice]");
  let displayedCountry: string | undefined;
  const syncHolderOptions = () => {
    if (!holderControl) return;
    const options = holderOptions.filter(
      (option) => !option.value || !state.country || option.dataset.country === state.country,
    );
    if (state.country && state.holder && !options.some((option) => option.value === state.holder)) {
      const selected = holderOptions.find((option) => option.value === state.holder);
      state.holder = "";
      if (holderNotice && selected) {
        holderNotice.textContent = (holderNotice.dataset.message ?? "").replace(
          "{institution}",
          selected.dataset.name ?? selected.textContent ?? "",
        );
      }
    }
    if (displayedCountry !== state.country) {
      holderControl.replaceChildren(...options);
      displayedCountry = state.country;
    }
  };
  const resultCount = root.querySelector<HTMLElement>("[data-result-count]");
  const empty = root.querySelector<HTMLElement>("[data-empty]");
  const more = root.querySelector<HTMLButtonElement>("[data-more]");
  const shown = root.querySelector<HTMLElement>("[data-shown]");
  const autoLoading = root.querySelector<HTMLElement>("[data-auto-loading]");
  const revealPhotos = root.querySelector<HTMLButtonElement>("[data-reveal-photos]");
  const crossScope = root.querySelector<HTMLButtonElement>("[data-cross-scope]");
  const viewButtons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-view]"));
  const scopeLinks = Array.from(root.querySelectorAll<HTMLAnchorElement>("[data-scope]"));
  const scopeCounts = Array.from(root.querySelectorAll<HTMLElement>("[data-scope-count]"));
  const resetButtons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-reset]"));
  const pageSize = 24;
  let totalMatched = 0;
  let renderedOrder = "";
  let masonry = { nextTop: Number.POSITIVE_INFINITY, height: 0 };
  let scheduleAutoLoad = () => {};
  const layout = initialiseCollectionMasonry(
    results,
    [...cards.values()],
    () => state.view === "grid",
    (metrics) => {
      masonry = metrics;
      scheduleAutoLoad();
    },
  );

  const valueFor = (key: string): string => {
    const value = state[key as keyof typeof state];
    return typeof value === "string" ? value : "";
  };

  const syncControls = () => {
    for (const control of filterControls) {
      const key = control.dataset.filter;
      if (!key || key === "images" || key === "photos") continue;
      control.value = key === "sort" ? effectiveCatalogueSort(state) : valueFor(key);
    }
    for (const key of ["images", "photos"] as const) {
      const checkbox = filterControls.find((control) => control.dataset.filter === key);
      if (checkbox instanceof HTMLInputElement) checkbox.checked = state[key];
    }
    const relevanceOption = root.querySelector<HTMLOptionElement>("[data-relevance-option]");
    if (relevanceOption) {
      relevanceOption.hidden = !state.q.trim();
      relevanceOption.disabled = !state.q.trim();
    }
    for (const link of scopeLinks) {
      const active = link.dataset.scope === state.scope;
      link.setAttribute("aria-current", active ? "page" : "false");
      const scope = link.dataset.scope;
      if (scope === "all" || scope === "objects" || scope === "sources") {
        const target = new URL(link.href);
        target.search = catalogueParameters({ ...state, scope, limit: pageSize }).toString();
        link.href = `${target.pathname}${target.search}`;
      }
    }
    for (const button of viewButtons) {
      button.setAttribute("aria-pressed", String(button.dataset.view === state.view));
    }
    root.dataset.view = state.view;
  };

  const writeURL = (mode: "push" | "replace") => {
    const target = new URL(location.href);
    const parameters = catalogueParameters(state);
    const isSourceRoute = /^\/(?:en\/sources|es\/fuentes)(?:\/[^/]+)?\/?$/.test(target.pathname);
    if (isSourceRoute && state.scope === "all") parameters.set("scope", "all");
    target.search = parameters.toString();
    const url = `${target.pathname}${target.search}${target.hash}`;
    if (mode === "push") history.pushState(null, "", url);
    else history.replaceState(null, "", url);
    updateLanguageLinks();
  };

  const render = (historyMode: "push" | "replace" | "none" = "replace") => {
    syncHolderOptions();
    const matched = matchCatalogues(items, state, locale);
    const visibleItems = matched.items;
    if (revealPhotos) revealPhotos.hidden = visibleItems.length > 0 || matched.groupedPhotos === 0;
    totalMatched = visibleItems.length;
    const visibleKeys = new Set(visibleItems.map(({ key }) => key));
    const order = visibleItems.map(({ key }) => key).join("\u0000");
    const reorder = order !== renderedOrder;
    renderedOrder = order;
    for (const count of scopeCounts) {
      const scope = count.closest<HTMLElement>("[data-scope]")?.dataset.scope;
      if (scope === "all" || scope === "objects" || scope === "sources")
        count.textContent = String(matched.counts[scope]);
    }
    visibleItems.forEach(({ key }, index) => {
      const card = cards.get(key);
      if (!card) return;
      // Keep existing nodes in place when extending a batch, preserving keyboard focus.
      if (reorder && card.parentElement === results) results.append(card);
      card.hidden = !visibleKeys.has(key) || index >= state.limit;
    });
    for (const [key, card] of cards) {
      if (!visibleKeys.has(key)) card.hidden = true;
    }
    const shownCount = Math.min(visibleItems.length, state.limit);
    if (resultCount) {
      const number = formatNumber(visibleItems.length, locale);
      resultCount.textContent =
        locale === "en"
          ? `${number} ${visibleItems.length === 1 ? "result" : "results"}`
          : `${number} ${visibleItems.length === 1 ? "resultado" : "resultados"}`;
    }
    if (shown) {
      const shownNumber = formatNumber(shownCount, locale);
      const totalNumber = formatNumber(visibleItems.length, locale);
      shown.textContent =
        locale === "en"
          ? `Showing ${shownNumber} of ${totalNumber} results`
          : `Mostrando ${shownNumber} de ${totalNumber} resultados`;
    }
    if (empty) empty.hidden = visibleItems.length > 0;
    results.hidden = visibleItems.length === 0;
    if (autoLoading)
      autoLoading.hidden = state.view !== "grid" || shownCount >= visibleItems.length;
    if (more) {
      more.hidden = shownCount >= visibleItems.length;
      more.disabled = more.hidden;
    }
    if (crossScope) {
      const alternative =
        state.scope === "objects"
          ? "sources"
          : state.scope === "sources"
            ? "objects"
            : matched.groupedPhotos > 0
              ? "sources"
              : "";
      const alternativeCount = alternative ? matched.counts[alternative] : 0;
      crossScope.hidden = visibleItems.length > 0 || alternativeCount === 0;
      if (alternative) crossScope.dataset.scope = alternative;
      crossScope.textContent =
        alternative === "sources"
          ? locale === "en"
            ? `Browse ${alternativeCount} source records`
            : `Ver ${alternativeCount} registros de fuentes`
          : alternative === "objects"
            ? locale === "en"
              ? `Browse ${alternativeCount} objects`
              : `Ver ${alternativeCount} objetos`
            : "";
    }
    syncControls();
    layout();
    if (historyMode !== "none") writeURL(historyMode);
  };

  let autoFrame = 0;
  scheduleAutoLoad = () => {
    cancelAnimationFrame(autoFrame);
    autoFrame = requestAnimationFrame(() => {
      if (
        shouldLoadMore({
          view: state.view,
          enabled: !results.hidden,
          hasMore: state.limit < totalMatched,
          viewportBottom: window.scrollY + window.innerHeight,
          viewportHeight: window.innerHeight,
          collectionTop: results.getBoundingClientRect().top + window.scrollY,
          nextTop: masonry.nextTop,
        })
      ) {
        state.limit += pageSize;
        render("replace");
      }
    });
  };
  window.addEventListener("scroll", scheduleAutoLoad, { passive: true });
  window.addEventListener("resize", scheduleAutoLoad);

  const restore = () => {
    state = readCatalogueState(new URLSearchParams(location.search), defaultScope);
    if (holderNotice) holderNotice.textContent = "";
    render("replace");
  };

  for (const control of filterControls) {
    const eventName =
      control instanceof HTMLInputElement && control.type !== "checkbox" && control.type !== "radio"
        ? "input"
        : "change";
    control.addEventListener(eventName, () => {
      const key = control.dataset.filter;
      if (!key) return;
      if ((key === "country" || key === "holder") && holderNotice) holderNotice.textContent = "";
      if (key === "images" || key === "photos")
        state[key] = control instanceof HTMLInputElement && control.checked;
      else if (key === "sort")
        state.sort =
          control.value === "name" || control.value === "name-desc" ? control.value : "auto";
      else if (key === "q") state.q = control.value;
      else if (key === "holder" || key === "country" || key === "kind") state[key] = control.value;
      state.limit = pageSize;
      render(key === "q" ? "replace" : "push");
    });
  }
  for (const link of scopeLinks) {
    link.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
        return;
      const scope = link.dataset.scope;
      if (scope !== "all" && scope !== "objects" && scope !== "sources") return;
      event.preventDefault();
      state.scope = scope;
      state.limit = pageSize;
      render("push");
    });
  }
  for (const button of viewButtons) {
    button.addEventListener("click", () => {
      state.view = button.dataset.view === "list" ? "list" : "grid";
      render("push");
    });
  }
  more?.addEventListener("click", () => {
    const oldLimit = state.limit;
    state.limit += pageSize;
    render("push");
    const firstNew = Array.from(
      results.querySelectorAll<HTMLElement>("[data-catalogue-card]:not([hidden])"),
    )[oldLimit];
    firstNew?.querySelector<HTMLElement>('a:not([tabindex="-1"])')?.focus();
  });
  crossScope?.addEventListener("click", () => {
    const scope = crossScope.dataset.scope;
    if (scope !== "objects" && scope !== "sources") return;
    state.scope = scope;
    state.limit = pageSize;
    render("push");
  });
  revealPhotos?.addEventListener("click", () => {
    state.photos = true;
    if (state.scope === "objects") state.scope = "sources";
    state.limit = pageSize;
    render("push");
    results.querySelector<HTMLElement>("[data-catalogue-card]:not([hidden]) h2 a")?.focus();
  });
  const clearFilters = () => {
    if (holderNotice) holderNotice.textContent = "";
    state = {
      ...state,
      q: "",
      holder: "",
      country: "",
      kind: "",
      images: false,
      photos: false,
      limit: pageSize,
    };
    syncControls();
    render("push");
    filterControls.find((control) => control.dataset.filter === "q")?.focus();
  };
  for (const button of resetButtons) button.addEventListener("click", clearFilters);
  window.addEventListener("popstate", restore);
  for (const control of controls) control.hidden = false;
  syncControls();
  restore();
}
