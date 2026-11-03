"use client";

import { CoinsIcon, HourglassIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { faceIfKnown } from "@/components/ledger/characters";
import { cn } from "@/lib/utils";

import {
  COMPARE_CARD_SHELL,
  COMPARE_STAGE_ROWS,
  COMPARE_VISUAL_SLOT,
  accentText,
} from "./compare-layout";
import { MiniChain } from "./mini-chain";
import { popMotion } from "./motion";
import type { CompareAccent, ConsensusResult } from "./types";
import { useRevealCycle } from "./reveal-cycle";
import { WinnerIcon } from "./winner-icon";

function withWinnerName(template: string, name?: string) {
  if (!name) return template;
  return template.replaceAll("{name}", name);
}

type CompareResultCardProps = {
  result: ConsensusResult;
  accent: CompareAccent;
  pending?: boolean;
  cyclePending?: boolean;
  winnerName?: string;
  followName?: string;
};

function isPending(
  cyclePending: boolean,
  cycleIsPending: boolean,
  pendingProp: boolean | undefined,
) {
  if (cyclePending) return cycleIsPending;
  return Boolean(pendingProp);
}

function headlineFor(
  pending: boolean,
  scanningName: string | undefined,
  headline: string,
  winnerName?: string,
) {
  if (pending) return scanningName ?? "Waiting";
  return withWinnerName(headline, winnerName);
}

function bodyTextFor(
  pending: boolean,
  waitingText: string | undefined,
  text: string,
  winnerName?: string,
) {
  if (pending) return waitingText ?? text;
  return withWinnerName(text, winnerName);
}

function scanningNameFor(pending: boolean, followName?: string) {
  if (!pending) return undefined;
  return followName;
}

function cardFlags(
  pending: boolean,
  reward: string | undefined,
  scanningName?: string,
) {
  return {
    showReward: Boolean(reward) && !pending,
    showHourglass: Boolean(pending && !scanningName),
  };
}

function resolveCardView({
  result,
  pending: pendingProp,
  cyclePending = false,
  winnerName,
  followName,
  cycleIsPending,
}: CompareResultCardProps & { cycleIsPending: boolean }) {
  const pending = isPending(cyclePending, cycleIsPending, pendingProp);
  const scanningName = scanningNameFor(pending, followName);
  const displayName = scanningName ?? winnerName;

  return {
    pending,
    displayName,
    displayVariant: faceIfKnown(displayName),
    headline: headlineFor(pending, scanningName, result.headline, winnerName),
    text: bodyTextFor(pending, result.waitingText, result.text, winnerName),
    ...cardFlags(pending, result.reward, scanningName),
  };
}

const MARK_CLASS = "flex aspect-square h-full items-center justify-center";

function RewardLine({ result }: { result: ConsensusResult }) {
  return (
    <>
      <div className="w-full border-t border-muted-foreground/50" aria-hidden />
      <p className="flex items-center gap-2 text-foreground">
        <CoinsIcon className="size-5 shrink-0" strokeWidth={1.5} aria-hidden />
        {result.rewardLabel ? `${result.rewardLabel} ` : null}
        {result.reward}
      </p>
    </>
  );
}

export function CompareResultCard({
  result,
  accent,
  pending,
  cyclePending = false,
  winnerName,
  followName,
}: CompareResultCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const cycle = useRevealCycle(cyclePending);
  const view = resolveCardView({
    result,
    accent,
    pending,
    cyclePending,
    winnerName,
    followName,
    cycleIsPending: cycle.pending,
  });

  return (
    <div className={cn(COMPARE_CARD_SHELL, "items-center")}>
      <p className={cn("min-h-6 text-center", accentText(accent))}>{view.headline}</p>
      <div
        className={cn(
          "grid w-full flex-1 justify-items-center gap-y-1",
          COMPARE_STAGE_ROWS,
        )}
      >
        <div className="min-h-6" aria-hidden />
        <div className={COMPARE_VISUAL_SLOT}>
          <AnimatePresence mode="popLayout" initial={false}>
            {view.showHourglass ? (
              <motion.span
                key="waiting"
                className={MARK_CLASS}
                {...popMotion(shouldReduceMotion, "scale(0.85)", "scale(1)")}
              >
                <HourglassIcon
                  className="size-full text-muted-foreground"
                  strokeWidth={1.25}
                  aria-hidden
                />
              </motion.span>
            ) : (
              <motion.span
                key={view.displayName ?? "winner"}
                className={MARK_CLASS}
                {...popMotion(shouldReduceMotion, "scale(0.85)", "scale(1)")}
              >
                <WinnerIcon
                  variant={view.displayVariant}
                  accent={accent}
                  showTrophy={!view.pending}
                />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <p className="flex min-h-6 items-center text-center text-foreground">
          {view.text}
        </p>
        <div className="flex h-full items-center">
          <MiniChain accent={accent} pending={view.pending} />
        </div>
        <div className="flex h-full w-full flex-col items-center justify-center">
          <AnimatePresence initial={false}>
            {view.showReward ? (
              <motion.div
                key="reward"
                className="flex w-full flex-col items-center gap-3"
                {...popMotion(shouldReduceMotion, "translateY(6px)", "translateY(0px)")}
              >
                <RewardLine result={result} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
