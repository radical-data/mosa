import { referenceCount } from "./messages";
import { collectionState, matchesSearch } from "./search";
import { updateLanguageLinks } from "./switcher";

const controls = document.querySelector<HTMLElement>(".collection-controls");
const search = document.querySelector<HTMLInputElement>("#collection-search");
const concept = document.querySelector<HTMLSelectElement>("#concept-filter");
const type = document.querySelector<HTMLSelectElement>("#type-filter");
const results = document.querySelector<HTMLElement>("#collection-results");
const count = document.querySelector<HTMLElement>("#collection-count");
const empty = document.querySelector<HTMLElement>(".empty-state");
const cards = Array.from(document.querySelectorAll<HTMLElement>(".collection-card"));
const locale =
  document.querySelector<HTMLElement>("[data-locale]")?.dataset.locale === "en" ? "en" : "es";
if (controls && search && concept && type && results && count && empty) {
  controls.hidden = false;
  let view = "grid";
  const filter = (writeURL = true) => {
    let visible = 0;
    for (const card of cards) {
      const matches =
        matchesSearch(
          search.value,
          card.dataset.searchExact ?? "",
          card.dataset.searchFoldable ?? "",
        ) &&
        (!concept.value || card.dataset.concept === concept.value) &&
        (!type.value || card.dataset.type === type.value);
      card.hidden = !matches;
      if (matches) visible++;
    }
    count.textContent = referenceCount(locale, { count: visible });
    empty.hidden = visible > 0;
    results.hidden = visible === 0;
    results.classList.toggle("is-list", view === "list");
    for (const button of document.querySelectorAll<HTMLButtonElement>("[data-view]")) {
      button.setAttribute("aria-pressed", String(button.dataset.view === view));
    }
    if (writeURL) {
      const url = new URL(location.href);
      for (const [key, value] of Object.entries({
        q: search.value,
        concept: concept.value,
        type: type.value,
        view: view === "list" ? view : "",
      })) {
        if (value) url.searchParams.set(key, value);
        else url.searchParams.delete(key);
      }
      history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
    updateLanguageLinks();
  };
  const restore = () => {
    const state = collectionState(
      new URLSearchParams(location.search),
      Array.from(concept.options, (option) => option.value),
      Array.from(type.options, (option) => option.value),
    );
    search.value = state.q;
    concept.value = state.concept;
    type.value = state.type;
    view = state.view;
    filter(false);
  };
  search.addEventListener("input", () => filter());
  concept.addEventListener("change", () => filter());
  type.addEventListener("change", () => filter());
  window.addEventListener("popstate", restore);
  document.querySelector("#reset-filters")?.addEventListener("click", () => {
    search.value = "";
    concept.value = "";
    type.value = "";
    filter();
    search.focus();
  });
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-view]")) {
    button.addEventListener("click", () => {
      view = button.dataset.view ?? "grid";
      filter();
    });
  }
  restore();
}
