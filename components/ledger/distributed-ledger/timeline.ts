import { NEW_ROW_FLASH_S, syncSeconds } from "./model";

/** One broadcast clock. The graphic reads the same durations and does not commit the row. */
export function broadcastSchedule(reducedMotion: boolean) {
  const commitAfter = syncSeconds(reducedMotion);
  return {
    commitAfter,
    settleAfter: commitAfter + NEW_ROW_FLASH_S,
  };
}
