export function masonryPositions(heights: number[], columns: number, gap: number) {
  const bottoms = Array<number>(columns).fill(0);
  const positions = heights.map((height) => {
    const top = Math.min(...bottoms);
    const column = bottoms.indexOf(top);
    bottoms[column] = top + height + gap;
    return { column, top };
  });
  return { positions, height: Math.max(0, ...bottoms) - (heights.length ? gap : 0) };
}

export function initialiseCollectionMasonry(container: HTMLElement, cards: HTMLElement[]) {
  container.dataset.masonry = "true";

  const layout = () => {
    if (container.hidden) return;
    const style = getComputedStyle(container);
    const columns = Number(style.getPropertyValue("--collection-columns"));
    const columnGap = Number.parseFloat(style.columnGap);
    const rowGap = Number.parseFloat(style.rowGap);
    const width = container.getBoundingClientRect().width;
    const columnWidth = (width - columnGap * (columns - 1)) / columns;
    const visible = cards.filter((card) => !card.hidden);
    // Read all sizes before writing positions to avoid repeated layout work.
    const { positions, height } = masonryPositions(
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
