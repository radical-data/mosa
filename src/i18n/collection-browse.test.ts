import { describe, expect, it } from "vitest";
import { matchesBrowseState, readBrowseState } from "./collection-browse";
import { languageLink } from "./routes";

describe("collection browsing", () => {
  it("accepts existing table links and retains combined state across languages", () => {
    const url = new URL("https://example.org/en/collection/?q=Mamari&view=table&images=1");
    const state = readBrowseState(url.searchParams);
    expect(state).toEqual({ q: "Mamari", view: "list" });
    expect(
      readBrowseState(new URL(languageLink("collection", "es", url), url).searchParams),
    ).toEqual(state);
  });
  it("includes all records regardless of obsolete image-filter parameters", () => {
    const record = { searchExact: "Mamari P 003", searchFoldable: "Mamari" };
    const state = readBrowseState(new URLSearchParams("images=1"));
    expect(matchesBrowseState(state, record)).toBe(true);
    expect(matchesBrowseState({ ...state, q: "P 003" }, record)).toBe(true);
    expect(matchesBrowseState({ ...state, q: "not present" }, record)).toBe(false);
  });
});
