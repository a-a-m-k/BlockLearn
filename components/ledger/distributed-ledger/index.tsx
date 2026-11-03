"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";
import { RadioIcon, TriangleAlertIcon } from "lucide-react";

import { Callout } from "@/components/callout";
import { Button } from "@/components/ui/button";
import type { ContentBlock } from "@/lib/chapter-content";

import { formatAmount } from "@/components/ledger/amounts";
import type { AmountEntry, NetworkStatus } from "./model";
import {
  PEOPLE,
  POSITION_CLASS,
  peerCopyPresentation,
  type NetworkPerson,
} from "./scene";
import { NetworkStage } from "./network-stage";
import { NotebookCopy } from "./notebook-copy";
import { ScreenCenter } from "./screen-center";
import { CenterSyncAnimation } from "./sync-animation";
import { useDistributedLedger } from "./use-distributed-ledger";

type DistributedLedgerBlockProps = {
  block: Extract<ContentBlock, { type: "distributed-ledger" }>;
};

/** True while notebooks are stacked. Desktop network starts at md. */
function useStackedCopies() {
  const [stacked, setStacked] = useState(false);

  useLayoutEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const onChange = () => setStacked(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return stacked;
}

export function DistributedLedgerBlock({ block }: DistributedLedgerBlockProps) {
  const {
    shared,
    aliceEntries,
    status,
    mismatching,
    newRowIndex,
    canBroadcast,
    nextBroadcast,
    setAliceAmount,
    broadcastNext,
    finishBroadcast,
  } = useDistributedLedger(block);
  const stacked = useStackedCopies();

  const broadcastCallout =
    status === "broadcasting" ? (
      <BroadcastCallout stacked={stacked} />
    ) : null;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface-raised shadow-card">
      <NetworkStage
        status={status}
        overlay={
          <StageOverlay
            status={status}
            stacked={stacked}
            broadcastCallout={broadcastCallout}
            onSyncComplete={() => void finishBroadcast()}
          />
        }
      >
        {PEOPLE.map((person) => (
          <NetworkPeerCopy
            key={person.name}
            person={person}
            status={status}
            mismatching={mismatching}
            shared={shared}
            aliceEntries={aliceEntries}
            newRowIndex={newRowIndex}
            onAliceAmountChange={setAliceAmount}
          />
        ))}
      </NetworkStage>

      <div className="flex flex-col gap-3 border-t border-border bg-card p-4 sm:flex-row sm:items-center sm:p-5">
        <Button
          type="button"
          variant="default"
          className="w-full shrink-0 caption sm:w-auto"
          size="lg"
          icon={RadioIcon}
          disabled={!canBroadcast}
          onClick={broadcastNext}
        >
          {nextBroadcast
            ? `Broadcast ${nextBroadcast.from} → ${nextBroadcast.to} ${formatAmount(nextBroadcast.amount)}`
            : "All sample entries broadcast"}
        </Button>
        <p className="caption flex-1 text-muted-foreground">
          Edit Alice&apos;s amounts to try cheating, or broadcast a new
          who-owes-whom entry to every copy.
        </p>
      </div>

      {!stacked && broadcastCallout ? (
        <div className="border-t border-border p-4 sm:p-5">
          {broadcastCallout}
        </div>
      ) : null}
    </section>
  );
}

function BroadcastCallout({ stacked }: { stacked: boolean }) {
  return (
    <Callout
      tone="brand"
      title="Broadcasting…"
      className={
        stacked
          ? "caption justify-center bg-panel text-center shadow-lg [&_p]:text-center"
          : "caption"
      }
    >
      Every copy appends the same new entry—no one is left out.
    </Callout>
  );
}

function StageOverlay({
  status,
  stacked,
  broadcastCallout,
  onSyncComplete,
}: {
  status: NetworkStatus;
  stacked: boolean;
  broadcastCallout: ReactNode;
  onSyncComplete: () => void;
}) {
  return (
    <>
      {status === "broadcasting" ? (
        <CenterSyncAnimation
          key="sync"
          onComplete={onSyncComplete}
          detail={stacked ? broadcastCallout : null}
        />
      ) : null}
      {status === "mismatch" ? (
        <div className="pointer-events-none absolute inset-0 z-20 bg-background/80">
          <ScreenCenter
            trackViewport={stacked}
            className="w-[min(100%-2rem,24rem)]"
          >
            <div className="rounded-lg bg-background">
              <Callout
                tone="destructive"
                icon={TriangleAlertIcon}
                title="Mismatch detected."
                className="flex-col items-center border-2 border-destructive bg-background text-center shadow-xl [&_p]:text-center [&_svg]:mt-0 [&_svg]:size-icon-lg"
              >
                Bob, Emma, and Alex still have the shared record—Alice&apos;s
                edit is rejected and her copy snaps back.
              </Callout>
            </div>
          </ScreenCenter>
        </div>
      ) : null}
    </>
  );
}

function NetworkPeerCopy({
  person,
  status,
  mismatching,
  shared,
  aliceEntries,
  newRowIndex,
  onAliceAmountChange,
}: {
  person: NetworkPerson;
  status: NetworkStatus;
  mismatching: boolean;
  shared: AmountEntry[];
  aliceEntries: AmountEntry[];
  newRowIndex: number | null;
  onAliceAmountChange: (index: number, amount: number) => void;
}) {
  const presentation = peerCopyPresentation(person, status, mismatching);

  return (
    <NotebookCopy
      name={person.name}
      position={person.position}
      variant={person.variant}
      mood={presentation.mood}
      gaze={presentation.gaze}
      entries={presentation.isCheater ? aliceEntries : shared}
      editable={presentation.editable}
      tone={presentation.tone}
      amountTone={presentation.amountTone}
      newRowIndex={newRowIndex}
      onAmountChange={
        presentation.isCheater ? onAliceAmountChange : undefined
      }
      className={POSITION_CLASS[person.position]}
    />
  );
}
