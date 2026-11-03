import type { ContentBlock } from "@/lib/chapter-content";
import type { ChapterQuiz } from "@/lib/quizzes";

/** Typical adult reading pace for explanatory prose. */
const WORDS_PER_MINUTE = 200;

/** Extra time to try a hands-on diagram, in seconds. */
const INTERACTIVE_SECONDS: Partial<Record<ContentBlock["type"], number>> = {
  "owe-ledger": 25,
  "distributed-ledger": 40,
  "hash-chain": 30,
  "hash-check": 35,
  "create-transaction": 45,
  "explore-transaction": 50,
  "consensus-compare": 60,
  "smart-contract-flow": 30,
  "smart-contract-if-then": 35,
  "smart-contract-vault": 35,
  "smart-contract-uses": 25,
  "smart-contract-builder": 50,
};

function countWords(text: string) {
  return text
    .replace(/\*\*/g, "")
    .replace(/[—–]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function collectConsensusText(
  block: Extract<ContentBlock, { type: "consensus-compare" }>,
) {
  const methods = [block.proofOfWork, block.proofOfStake];

  return [
    block.title,
    block.text,
    ...methods.flatMap((method) => [
      method.title,
      method.subtitle,
      method.text,
      ...method.items,
      method.minersTitle ?? "",
      method.validatorsTitle ?? "",
      method.callout?.title ?? "",
      method.callout?.text ?? "",
      method.result.headline,
      method.result.text,
    ]),
  ];
}

const TEXT_COLLECTORS: {
  [K in ContentBlock["type"]]?: (
    block: Extract<ContentBlock, { type: K }>,
  ) => string[];
} = {
  section: (block) => [
    block.title ?? "",
    ...block.blocks.flatMap(collectBlockText),
  ],
  paragraph: (block) => [block.text],
  list: (block) => block.items.flatMap((item) => [item.label, item.text]),
  callout: (block) => [block.title, block.text],
  steps: (block) => [
    block.title,
    ...block.items.flatMap((item) => [item.title, item.text]),
  ],
  "create-transaction": (block) =>
    block.steps.flatMap((step) => [step.title, step.text ?? ""]),
  "explore-transaction": (block) => [
    block.whyItMatters.title,
    ...block.fields.flatMap((field) => [
      field.label,
      field.description,
      field.whyItMatters,
    ]),
  ],
  "consensus-compare": collectConsensusText,
};

function collectBlockText(block: ContentBlock): string[] {
  const collect = TEXT_COLLECTORS[block.type] as
    | ((block: ContentBlock) => string[])
    | undefined;
  return collect ? collect(block) : [];
}

function collectQuizText(quiz: ChapterQuiz) {
  return quiz.questions.flatMap((question) => [
    question.question,
    ...question.options.map((option) => option.text),
    question.explanation ?? "",
  ]);
}

function interactiveSeconds(blocks: ContentBlock[]): number {
  let total = 0;

  for (const block of blocks) {
    if (block.type === "section") {
      total += interactiveSeconds(block.blocks);
      continue;
    }

    total += INTERACTIVE_SECONDS[block.type] ?? 0;
  }

  return total;
}

export function estimateReadMinutes(
  blocks: ContentBlock[],
  quiz?: ChapterQuiz,
) {
  const textParts = [
    ...blocks.flatMap(collectBlockText),
    ...(quiz ? collectQuizText(quiz) : []),
  ];
  const words = textParts.reduce(
    (total, text) => total + countWords(text),
    0,
  );
  const seconds =
    (words / WORDS_PER_MINUTE) * 60 + interactiveSeconds(blocks);

  return Math.max(1, Math.round(seconds / 60));
}
