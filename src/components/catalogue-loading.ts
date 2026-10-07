export interface CatalogueLoadCheck {
  view: "grid" | "list";
  enabled: boolean;
  hasMore: boolean;
  /** Bottom edge of the viewport in document coordinates. */
  viewportBottom: number;
  viewportHeight: number;
  /** Top of the catalogue container in document coordinates. */
  collectionTop: number;
  /** Masonry's next insertion point, from the shortest column. */
  nextTop: number;
  /** Extra distance before loading. Defaults to one viewport height. */
  threshold?: number;
}

/** Whether grid masonry should request another page near its next insertion point. */
export function shouldLoadMore({
  view,
  enabled,
  hasMore,
  viewportBottom,
  viewportHeight,
  collectionTop,
  nextTop,
  threshold = viewportHeight,
}: CatalogueLoadCheck): boolean {
  if (view !== "grid" || !enabled || !hasMore) return false;
  return viewportBottom + threshold >= collectionTop + nextTop;
}
