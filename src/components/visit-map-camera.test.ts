import { describe, expect, test } from "vitest";
import { constrainVisitMapCamera } from "./visit-map-camera";

describe("constrainVisitMapCamera", () => {
  test("keeps an oversized-world viewport inside the east and west edges", () => {
    expect(
      constrainVisitMapCamera({
        longitude: 180,
        latitude: 0,
        zoom: 0,
        width: 256,
        height: 256,
      }),
    ).toEqual({ longitude: 90, latitude: 0, zoom: 0 });

    expect(
      constrainVisitMapCamera({
        longitude: -180,
        latitude: 0,
        zoom: 0,
        width: 256,
        height: 256,
      }),
    ).toEqual({ longitude: -90, latitude: 0, zoom: 0 });
  });

  test("keeps the viewport inside the Mercator north and south edges", () => {
    const north = constrainVisitMapCamera({
      longitude: 0,
      latitude: 89,
      zoom: 0,
      width: 128,
      height: 128,
    });
    const south = constrainVisitMapCamera({
      longitude: 0,
      latitude: -89,
      zoom: 0,
      width: 128,
      height: 128,
    });

    expect(north.latitude).toBeCloseTo(79.1713, 3);
    expect(south.latitude).toBeCloseTo(-79.1713, 3);
  });

  test("centres each axis independently when the viewport is larger than the world", () => {
    const camera = constrainVisitMapCamera({
      longitude: 45,
      latitude: -89,
      zoom: -1,
      width: 512,
      height: 64,
    });

    // At z=-1 the world is 256 px square: centre longitude,
    // while the shorter viewport remains constrained by the south edge.
    expect(camera.longitude).toBe(0);
    expect(camera.latitude).toBeCloseTo(-79.1713, 3);
    expect(camera.zoom).toBe(-1);
  });

  test("allows symmetric space beyond both poles when the whole world is smaller than the viewport", () => {
    const camera = constrainVisitMapCamera({
      longitude: 130,
      latitude: -70,
      zoom: -2,
      width: 360,
      height: 640,
    });

    expect(camera).toEqual({ longitude: 0, latitude: 0, zoom: -2 });
  });

  test("supports a tall narrow fit-all viewport at overview zoom", () => {
    const camera = constrainVisitMapCamera({
      longitude: 150,
      latitude: 35,
      zoom: -0.5,
      width: 320,
      height: 640,
    });

    expect(camera.longitude).toBeLessThanOrEqual((360 * (1 - 320 / (512 * 2 ** -0.5))) / 2);
    expect(camera.latitude).toBe(0);
    expect(camera.zoom).toBe(-0.5);
  });

  test("clamps zoom before calculating world bounds", () => {
    expect(
      constrainVisitMapCamera({
        longitude: 0,
        latitude: 0,
        zoom: 20,
        width: 100,
        height: 100,
      }),
    ).toEqual({ longitude: 0, latitude: 0, zoom: 12 });

    expect(
      constrainVisitMapCamera({
        longitude: 0,
        latitude: 0,
        zoom: -20,
        width: 100,
        height: 100,
      }),
    ).toEqual({ longitude: 0, latitude: 0, zoom: -2 });
  });
});
