import { referenceCount } from "./messages";
import { matchesSearch } from "./search";
import { updateLanguageLinks } from "./switcher";

const controls = document.querySelector<HTMLElement>(".collection-controls");
const search = document.querySelector<HTMLInputElement>("#collection-search");
const results = document.querySelector<HTMLElement>("#collection-results");
const count = document.querySelector<HTMLElement>("#collection-count");
const empty = document.querySelector<HTMLElement>(".empty-state");
const cards = Array.from(document.querySelectorAll<HTMLElement>(".collection-card"));
const viewButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("[data-collection-view]"),
);
const locale =
  document.querySelector<HTMLElement>("[data-locale]")?.dataset.locale === "en" ? "en" : "es";
if (controls && search && results && count && empty && cards.length) {
  controls.hidden = false;
  const setView = (view: "grid" | "table") => {
    results.classList.toggle("is-list", view === "table");
    for (const button of viewButtons) {
      button.setAttribute("aria-pressed", String(button.dataset.collectionView === view));
    }
    const url = new URL(location.href);
    if (view === "table") url.searchParams.set("view", view);
    else url.searchParams.delete("view");
    history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    updateLanguageLinks();
  };
  const filter = () => {
    let visible = 0;
    for (const card of cards) {
      const matches = matchesSearch(
        search.value,
        card.dataset.searchExact ?? "",
        card.dataset.searchFoldable ?? "",
      );
      card.hidden = !matches;
      if (matches) visible++;
    }
    count.textContent = referenceCount(locale, { count: visible });
    empty.hidden = visible > 0;
    results.hidden = visible === 0;
    const url = new URL(location.href);
    for (const key of ["concept", "type"]) url.searchParams.delete(key);
    if (search.value) url.searchParams.set("q", search.value);
    else url.searchParams.delete("q");
    history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    updateLanguageLinks();
  };
  const restore = () => {
    const params = new URLSearchParams(location.search);
    search.value = params.get("q") ?? "";
    setView(params.get("view") === "table" ? "table" : "grid");
    filter();
  };
  search.addEventListener("input", filter);
  for (const button of viewButtons) {
    button.addEventListener("click", () => {
      setView(button.dataset.collectionView === "table" ? "table" : "grid");
    });
  }
  window.addEventListener("popstate", restore);
  document.querySelector("#reset-filters")?.addEventListener("click", () => {
    search.value = "";
    filter();
    search.focus();
  });
  restore();
}
