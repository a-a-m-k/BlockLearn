"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { RefreshCwIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { ScreenCenter } from "./screen-center";
import { broadcastSchedule } from "./timeline";

/** Rings + spinning refresh — fills the desktop network hub (same box as NetworkIcon). */
export function SyncHubVisual({ className }: { className?: string }) {
  const reduced = useReducedMotion();

  return (
    <div
      className={cn(
        "relative flex size-full items-center justify-center text-brand-text",
        className,
      )}
      aria-hidden
    >
      {!reduced ? (
        <>
          <motion.span
            className="absolute inset-0 rounded-full border border-brand/70"
            initial={{ scale: 0.55, opacity: 0.85 }}
            animate={{ scale: 1.55, opacity: 0 }}
            transition={{
              duration: 1.2,
              ease: "easeOut",
              repeat: Infinity,
            }}
          />
          <motion.span
            className="absolute inset-0 rounded-full border border-brand/40"
            initial={{ scale: 0.55, opacity: 0.85 }}
            animate={{ scale: 1.55, opacity: 0 }}
            transition={{
              duration: 1.2,
              ease: "easeOut",
              repeat: Infinity,
              delay: 0.4,
            }}
          />
        </>
      ) : null}
      <span className="absolute inset-2 rounded-full border border-current opacity-30" />
      {reduced ? (
        <RefreshCwIcon className="size-8 lg:size-10" strokeWidth={1.4} />
      ) : (
        <motion.span
          className="inline-flex"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, ease: "linear", repeat: Infinity }}
        >
          <RefreshCwIcon className="size-8 lg:size-10" strokeWidth={1.4} />
        </motion.span>
      )}
    </div>
  );
}

/** Fade around the spinning hub. The ledger clock commits the row, not this graphic. */
export function SyncLifecycle({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const reduced = Boolean(useReducedMotion());
  const duration = broadcastSchedule(reduced).commitAfter;

  return (
    <motion.div
      className={className}
      aria-live="polite"
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
      animate={
        reduced
          ? { opacity: [0, 1, 1, 0] }
          : { opacity: [0, 1, 1, 0], scale: [0.92, 1, 1, 0.98] }
      }
      transition={{
        duration,
        times: [0, 0.12, 0.8, 1],
        ease: "easeInOut",
      }}
    >
      {children}
      <span className="sr-only">Syncing</span>
    </motion.div>
  );
}

/** Mobile / stacked sync card — hub is hidden, so this floats in view. */
export function CenterSyncAnimation({ detail }: { detail?: ReactNode }) {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-20 bg-background/70"
        aria-hidden
      />
      <ScreenCenter
        trackViewport={Boolean(detail)}
        className={detail ? "w-[min(100%-2rem,20rem)]" : "w-max"}
      >
        <SyncLifecycle className="flex w-full flex-col items-center gap-2">
          <div className="relative size-20 overflow-visible rounded-full border border-brand bg-card shadow-card">
            <SyncHubVisual />
          </div>
          <p className="rounded-full border border-brand/40 bg-card px-3 py-1 caption font-semibold tracking-wide text-brand-text uppercase shadow-card">
            Syncing…
          </p>
          {detail}
        </SyncLifecycle>
      </ScreenCenter>
    </>
  );
}
