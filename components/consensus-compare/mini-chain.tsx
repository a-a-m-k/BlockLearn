"use client";

import { motion, useReducedMotion } from "motion/react";
import { WireCube } from "@/components/hash-chain/visuals";
import { cn } from "@/lib/utils";

import { accentText } from "./compare-layout";
import { springPop } from "./motion";
import type { CompareAccent } from "./types";

function cubeMotion(hidden: boolean, reduced: boolean | null) {
  if (reduced) return { opacity: hidden ? 0 : 1 };
  return {
    opacity: hidden ? 0 : 1,
    transform: hidden
      ? "translateX(8px) scale(0.7)"
      : "translateX(0px) scale(1)",
  };
}

function ChainLink({
  index,
  pending,
  reduced,
  cubeClass,
}: {
  index: number;
  pending: boolean;
  reduced: boolean | null;
  cubeClass: string;
}) {
  const incoming = index === 2;
  const hidden = incoming && pending;

  return (
    <div className="flex items-center">
      {index > 0 ? (
        <motion.div
          className="h-px w-2 origin-left bg-muted-foreground/50"
          initial={false}
          animate={{
            transform:
              hidden && !reduced ? "scaleX(0)" : "scaleX(1)",
            opacity: hidden ? 0 : 1,
          }}
          transition={springPop}
        />
      ) : null}
      <motion.div
        className="flex size-8 shrink-0 items-center justify-center @[28rem]/stage:size-10"
        initial={false}
        animate={cubeMotion(hidden, reduced)}
        transition={springPop}
      >
        <WireCube className={cubeClass} />
      </motion.div>
    </div>
  );
}

export function MiniChain({
  accent,
  pending = false,
}: {
  accent: CompareAccent;
  pending?: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();
  const cubeClass = cn("size-full", accentText(accent));

  return (
    <div
      className="flex h-8 w-[7rem] items-center @[28rem]/stage:h-10 @[28rem]/stage:w-[8.5rem]"
      aria-hidden
    >
      {[0, 1, 2].map((index) => (
        <ChainLink
          key={index}
          index={index}
          pending={pending}
          reduced={shouldReduceMotion}
          cubeClass={cubeClass}
        />
      ))}
    </div>
  );
}
