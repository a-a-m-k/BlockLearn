"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";

import type { DiagramBlock, DiagramBlockType } from "@/components/diagram-block";
import { cn } from "@/lib/utils";

function DiagramLoading() {
  return (
    <div
      role="status"
      className={cn(
        "diagram-shell min-h-48 animate-pulse border border-muted-foreground/50 bg-muted/20 motion-reduce:animate-none",
      )}
    >
      <span className="sr-only">Loading interactive diagram</span>
    </div>
  );
}

const OweLedgerBlock = dynamic(
  () =>
    import("@/components/ledger/owe-ledger").then(
      (module) => module.OweLedgerBlock,
    ),
  { loading: DiagramLoading, ssr: true },
);

const DistributedLedgerBlock = dynamic(
  () =>
    import("@/components/ledger/distributed-ledger").then(
      (module) => module.DistributedLedgerBlock,
    ),
  { loading: DiagramLoading, ssr: true },
);

const HashChainBlock = dynamic(
  () =>
    import("@/components/hash-chain").then((module) => module.HashChainBlock),
  { loading: DiagramLoading, ssr: true },
);

const HashCheckBlock = dynamic(
  () =>
    import("@/components/hash-check").then((module) => module.HashCheckBlock),
  { loading: DiagramLoading, ssr: true },
);

const CreateTransactionBlock = dynamic(
  () =>
    import("@/components/create-transaction").then(
      (module) => module.CreateTransactionBlock,
    ),
  { loading: DiagramLoading, ssr: true },
);

const ExploreTransactionBlock = dynamic(
  () =>
    import("@/components/explore-transaction").then(
      (module) => module.ExploreTransactionBlock,
    ),
  { loading: DiagramLoading, ssr: true },
);

const ConsensusComparePanel = dynamic(
  () =>
    import("@/components/consensus-compare").then(
      (module) => module.ConsensusComparePanel,
    ),
  { loading: DiagramLoading, ssr: true },
);

const SmartContractFlow = dynamic(
  () =>
    import("@/components/smart-contracts/flow").then(
      (module) => module.SmartContractFlow,
    ),
  { loading: DiagramLoading, ssr: true },
);

const SmartContractIfThen = dynamic(
  () =>
    import("@/components/smart-contracts/if-then").then(
      (module) => module.SmartContractIfThen,
    ),
  { loading: DiagramLoading, ssr: true },
);

const SmartContractVault = dynamic(
  () =>
    import("@/components/smart-contracts/vault").then(
      (module) => module.SmartContractVault,
    ),
  { loading: DiagramLoading, ssr: true },
);

const SmartContractUses = dynamic(
  () =>
    import("@/components/smart-contracts/uses").then(
      (module) => module.SmartContractUses,
    ),
  { loading: DiagramLoading, ssr: true },
);

const SmartContractRuleBuilder = dynamic(
  () =>
    import("@/components/smart-contracts/rule-builder").then(
      (module) => module.SmartContractRuleBuilder,
    ),
  { loading: DiagramLoading, ssr: true },
);

const DIAGRAM_RENDERERS: {
  [K in DiagramBlockType]: (
    block: Extract<DiagramBlock, { type: K }>,
  ) => ReactNode;
} = {
  "owe-ledger": (block) => <OweLedgerBlock block={block} />,
  "distributed-ledger": (block) => <DistributedLedgerBlock block={block} />,
  "hash-chain": () => <HashChainBlock />,
  "hash-check": () => <HashCheckBlock />,
  "create-transaction": (block) => <CreateTransactionBlock block={block} />,
  "explore-transaction": (block) => <ExploreTransactionBlock block={block} />,
  "consensus-compare": (block) => <ConsensusComparePanel block={block} />,
  "smart-contract-flow": () => <SmartContractFlow />,
  "smart-contract-if-then": () => <SmartContractIfThen />,
  "smart-contract-vault": () => <SmartContractVault />,
  "smart-contract-uses": () => <SmartContractUses />,
  "smart-contract-builder": () => <SmartContractRuleBuilder />,
};

export function ChapterDiagram({ block }: { block: DiagramBlock }) {
  const render = DIAGRAM_RENDERERS[block.type] as (
    block: DiagramBlock,
  ) => ReactNode;
  return render(block);
}
