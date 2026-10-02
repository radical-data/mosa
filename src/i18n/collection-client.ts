import { matchesBrowseState, readBrowseState } from "./collection-browse";
import { referenceCount } from "./messages";
import { updateLanguageLinks } from "./switcher";

const controls = document.querySelector<HTMLElement>(".collection-controls");
const search = document.querySelector<HTMLInputElement>("#collection-search");
const results = document.querySelector<HTMLElement>("#collection-results");
const count = document.querySelector<HTMLElement>("#collection-count");
const empty = document.querySelector<HTMLElement>(".empty-state");
const viewButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("[data-collection-view]"),
);
const locale =
  document.querySelector<HTMLElement>("[data-locale]")?.dataset.locale === "en" ? "en" : "es";
if (controls && search && results && count && empty) {
  const cards = Array.from(results.querySelectorAll<HTMLElement>("[data-catalogue-card]"));
  let state = readBrowseState(new URLSearchParams(location.search));
  controls.hidden = false;
  const render = () => {
    let visible = 0;
    for (const card of cards) {
      const matches = matchesBrowseState(state, {
        searchExact: card.dataset.searchExact ?? "",
        searchFoldable: card.dataset.searchFoldable ?? "",
      });
      card.hidden = !matches;
      if (matches) visible++;
    }
    count.textContent = referenceCount(locale, { count: visible });
    empty.hidden = visible > 0;
    results.hidden = visible === 0;
    results.classList.toggle("is-list", state.view === "list");
    for (const button of viewButtons) {
      button.setAttribute("aria-pressed", String(button.dataset.collectionView === state.view));
    }
    const url = new URL(location.href);
    for (const key of ["q", "view", "images", "concept", "type"]) url.searchParams.delete(key);
    if (state.q) url.searchParams.set("q", state.q);
    if (state.view === "list") url.searchParams.set("view", "list");
    history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    updateLanguageLinks();
  };
  const restore = () => {
    state = readBrowseState(new URLSearchParams(location.search));
    search.value = state.q;
    render();
  };
  search.addEventListener("input", () => {
    state.q = search.value;
    render();
  });
  for (const button of viewButtons) {
    button.addEventListener("click", () => {
      state.view = button.dataset.collectionView === "list" ? "list" : "grid";
      render();
    });
  }
  window.addEventListener("popstate", restore);
  document.querySelector("#reset-filters")?.addEventListener("click", () => {
    search.value = "";
    state.q = "";
    render();
    search.focus();
  });
  restore();
}
