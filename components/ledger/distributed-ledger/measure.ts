import { CONNECTIONS, type PersonPosition } from "./scene";

export type StageBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type StageLine = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

type StagePoint = { x: number; y: number };

/**
 * Height of a notebook frame from its blocks.
 * Ignores a min-height already written onto the card, and keeps padding,
 * the gap between blocks, and the border.
 */
export function copyFrameHeight(input: {
  childHeights: readonly number[];
  padding: number;
  gap: number;
  border: number;
}) {
  const content = input.childHeights.reduce((sum, height) => sum + height, 0);
  const gaps = Math.max(0, input.childHeights.length - 1) * input.gap;
  return content + input.padding + gaps + input.border;
}

/** Where a ray from the card center leaves that card, toward another center. */
function borderPoint(card: StageBox, from: StagePoint, to: StagePoint) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const tx = dx === 0 ? Infinity : card.width / 2 / Math.abs(dx);
  const ty = dy === 0 ? Infinity : card.height / 2 / Math.abs(dy);
  const t = Math.min(tx, ty);
  return { x: from.x + dx * t, y: from.y + dy * t };
}

function centerOf(card: StageBox): StagePoint {
  return { x: card.x + card.width / 2, y: card.y + card.height / 2 };
}

/** Lines from card edge to card edge. A missing seat is skipped. */
export function connectorLines(
  cards: ReadonlyMap<PersonPosition, StageBox>,
): StageLine[] {
  const lines: StageLine[] = [];
  for (const [from, to] of CONNECTIONS) {
    const startCard = cards.get(from);
    const endCard = cards.get(to);
    if (!startCard || !endCard) continue;
    const startCenter = centerOf(startCard);
    const endCenter = centerOf(endCard);
    const start = borderPoint(startCard, startCenter, endCenter);
    const end = borderPoint(endCard, endCenter, startCenter);
    lines.push({
      id: `${from}-${to}`,
      x1: start.x,
      y1: start.y,
      x2: end.x,
      y2: end.y,
    });
  }
  return lines;
}
