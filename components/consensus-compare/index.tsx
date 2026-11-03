"use client";

import { useState } from "react";
import {
  LightbulbIcon,
  PickaxeIcon,
  ShieldCheckIcon,
  type LucideIcon,
} from "lucide-react";
import { Callout } from "@/components/callout";
import { richText } from "@/lib/rich-text";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { MethodFooter } from "./footer";
import {
  COMPARE_SPLIT,
  accentBorder,
  accentFill,
  accentText,
} from "./compare-layout";
import { PowRaceVisual } from "./miner-race";
import { CompareResultCard } from "./result-card";
import { StakeVisual } from "./validators-panel";
import type {
  CompareAccent,
  ConsensusCompareBlock,
  ConsensusMiners,
  ConsensusResult,
} from "./types";
import { DemoPlaybackBar, useDemoPlayback } from "./demo-playback";

const METHOD_BLOCK = "diagram-panel diagram-pad-loose";

const METHOD_OPTIONS: {
  value: CompareAccent;
  label: string;
  icon: LucideIcon;
  itemClass: string;
}[] = [
  {
    value: "pow",
    label: "Proof of Work",
    icon: PickaxeIcon,
    itemClass:
      "hover:bg-pow/10 hover:text-pow aria-pressed:border-pow aria-pressed:text-pow aria-pressed:hover:bg-transparent",
  },
  {
    value: "stake",
    label: "Proof of Stake",
    icon: ShieldCheckIcon,
    itemClass:
      "hover:bg-stake/10 hover:text-stake aria-pressed:border-stake aria-pressed:text-stake aria-pressed:hover:bg-transparent",
  },
];

type MethodShared = {
  title: string;
  subtitle: string;
  text?: string;
  items: string[];
  result: ConsensusResult;
  footer?: ConsensusCompareBlock["proofOfWork"]["footer"];
  callout?: ConsensusCompareBlock["proofOfWork"]["callout"];
};

type MethodView =
  | (MethodShared & {
      accent: "pow";
      demo:
        | { kind: "miners"; title?: string; miners: ConsensusMiners }
        | { kind: "none" };
    })
  | (MethodShared & {
      accent: "stake";
      demo:
        | {
            kind: "validators";
            title?: string;
            validators: NonNullable<
              ConsensusCompareBlock["proofOfStake"]["validators"]
            >;
          }
        | { kind: "none" };
    });

function toMethodView(
  selected: CompareAccent,
  block: ConsensusCompareBlock,
): MethodView {
  if (selected === "pow") {
    const method = block.proofOfWork;
    return {
      accent: "pow",
      title: method.title,
      subtitle: method.subtitle,
      text: method.text,
      items: method.items,
      result: method.result,
      footer: method.footer,
      callout: method.callout,
      demo: method.miners
        ? { kind: "miners", title: method.minersTitle, miners: method.miners }
        : { kind: "none" },
    };
  }

  const method = block.proofOfStake;
  return {
    accent: "stake",
    title: method.title,
    subtitle: method.subtitle,
    text: method.text,
    items: method.items,
    result: method.result,
    footer: method.footer,
    callout: method.callout,
    demo: method.validators
      ? {
          kind: "validators",
          title: method.validatorsTitle,
          validators: method.validators,
        }
      : { kind: "none" },
  };
}

function MethodPicker({
  selected,
  onSelect,
}: {
  selected: CompareAccent;
  onSelect: (value: CompareAccent) => void;
}) {
  return (
    <ToggleGroup
      value={[selected]}
      onValueChange={(next) => {
        const value = next[0];
        if (value === "pow" || value === "stake") onSelect(value);
      }}
      variant="outline"
      size="xl"
      spacing={3}
      className="mt-4 w-full min-w-0"
      aria-label="Choose a consensus method"
    >
      {METHOD_OPTIONS.map(({ value, label, icon: Icon, itemClass }) => (
        <ToggleGroupItem
          key={value}
          value={value}
          className={cn(
            "min-w-0 flex-1 shrink whitespace-normal px-2 text-body text-muted-foreground aria-pressed:bg-transparent aria-pressed:hover:bg-transparent sm:whitespace-nowrap sm:px-4",
            itemClass,
          )}
        >
          <Icon data-icon="inline-start" className="shrink-0" />
          <span className="min-w-0 text-center leading-tight sm:hidden">
            {value === "pow" ? "PoW" : "PoS"}
          </span>
          <span className="sr-only sm:hidden">{label}</span>
          <span className="hidden min-w-0 sm:inline">{label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function MethodSteps({ method }: { method: MethodView }) {
  const MethodIcon = method.accent === "pow" ? PickaxeIcon : ShieldCheckIcon;

  return (
    <div className={METHOD_BLOCK}>
      <h3 className="flex flex-col gap-0.5 text-body font-semibold sm:flex-row sm:items-center sm:gap-1.5">
        <span className="flex items-center gap-1.5">
          <MethodIcon
            className={cn(
              "size-7 shrink-0 sm:size-6",
              accentText(method.accent),
            )}
            aria-hidden
          />
          <span className={cn("whitespace-nowrap", accentText(method.accent))}>
            {method.title}
          </span>
        </span>
        <span className="font-normal text-muted-foreground sm:whitespace-nowrap">
          — {method.subtitle}
        </span>
      </h3>
      <ol className="mt-4 flex flex-col">
        {method.items.map((item, index, arr) => (
          <li
            key={item}
            className="grid grid-cols-[1.75rem_1fr] gap-x-3 sm:grid-cols-[1.5rem_1fr]"
          >
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full caption font-semibold sm:size-6",
                  accentFill(method.accent),
                )}
              >
                {index + 1}
              </span>
              {index < arr.length - 1 ? (
                <div
                  className={cn(
                    "mt-1 w-px flex-1 border-l border-dashed",
                    accentBorder(method.accent),
                  )}
                  aria-hidden
                />
              ) : null}
            </div>
            <p className="pb-3 text-body text-foreground">{richText(item)}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function MethodDemo({
  method,
  playback,
}: {
  method: MethodView;
  playback: ReturnType<typeof useDemoPlayback>;
}) {
  if (method.demo.kind === "miners") {
    return (
      <PowRaceVisual
        title={method.demo.title}
        miners={method.demo.miners}
        result={method.result}
        accent={method.accent}
        playing={playback.playing}
        done={playback.done}
        onComplete={playback.complete}
      />
    );
  }

  if (method.demo.kind === "validators") {
    return (
      <StakeVisual
        title={method.demo.title}
        validators={method.demo.validators}
        result={method.result}
        accent={method.accent}
        playing={playback.playing}
        done={playback.done}
        idle={playback.idle}
        onComplete={playback.complete}
      />
    );
  }

  return (
    <div className={cn(COMPARE_SPLIT, "xl:items-center")}>
      <div className="hidden xl:block" aria-hidden />
      <div className="hidden xl:block" aria-hidden />
      <CompareResultCard result={method.result} accent={method.accent} />
    </div>
  );
}

export function ConsensusComparePanel({
  block,
}: {
  block: ConsensusCompareBlock;
}) {
  const [selected, setSelected] = useState<CompareAccent>("pow");
  const playback = useDemoPlayback();
  const method = toMethodView(selected, block);
  const validatorCount =
    method.demo.kind === "validators" ? method.demo.validators.length : undefined;

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h2 className="text-title text-center font-normal tracking-tight text-foreground">
          {richText(block.title)}
        </h2>
        <p className="mt-3 text-foreground text-center">
          {richText(block.text)}
        </p>
        <p className="mt-2 text-center caption text-muted-foreground">
          Switch methods below, then play the demo to compare.
        </p>
        <MethodPicker
          selected={selected}
          onSelect={(value) => {
            setSelected(value);
            playback.reset();
          }}
        />
      </div>
      <MethodSteps method={method} />
      <div className="flex flex-col gap-4">
        <DemoPlaybackBar
          playing={playback.playing}
          hasPlayed={playback.hasPlayed}
          reducedMotion={playback.reducedMotion}
          onPlay={playback.play}
        />
        <MethodDemo method={method} playback={playback} />
        {method.footer ? (
          <MethodFooter
            footer={{
              ...method.footer,
              attempts: validatorCount ?? method.footer.attempts,
            }}
            accent={method.accent}
            playing={playback.playing}
            done={playback.done}
          />
        ) : null}
      </div>
      {method.callout ? (
        <Callout
          tone={method.accent === "pow" ? "pow" : "stake"}
          icon={LightbulbIcon}
          title={method.callout.title}
        >
          {richText(method.callout.text)}
        </Callout>
      ) : null}
    </section>
  );
}
