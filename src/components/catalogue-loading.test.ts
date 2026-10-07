import { describe, expect, it } from "vitest";
import { shouldLoadMore } from "./catalogue-loading";

const check = {
  view: "grid" as const,
  enabled: true,
  hasMore: true,
  viewportBottom: 4000,
  viewportHeight: 800,
  collectionTop: 3500,
  nextTop: 120,
};

describe("catalogue progressive loading", () => {
  it("uses the shortest masonry column insertion point beside a tall image", () => {
    expect(shouldLoadMore(check)).toBe(true);
    // The tallest column would end at 5,500 px, outside the 800 px threshold.
    expect(check.collectionTop + 2000).toBeGreaterThan(check.viewportBottom + check.viewportHeight);
  });

  it("waits until the next insertion point is within one viewport", () => {
    expect(shouldLoadMore({ ...check, viewportBottom: 2800 })).toBe(false);
    expect(shouldLoadMore({ ...check, viewportBottom: 2820 })).toBe(true);
  });

  it("leaves list mode, disabled loading, and exhausted results to manual pagination", () => {
    expect(shouldLoadMore({ ...check, view: "list" })).toBe(false);
    expect(shouldLoadMore({ ...check, enabled: false })).toBe(false);
    expect(shouldLoadMore({ ...check, hasMore: false })).toBe(false);
  });

  it("accepts an explicit loading threshold", () => {
    expect(shouldLoadMore({ ...check, threshold: 0, viewportBottom: 3619 })).toBe(false);
    expect(shouldLoadMore({ ...check, threshold: 0, viewportBottom: 3620 })).toBe(true);
  });
});
