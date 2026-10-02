import { matchesSearch } from "./search";

export interface BrowseState {
  q: string;
  view: "grid" | "list";
}

export function readBrowseState(params: URLSearchParams): BrowseState {
  return {
    q: params.get("q") ?? "",
    view: ["list", "table"].includes(params.get("view") ?? "") ? "list" : "grid",
  };
}

export function matchesBrowseState(
  state: BrowseState,
  record: { searchExact: string; searchFoldable: string },
): boolean {
  return matchesSearch(state.q, record.searchExact, record.searchFoldable);
}

export function hasBrowseFilter(state: BrowseState): boolean {
  return Boolean(state.q.trim());
}
