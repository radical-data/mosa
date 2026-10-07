import { describe, expect, it } from "vitest";
import { masonryPositions } from "./collection-masonry";

describe("collection masonry", () => {
  it("packs short cards alongside an uncapped tall image in document order", () => {
    expect(masonryPositions([2000, 100, 100, 50], 2, 20)).toEqual({
      positions: [
        { column: 0, top: 0 },
        { column: 1, top: 0 },
        { column: 1, top: 120 },
        { column: 1, top: 240 },
      ],
      height: 2000,
      nextTop: 310,
    });
  });

  it("starts again with the first column for a filtered result", () => {
    expect(masonryPositions([50], 4, 20)).toEqual({
      positions: [{ column: 0, top: 0 }],
      height: 50,
      nextTop: 0,
    });
    expect(masonryPositions([], 4, 20)).toEqual({ positions: [], height: 0, nextTop: 0 });
  });

  it("breaks equal-height ties from left to right and omits the final gap", () => {
    expect(masonryPositions([100, 100, 50, 60], 2, 20)).toEqual({
      positions: [
        { column: 0, top: 0 },
        { column: 1, top: 0 },
        { column: 0, top: 120 },
        { column: 1, top: 120 },
      ],
      height: 180,
      nextTop: 190,
    });
  });

  it("reports the shortest column insertion point beside a tall image", () => {
    const layout = masonryPositions([2000, 100], 2, 20);
    expect(layout.height).toBe(2000);
    expect(layout.nextTop).toBe(120);
  });
});
