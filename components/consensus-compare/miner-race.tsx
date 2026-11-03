"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CheckIcon, HardHatIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { faceFor } from "@/components/ledger/characters";
import {
  LedgerPersonFace,
  type FaceMood,
  type FaceVariant,
} from "@/components/ledger/person-face";
import { cn } from "@/lib/utils";

import {
  COMPARE_CARD_SHELL,
  COMPARE_STAGE_LABEL,
  COMPARE_STAGE_ROWS,
  COMPARE_VISUAL_SLOT,
  CompareSplit,
  accentBorder,
  accentText,
} from "./compare-layout";
import { CompareResultCard } from "./result-card";
import { popMotion } from "./motion";
import type { CompareAccent, ConsensusMiners, ConsensusResult } from "./types";
import {
  hashWindow,
  minerAttemptLabel,
  minerMood,
  minerWon,
  raceSnapshot,
  settleRaceHashes,
  tickRaceHashes,
} from "./miner-race-model";
import { HASH_TICK_MS, REVEAL_WAIT_MS } from "./reveal-cycle";

function HashWithMiddleDots({
  head,
  tail,
  className,
}: {
  head: string;
  tail: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-w-0 max-w-full items-center justify-center",
        className,
      )}
    >
      <span className="min-w-0 overflow-hidden whitespace-nowrap">{head}</span>
      <span className="shrink-0">...</span>
      <span className="shrink-0">{tail}</span>
    </span>
  );
}

export function PowRaceVisual({
  title,
  miners,
  result,
  accent,
  playing = false,
  done = false,
  onComplete,
}: {
  title?: string;
  miners: ConsensusMiners;
  result: ConsensusResult;
  accent: CompareAccent;
  playing?: boolean;
  done?: boolean;
  onComplete?: () => void;
}) {
  const [solved, setSolved] = useState(false);
  const winnerName = miners.find((miner) => miner.solved)?.name;

  return (
    <CompareSplit
      start={
        <MinerRace
          title={title}
          miners={miners}
          accent={accent}
          playing={playing}
          done={done}
          onSolvedChange={setSolved}
          onComplete={onComplete}
        />
      }
      end={
        <CompareResultCard
          result={result}
          accent={accent}
          pending={!done && !solved}
          winnerName={winnerName}
        />
      }
    />
  );
}

function MinerRace({
  title,
  miners,
  accent,
  playing = false,
  done = false,
  onSolvedChange,
  onComplete,
}: {
  title?: string;
  miners: ConsensusMiners;
  accent: CompareAccent;
  playing?: boolean;
  done?: boolean;
  onSolvedChange?: (solved: boolean) => void;
  onComplete?: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const onSolvedRef = useRef(onSolvedChange);
  onSolvedRef.current = onSolvedChange;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const [phase, setPhase] = useState<"mining" | "solved">("mining");
  const [hashes, setHashes] = useState(() => tickRaceHashes(miners, 0));

  useEffect(() => {
    const snapshot = raceSnapshot(
      { playing, done, reduceMotion: Boolean(shouldReduceMotion) },
      miners,
    );

    if (snapshot.mode !== "racing") {
      setPhase(snapshot.phase);
      setHashes(snapshot.hashes);
      onSolvedRef.current?.(snapshot.announcedSolved);
      return;
    }

    let nonce = 0;
    let intervalId = 0;

    const tick = () => {
      nonce += 1;
      setHashes(tickRaceHashes(miners, nonce));
    };

    setPhase(snapshot.phase);
    onSolvedRef.current?.(snapshot.announcedSolved);
    tick();
    intervalId = window.setInterval(tick, HASH_TICK_MS);

    const raceId = window.setTimeout(() => {
      window.clearInterval(intervalId);
      setHashes((current) => settleRaceHashes(miners, current));
      setPhase("solved");
      onSolvedRef.current?.(true);
      onCompleteRef.current?.();
    }, REVEAL_WAIT_MS);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(raceId);
    };
  }, [done, miners, playing, shouldReduceMotion]);

  const solved = phase === "solved";
  const idle = !playing && !done && !shouldReduceMotion;
  const winClass = cn(accentBorder(accent), accentText(accent));

  return (
    <div className={COMPARE_CARD_SHELL} aria-live="polite">
      {title ? (
        <p className="min-h-6 text-center text-foreground">{title}</p>
      ) : null}
      <div
        className={cn(
          "grid min-w-0 flex-1 grid-cols-3 gap-x-2 gap-y-1 @[28rem]/stage:gap-x-4",
          COMPARE_STAGE_ROWS,
        )}
      >
        {miners.map((miner, index) => (
          <MinerColumn
            key={miner.name}
            miner={miner}
            hash={hashes[index] ?? miner.hash}
            accent={accent}
            solved={solved}
            idle={idle}
            winClass={winClass}
            reduced={shouldReduceMotion}
          />
        ))}
      </div>
    </div>
  );
}

function MinerResultMark({
  solved,
  won,
  reduced,
}: {
  solved: boolean;
  won: boolean;
  reduced: boolean | null;
}) {
  if (!solved) return null;

  return (
    <motion.span
      key={won ? "check" : "x"}
      className="flex"
      {...popMotion(reduced, "scale(0.5)", "scale(1)")}
    >
      {won ? (
        <CheckIcon className="size-3" aria-hidden />
      ) : (
        <XIcon className="size-3" aria-hidden />
      )}
    </motion.span>
  );
}

function MinerStatusLine({
  status,
  solved,
  won,
  accent,
  reduced,
}: {
  status: string;
  solved: boolean;
  won: boolean;
  accent: CompareAccent;
  reduced: boolean | null;
}) {
  return (
    <p
      className={cn(
        COMPARE_STAGE_LABEL,
        "h-full",
        won ? accentText(accent) : "text-muted-foreground",
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {solved ? (
          <motion.span
            key="status"
            className="block"
            {...popMotion(reduced, "translateY(4px)", "translateY(0px)")}
          >
            {status}
          </motion.span>
        ) : (
          <span className="invisible block">{status}</span>
        )}
      </AnimatePresence>
    </p>
  );
}

function MinerColumn({
  miner,
  hash,
  accent,
  solved,
  idle,
  winClass,
  reduced,
}: {
  miner: ConsensusMiners[number];
  hash: string;
  accent: CompareAccent;
  solved: boolean;
  idle: boolean;
  winClass: string;
  reduced: boolean | null;
}) {
  const won = minerWon(solved, miner.solved);
  const nameClass = won ? accentText(accent) : "text-foreground";
  const tryingClass = idle ? accentText(accent) : "text-muted-foreground";
  const hashClass = won
    ? winClass
    : "border-muted-foreground/50 text-muted-foreground";

  return (
    <div className="row-span-5 grid min-w-0 grid-rows-subgrid justify-items-center overflow-hidden">
      <p className={cn(COMPARE_STAGE_LABEL, "min-h-6 font-medium", nameClass)}>
        {miner.name}
      </p>
      <div className={COMPARE_VISUAL_SLOT}>
        <MinerFace
          variant={faceFor(miner.name)}
          mood={minerMood(solved, miner.solved)}
          solved={won}
          accent={accent}
        />
      </div>
      <p className={cn(COMPARE_STAGE_LABEL, "min-h-6", tryingClass)}>
        {minerAttemptLabel(idle, miner.trying)}
      </p>
      <div className="flex h-full w-full min-w-0 items-center overflow-hidden">
        <MinerHashBadge
          hash={hash}
          className={cn(idle && "invisible", hashClass)}
        >
          <AnimatePresence>
            <MinerResultMark
              solved={solved}
              won={miner.solved}
              reduced={reduced}
            />
          </AnimatePresence>
        </MinerHashBadge>
      </div>
      <MinerStatusLine
        status={miner.status}
        solved={solved}
        won={won}
        accent={accent}
        reduced={reduced}
      />
    </div>
  );
}

function MinerHashBadge({
  hash,
  className,
  children,
}: {
  hash: string;
  className?: string;
  children: ReactNode;
}) {
  const narrow = hashWindow(hash, 4, 2);
  const wide = hashWindow(hash, 8, 8);

  return (
    <p
      className={cn(
        "flex h-full w-full min-w-0 items-center justify-center gap-0.5 overflow-hidden rounded-md border px-0.5 py-0.5 font-mono caption sm:gap-1 sm:px-1",
        className,
      )}
    >
      <HashWithMiddleDots
        head={narrow.head}
        tail={narrow.tail}
        className="inline-flex sm:hidden"
      />
      <HashWithMiddleDots
        head={wide.head}
        tail={wide.tail}
        className="hidden sm:inline-flex xl:hidden"
      />
      <HashWithMiddleDots
        head={narrow.head}
        tail={narrow.tail}
        className="hidden xl:inline-flex"
      />
      <span className="hidden size-3 shrink-0 items-center justify-center sm:flex">
        {children}
      </span>
    </p>
  );
}

function MinerFace({
  variant,
  mood,
  solved,
  accent,
}: {
  variant: FaceVariant;
  mood: FaceMood;
  solved: boolean;
  accent: CompareAccent;
}) {
  return (
    <div
      className={cn(
        "relative h-full w-16 @[28rem]/stage:w-20 @[32rem]/stage:w-24",
        solved ? accentText(accent) : "text-muted-foreground",
      )}
      aria-hidden
    >
      <HardHatIcon
        className="absolute left-1/2 -top-1 size-10 -translate-x-1/2 @[28rem]/stage:size-12 @[32rem]/stage:size-14"
        strokeWidth={1.5}
      />
      <div className="absolute left-1/2 top-[38%] size-10 -translate-x-1/2 overflow-hidden rounded-sm bg-panel @[28rem]/stage:size-12 @[32rem]/stage:size-14">
        <LedgerPersonFace variant={variant} mood={mood} className="size-full" />
      </div>
    </div>
  );
}
