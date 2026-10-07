export function masonryPositions(heights: number[], columns: number, gap: number) {
  const bottoms = Array<number>(columns).fill(0);
  const positions = heights.map((height) => {
    const top = Math.min(...bottoms);
    const column = bottoms.indexOf(top);
    bottoms[column] = top + height + gap;
    return { column, top };
  });
  return {
    positions,
    height: Math.max(0, ...bottoms) - (heights.length ? gap : 0),
    nextTop: Math.max(0, Math.min(...bottoms)),
  };
}

export interface CollectionMasonryMetrics {
  /** Top of the next card in the currently shortest column. */
  nextTop: number;
  /** Bottom of the tallest column, excluding the trailing gap. */
  height: number;
}

export function initialiseCollectionMasonry(
  container: HTMLElement,
  cards: HTMLElement[],
  enabled: () => boolean = () => true,
  afterLayout?: (metrics: CollectionMasonryMetrics) => void,
) {
  container.dataset.masonry = "true";
  const cardSet = new Set(cards);

  const layout = () => {
    if (!enabled()) {
      container.style.height = "";
      afterLayout?.({ nextTop: 0, height: 0 });
      return;
    }
    if (container.hidden) return;
    const style = getComputedStyle(container);
    const columns = Number(style.getPropertyValue("--collection-columns"));
    const columnGap = Number.parseFloat(style.columnGap);
    const rowGap = Number.parseFloat(style.rowGap);
    const width = container.getBoundingClientRect().width;
    const columnWidth = (width - columnGap * (columns - 1)) / columns;
    // Follow the current sorted DOM order, including after a filter or layout change.
    const visible = Array.from(container.children).filter(
      (card): card is HTMLElement =>
        card instanceof HTMLElement && cardSet.has(card) && !card.hidden,
    );
    // Read all sizes before writing positions to avoid repeated layout work.
    const { positions, height, nextTop } = masonryPositions(
      visible.map((card) => card.getBoundingClientRect().height),
      columns,
      rowGap,
    );
    visible.forEach((card, index) => {
      const { column, top } = positions[index];
      card.style.left = `${column * (columnWidth + columnGap)}px`;
      card.style.top = `${top}px`;
    });
    container.style.height = `${height}px`;
    afterLayout?.({ nextTop, height });
  };

  let frame = 0;
  const scheduleLayout = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(layout);
  };
  let previousWidth = 0;
  const observer = new ResizeObserver((entries) => {
    const changed = entries.some((entry) => {
      if (entry.target !== container) return true;
      // Our own height updates must not trigger another layout indefinitely.
      const width = entry.contentRect.width;
      if (width === previousWidth) return false;
      previousWidth = width;
      return true;
    });
    if (changed) scheduleLayout();
  });
  observer.observe(container);
  for (const card of cards) observer.observe(card);
  layout();
  return layout;
}
