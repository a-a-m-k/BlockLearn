"use client";

import {
  Children,
  Fragment,
  isValidElement,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { NetworkIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { connectorLines, copyFrameHeight, type StageBox } from "./measure";
import type { NetworkStatus } from "./model";
import { isPersonPosition, type PersonPosition } from "./scene";

type NetworkStageProps = {
  status: NetworkStatus;
  children: ReactNode;
  overlay?: ReactNode;
  /** Replaces the NetworkIcon when the desktop hub is visible (md+). */
  hub?: ReactNode;
};

const DASH_Y =
  "w-px bg-[length:1px_6px] bg-repeat-y [background-image:linear-gradient(to_bottom,currentColor_3px,transparent_3px)]";

/** Equal joins on a shared rail: peers, with no parent above the first card. */
function MobilePeerJoint({
  index,
  count,
  status,
}: {
  index: number;
  count: number;
  status: NetworkStatus;
}) {
  const tone = cn(
    "transition-colors duration-300 motion-reduce:transition-none",
    status === "mismatch" && "text-destructive",
    status === "broadcasting" && "text-brand-text",
  );
  const lineOpacity = status === "synced" ? "opacity-70" : "opacity-90";

  return (
    <div className={cn("relative md:hidden", tone)} aria-hidden>
      {count > 1 ? (
        <span
          className={cn(
            "absolute left-1/2 -translate-x-1/2",
            DASH_Y,
            lineOpacity,
            index === 0 ? "top-1/2" : "top-[calc(var(--peer-gap-y)/-2)]",
            index === count - 1
              ? "bottom-1/2"
              : "bottom-[calc(var(--peer-gap-y)/-2)]",
          )}
        />
      ) : null}
      <span
        className="absolute top-1/2 left-[calc(50%+0.25rem)] h-0.5 w-[calc(50%-0.25rem+var(--peer-gap-x))] -translate-y-1/2 bg-current"
      />
      <span className="absolute top-1/2 left-1/2 z-10 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-current bg-background" />
    </div>
  );
}

function lengthOf(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function readCopyFrame(card: HTMLElement) {
  const inner = card.querySelector("[data-notebook-body]");
  const frame = inner instanceof HTMLElement ? inner : card;
  const frameStyle = getComputedStyle(frame);
  const cardStyle = getComputedStyle(card);
  return copyFrameHeight({
    childHeights: [...frame.children].flatMap((child) =>
      child instanceof HTMLElement ? [child.offsetHeight] : [],
    ),
    padding: lengthOf(frameStyle.paddingTop) + lengthOf(frameStyle.paddingBottom),
    gap: lengthOf(frameStyle.rowGap),
    border:
      lengthOf(cardStyle.borderTopWidth) + lengthOf(cardStyle.borderBottomWidth),
  });
}

/** Keep every copy as tall as the tallest one, including after a new row lands. */
function useEqualCopyHeight() {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const sync = () => {
      const cards = [
        ...root.querySelectorAll<HTMLElement>("[data-notebook-copy]"),
      ];
      if (cards.length === 0) return;
      const max = Math.max(...cards.map(readCopyFrame));
      const next = `${max}px`;
      for (const card of cards) {
        if (card.style.minHeight !== next) card.style.minHeight = next;
      }
    };

    sync();
    const observer = new ResizeObserver(sync);
    for (const body of root.querySelectorAll("[data-notebook-body]")) {
      observer.observe(body);
    }
    return () => observer.disconnect();
  }, []);

  return ref;
}

function useNetworkLines() {
  const ref = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<ReturnType<typeof connectorLines>>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const stage = ref.current;
    if (!stage) return;

    const measure = () => {
      const bounds = stage.getBoundingClientRect();
      if (bounds.width === 0 || bounds.height === 0) return;

      const cards = new Map<PersonPosition, StageBox>();
      for (const el of stage.querySelectorAll<HTMLElement>(
        "[data-network-node]",
      )) {
        const id = el.dataset.networkNode;
        if (!id || !isPersonPosition(id)) continue;
        const rect = el.getBoundingClientRect();
        cards.set(id, {
          x: rect.left - bounds.left,
          y: rect.top - bounds.top,
          width: rect.width,
          height: rect.height,
        });
      }

      setSize({ w: bounds.width, h: bounds.height });
      setLines(connectorLines(cards));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    for (const card of stage.querySelectorAll("[data-network-node]")) {
      observer.observe(card);
    }
    return () => observer.disconnect();
  }, []);

  return { ref, lines, size };
}

export function NetworkStage({
  status,
  children,
  overlay,
  hub,
}: NetworkStageProps) {
  const copiesRef = useEqualCopyHeight();
  const network = useNetworkLines();

  return (
    <figure
      className={cn(
        "@container relative mx-auto w-full overflow-hidden text-muted-foreground",
        "md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl",
      )}
      aria-label="Distributed notebooks. Edit Alice's copy to cheat, or broadcast a new transaction to everyone."
    >
      <div ref={network.ref} className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 text-grid opacity-35 [background-image:radial-gradient(circle,currentColor_1px,transparent_1px)] [background-size:1.5rem_1.5rem]"
          aria-hidden
        />
        {network.size.w > 0 ? (
          <svg
            className={cn(
              "pointer-events-none absolute inset-0 z-0 hidden size-full transition-colors duration-300 motion-reduce:transition-none md:block",
              status === "mismatch" && "text-destructive",
              status === "broadcasting" && "text-brand-text",
            )}
            viewBox={`0 0 ${network.size.w} ${network.size.h}`}
            aria-hidden
          >
            {network.lines.map((line) => (
              <line
                key={line.id}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="currentColor"
                strokeOpacity={status === "synced" ? 0.5 : 0.85}
                strokeWidth={1.5}
                strokeDasharray="5 5"
              />
            ))}
          </svg>
        ) : null}

        <div
          className={cn(
            "pointer-events-none absolute left-1/2 top-1/2 z-[1] hidden size-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-visible rounded-full border bg-card shadow-card md:flex lg:size-24",
            status === "mismatch" && "border-destructive text-destructive",
            status === "broadcasting" &&
              "border-brand bg-accent text-brand-text",
            status === "synced" && "border-border text-muted-foreground",
          )}
          aria-hidden={hub ? undefined : true}
        >
          {hub ?? (
            <>
              <span className="absolute inset-2 rounded-full border border-current opacity-30" />
              <NetworkIcon className="size-8 lg:size-10" strokeWidth={1.4} />
            </>
          )}
        </div>

        <div
          ref={copiesRef}
          className={cn(
            "relative z-10 mx-auto grid w-full max-w-sm grid-cols-[0.75rem_minmax(0,1fr)] items-stretch",
            "gap-x-(--peer-gap-x) gap-y-(--peer-gap-y) px-3 py-5 pr-4 [--peer-gap-x:1rem] [--peer-gap-y:1rem]",
            "md:max-w-none md:grid-cols-2 md:grid-rows-2 md:items-stretch md:gap-x-24 md:gap-y-8 md:p-4",
            "lg:gap-x-28 lg:p-6",
          )}
        >
          {Children.map(children, (child, index) => (
            <Fragment
              key={isValidElement(child) ? (child.key ?? index) : index}
            >
              <MobilePeerJoint
                index={index}
                count={Children.count(children)}
                status={status}
              />
              {child}
            </Fragment>
          ))}
        </div>
      </div>

      {overlay}
    </figure>
  );
}
