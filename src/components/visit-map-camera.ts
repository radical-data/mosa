const TILE_SIZE = 512;
const MAX_MERCATOR_LATITUDE = 85.0511287798066;
const MIN_ZOOM = -2;
const MAX_ZOOM = 12;

export interface VisitMapCameraRequest {
  longitude: number;
  latitude: number;
  zoom: number;
  width: number;
  height: number;
}

export interface VisitMapCamera {
  longitude: number;
  latitude: number;
  zoom: number;
}

/** Constrain a camera to one 512 px Web Mercator world at the requested zoom. */
export function constrainVisitMapCamera({
  longitude,
  latitude,
  zoom: requestedZoom,
  width,
  height,
}: VisitMapCameraRequest): VisitMapCamera {
  const zoom = clamp(Number.isFinite(requestedZoom) ? requestedZoom : MIN_ZOOM, MIN_ZOOM, MAX_ZOOM);
  const viewportWidth = Math.max(0, Number.isFinite(width) ? width : 0);
  const viewportHeight = Math.max(0, Number.isFinite(height) ? height : 0);
  const worldSize = TILE_SIZE * 2 ** zoom;

  const requestedX = longitudeToWorldX(Number.isFinite(longitude) ? longitude : 0, worldSize);
  const requestedY = latitudeToWorldY(Number.isFinite(latitude) ? latitude : 0, worldSize);
  const centreX = constrainAxis(requestedX, worldSize, viewportWidth);
  const centreY = constrainAxis(requestedY, worldSize, viewportHeight);

  return {
    longitude: worldXToLongitude(centreX, worldSize),
    latitude: worldYToLatitude(centreY, worldSize),
    zoom,
  };
}

function constrainAxis(centre: number, worldSize: number, viewportSize: number): number {
  // If the viewport is larger than the world, centre the world and retain
  // equal empty space on both sides (including beyond the Mercator poles).
  if (viewportSize >= worldSize) return worldSize / 2;
  return clamp(centre, viewportSize / 2, worldSize - viewportSize / 2);
}

function longitudeToWorldX(longitude: number, worldSize: number): number {
  return ((longitude + 180) / 360) * worldSize;
}

function worldXToLongitude(x: number, worldSize: number): number {
  return (x / worldSize) * 360 - 180;
}

function latitudeToWorldY(latitude: number, worldSize: number): number {
  const clampedLatitude = clamp(latitude, -MAX_MERCATOR_LATITUDE, MAX_MERCATOR_LATITUDE);
  const radians = (clampedLatitude * Math.PI) / 180;
  return ((1 - Math.asinh(Math.tan(radians)) / Math.PI) / 2) * worldSize;
}

function worldYToLatitude(y: number, worldSize: number): number {
  const mercator = Math.PI * (1 - (2 * y) / worldSize);
  return (Math.atan(Math.sinh(mercator)) * 180) / Math.PI;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
