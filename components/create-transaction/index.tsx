"use client";

import { useEffect, useState } from "react";
import { ArrowRightIcon, RefreshCwIcon } from "lucide-react";
import { useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";

import { StepPanel } from "./step-panel";
import type { CreateTransactionContent } from "./types";

type CreateTransactionBlockProps = {
  block: CreateTransactionContent;
};

type StepPlayback = {
  activeStep: number;
  lastStep: number;
  runId: number;
  onSend: () => void;
  onNext: () => void;
  onReplay: () => void;
};

function statusText(
  reducedMotion: boolean,
  activeStep: number,
  lastStep: number,
  title: string,
) {
  if (reducedMotion) {
    return "Animation is off, so this shows the finished result.";
  }
  if (activeStep === 0) return "Ready to sign and send.";
  return `Step ${activeStep + 1} of ${lastStep + 1}: ${title}`;
}

function AllStepsList({
  block,
  runId,
  onSend,
}: {
  block: CreateTransactionContent;
  runId: number;
  onSend: () => void;
}) {
  return (
    <div role="list" className="flex flex-col gap-3 sm:gap-4">
      {block.steps.map((item, index) => (
        <StepPanel
          key={item.title}
          step={item}
          index={index}
          stepCount={block.steps.length}
          block={block}
          reducedMotion
          runId={runId}
          active
          onSend={onSend}
        />
      ))}
    </div>
  );
}

function ActiveStepList({
  block,
  step,
  playback,
}: {
  block: CreateTransactionContent;
  step: CreateTransactionContent["steps"][number];
  playback: StepPlayback;
}) {
  const { activeStep, lastStep, runId, onSend, onNext, onReplay } = playback;
  const isLast = activeStep >= lastStep;

  return (
    <div role="list">
      <StepPanel
        key={`${runId}-${activeStep}`}
        step={step}
        index={activeStep}
        stepCount={block.steps.length}
        block={block}
        reducedMotion={false}
        runId={runId}
        active={activeStep > 0}
        onSend={onSend}
        footer={
          activeStep === 0 ? null : (
            <Button
              type="button"
              variant="cta"
              size="sm"
              className="h-10 w-full"
              icon={isLast ? RefreshCwIcon : undefined}
              onClick={isLast ? onReplay : onNext}
            >
              {isLast ? "Replay" : "Next step"}
              {isLast ? null : <ArrowRightIcon data-icon="inline-end" />}
            </Button>
          )
        }
      />
    </div>
  );
}

export function CreateTransactionBlock({ block }: CreateTransactionBlockProps) {
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = prefersReducedMotion === true;
  const lastStep = block.steps.length - 1;
  const [activeStep, setActiveStep] = useState(0);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    if (reducedMotion) setActiveStep(lastStep);
  }, [reducedMotion, lastStep]);

  const step = block.steps[activeStep] ?? block.steps[0];

  function handleSend() {
    if (reducedMotion || activeStep > 0) return;
    setActiveStep(1);
  }

  function handleNext() {
    setActiveStep((index) => Math.min(index + 1, lastStep));
  }

  function handleReplay() {
    if (reducedMotion) return;
    setRunId((id) => id + 1);
    setActiveStep(0);
  }

  const playback: StepPlayback = {
    activeStep,
    lastStep,
    runId,
    onSend: handleSend,
    onNext: handleNext,
    onReplay: handleReplay,
  };

  return (
    <figure
      className="w-full min-w-0 overflow-x-hidden text-foreground"
      aria-label={`Create a transaction from ${block.from} to ${block.to}, then watch it get signed, broadcast, wait in the mempool, and land in a block.`}
    >
      <p role="status" aria-live="polite" className="sr-only">
        {statusText(reducedMotion, activeStep, lastStep, step.title)}
      </p>
      {reducedMotion ? (
        <AllStepsList block={block} runId={runId} onSend={handleSend} />
      ) : (
        <ActiveStepList block={block} step={step} playback={playback} />
      )}
    </figure>
  );
}
