import type { AmountEntry } from "@/components/ledger/types";

export type { AmountEntry };

export type NetworkStatus = "synced" | "mismatch" | "broadcasting";

/** Delay before mismatch UI after Alice edits. */
export const WARN_S = 0.45;
/** Total cheat story length (warn + snap-back). */
export const REVERT_S = 1.8;
/** Finite sync overlay. The row appends when this elapses, on the ledger clock. */
export const SYNC_ANIM_S = 1.4;
/** Same sync when the learner has asked for reduced motion. */
export const REDUCED_SYNC_S = 0.4;
export const NEW_ROW_FLASH_S = 0.9;

/** How long the sync runs before the shared row is committed. */
export function syncSeconds(reducedMotion: boolean) {
  return reducedMotion ? REDUCED_SYNC_S : SYNC_ANIM_S;
}

/** New IOUs the learner can broadcast onto every copy. */
export const BROADCAST_QUEUE: AmountEntry[] = [
  { from: "Alex", to: "Alice", amount: 8 },
  { from: "Emma", to: "Bob", amount: 12 },
];
