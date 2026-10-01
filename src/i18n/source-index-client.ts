import { updateLanguageLinks } from "./switcher";

const root = document.querySelector<HTMLElement>("[data-source-index]");
const controls = document.querySelector<HTMLElement>(".source-filters");
const search = document.querySelector<HTMLInputElement>("[data-source-search]");
const kind = document.querySelector<HTMLSelectElement>("[data-source-kind]");
const topic = document.querySelector<HTMLSelectElement>("[data-source-topic]");
const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-source-card]"));
const count = document.querySelector<HTMLElement>("[data-source-count]");
const empty = document.querySelector<HTMLElement>("[data-source-empty]");
const locale = root?.dataset.locale === "en" ? "en" : "es";
const keys = ["q", "kind", "topic"] as const;

if (root && controls && search && kind && topic && count && empty) {
  const params = new URLSearchParams(location.search);
  search.value = params.get("q") ?? "";
  kind.value = params.get("kind") ?? "";
  topic.value = params.get("topic") ?? "";
  controls.hidden = false;
  const apply = () => {
    const query = search.value.trim().toLocaleLowerCase(locale);
    let visible = 0;
    for (const card of cards) {
      const matches =
        (!query || (card.dataset.search ?? "").toLocaleLowerCase(locale).includes(query)) &&
        (!kind.value || card.dataset.kind === kind.value) &&
        (!topic.value || (card.dataset.topics ?? "").split(" ").includes(topic.value));
      card.hidden = !matches;
      if (matches) visible++;
    }
    count.textContent = `${visible} ${locale === "en" ? "sources" : "fuentes"}`;
    empty.hidden = visible !== 0;
    const url = new URL(location.href);
    for (const key of keys) url.searchParams.delete(key);
    if (search.value) url.searchParams.set("q", search.value);
    if (kind.value) url.searchParams.set("kind", kind.value);
    if (topic.value) url.searchParams.set("topic", topic.value);
    history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    updateLanguageLinks();
  };
  search.addEventListener("input", apply);
  kind.addEventListener("change", apply);
  topic.addEventListener("change", apply);
  window.addEventListener("popstate", () => {
    const current = new URLSearchParams(location.search);
    search.value = current.get("q") ?? "";
    kind.value = current.get("kind") ?? "";
    topic.value = current.get("topic") ?? "";
    apply();
  });
  apply();
}
