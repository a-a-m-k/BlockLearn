import { describe, expect, it } from "vitest";

import { connectorLines, copyFrameHeight } from "./measure";

describe("notebook frame height", () => {
  it("adds padding, the gaps between blocks, and the border", () => {
    expect(
      copyFrameHeight({
        childHeights: [20, 30, 40],
        padding: 8,
        gap: 4,
        border: 2,
      }),
    ).toBe(108);
  });

  it("stays at the chrome when a copy has no blocks yet", () => {
    expect(
      copyFrameHeight({ childHeights: [], padding: 8, gap: 4, border: 2 }),
    ).toBe(10);
  });
});

describe("network connector lines", () => {
  it("meets the card edges instead of the centers", () => {
    const cards = new Map([
      ["top-left" as const, { x: 0, y: 0, width: 100, height: 80 }],
      ["top-right" as const, { x: 200, y: 0, width: 100, height: 80 }],
    ]);

    const [line] = connectorLines(cards);

    expect(line).toEqual({
      id: "top-left-top-right",
      x1: 100,
      y1: 40,
      x2: 200,
      y2: 40,
    });
  });

  it("skips a seat that is not on the stage", () => {
    const cards = new Map([
      ["top-left" as const, { x: 0, y: 0, width: 10, height: 10 }],
    ]);

    expect(connectorLines(cards)).toEqual([]);
  });
});
