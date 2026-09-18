const caseFold = (value: string) => value.normalize("NFC").toLowerCase();
const accentFold = (value: string) =>
  caseFold(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
export function matchesSearch(query: string, exact: string, foldable: string): boolean {
  const term = query.trim();
  return (
    !term ||
    caseFold(exact).includes(caseFold(term)) ||
    accentFold(foldable).includes(accentFold(term))
  );
}
export function collectionState(
  parameters: URLSearchParams,
  concepts: readonly string[],
  types: readonly string[],
) {
  const concept = parameters.get("concept") ?? "";
  const type = parameters.get("type") ?? "";
  return {
    q: parameters.get("q") ?? "",
    concept: concepts.includes(concept) ? concept : "",
    type: types.includes(type) ? type : "",
    view: parameters.get("view") === "list" ? "list" : "grid",
  };
}
