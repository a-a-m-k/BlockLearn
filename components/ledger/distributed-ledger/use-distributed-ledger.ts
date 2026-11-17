"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { delay } from "motion";
import { useReducedMotion } from "motion/react";

import { entriesFromBlock } from "@/components/ledger/entries";
import type { ContentBlock } from "@/lib/chapter-content";

import { BROADCAST_QUEUE, REVERT_S, WARN_S } from "./model";
import {
  aliceEntries,
  beginBroadcast,
  canBroadcast,
  clearNewRow,
  commitBroadcast,
  createNotebookStory,
  editAliceAmount,
  isMismatching,
  revealMismatch,
  revertCheat,
  type PendingBroadcast,
} from "./story";
import { broadcastSchedule } from "./timeline";

type CancelRef = MutableRefObject<VoidFunction | null>;

function wait(seconds: number, store: CancelRef) {
  return new Promise<void>((resolve) => {
    store.current?.();
    store.current = delay(() => {
      store.current = null;
      resolve();
    }, seconds);
  });
}

export function useDistributedLedger(
  block: Extract<ContentBlock, { type: "distributed-ledger" }>,
) {
  const reducedMotion = useReducedMotion();
  const [story, setStory] = useState(() =>
    createNotebookStory(entriesFromBlock(block.entries)),
  );

  const cancelCheat = useRef<VoidFunction | null>(null);
  const cancelSync = useRef<VoidFunction | null>(null);
  const cancelFlash = useRef<VoidFunction | null>(null);
  const cheatGen = useRef(0);
  const syncGen = useRef(0);

  useEffect(() => {
    const cancelCheatFn = cancelCheat;
    const cancelSyncFn = cancelSync;
    const cancelFlashFn = cancelFlash;
    return () => {
      cancelCheatFn.current?.();
      cancelSyncFn.current?.();
      cancelFlashFn.current?.();
      syncGen.current += 1;
      cheatGen.current += 1;
    };
  }, []);

  async function scheduleRevert() {
    const gen = ++cheatGen.current;
    cancelCheat.current?.();

    await wait(WARN_S, cancelCheat);
    if (gen !== cheatGen.current) return;

    setStory((current) => revealMismatch(current));

    await wait(REVERT_S - WARN_S, cancelCheat);
    if (gen !== cheatGen.current) return;

    setStory((current) => revertCheat(current));
  }

  function setAliceAmount(index: number, amount: number) {
    if (story.status === "broadcasting") return;

    setStory((current) => editAliceAmount(current, index, amount));
    void scheduleRevert();
  }

  function broadcastNext() {
    const started = beginBroadcast(story);
    if (!started) return;

    cheatGen.current += 1;
    cancelCheat.current?.();
    cancelSync.current?.();
    cancelFlash.current?.();

    const gen = ++syncGen.current;
    setStory(started.story);
    void settleBroadcast(gen, started.pending, Boolean(reducedMotion));
  }

  async function settleBroadcast(
    gen: number,
    pending: PendingBroadcast,
    reduced: boolean,
  ) {
    const schedule = broadcastSchedule(reduced);

    await wait(schedule.commitAfter, cancelSync);
    if (gen !== syncGen.current) return;

    setStory((current) => commitBroadcast(current, pending));

    await wait(schedule.settleAfter - schedule.commitAfter, cancelFlash);
    if (gen !== syncGen.current) return;

    setStory((current) => clearNewRow(current));
  }

  return {
    shared: story.shared,
    aliceEntries: aliceEntries(story),
    status: story.status,
    mismatching: isMismatching(story),
    newRowIndex: story.newRowIndex,
    canBroadcast: canBroadcast(story),
    nextBroadcast: BROADCAST_QUEUE[story.broadcastIndex],
    setAliceAmount,
    broadcastNext,
  };
}
