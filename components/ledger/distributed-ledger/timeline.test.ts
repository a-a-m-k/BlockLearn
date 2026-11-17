import { describe, expect, it } from "vitest";

import { NEW_ROW_FLASH_S, REDUCED_SYNC_S, SYNC_ANIM_S } from "./model";
import { broadcastSchedule } from "./timeline";

describe("broadcast schedule", () => {
  it("commits after the sync, then clears the flash on the same clock", () => {
    const schedule = broadcastSchedule(false);

    expect(schedule.commitAfter).toBe(SYNC_ANIM_S);
    expect(schedule.settleAfter).toBe(SYNC_ANIM_S + NEW_ROW_FLASH_S);
  });

  it("shortens the sync when motion is reduced and still flashes afterward", () => {
    const schedule = broadcastSchedule(true);

    expect(schedule.commitAfter).toBe(REDUCED_SYNC_S);
    expect(schedule.settleAfter - schedule.commitAfter).toBe(NEW_ROW_FLASH_S);
    expect(schedule.commitAfter).toBeLessThan(SYNC_ANIM_S);
  });
});
