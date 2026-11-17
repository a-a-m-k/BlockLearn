import { FACE_BY_NAME } from "@/components/ledger/characters";
import { gazeTowardFromMap, type Vec2 } from "@/components/ledger/gaze";
import type { FaceGaze, FaceMood, FaceVariant } from "@/components/ledger/person-face";

import type { NetworkStatus } from "./model";

export const PERSON_POSITIONS = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
] as const;

export type PersonPosition = (typeof PERSON_POSITIONS)[number];

export function isPersonPosition(value: string): value is PersonPosition {
  return (PERSON_POSITIONS as readonly string[]).includes(value);
}

export type NetworkPerson = {
  name: string;
  variant: FaceVariant;
  position: PersonPosition;
};

const CHEATER = "Alice";

export const PEOPLE: NetworkPerson[] = [
  { name: "Alice", variant: FACE_BY_NAME.Alice, position: "top-left" },
  { name: "Bob", variant: FACE_BY_NAME.Bob, position: "top-right" },
  { name: "Emma", variant: FACE_BY_NAME.Emma, position: "bottom-left" },
  { name: "Alex", variant: FACE_BY_NAME.Alex, position: "bottom-right" },
];

const COLS = 2;
const ROWS = 2;

/** Which equal cell a copy occupies. Lines use the same slot. */
const SLOT: Record<
  PersonPosition,
  { col: 1 | 2; row: 1 | 2; className: string }
> = {
  "top-left": { col: 1, row: 1, className: "md:col-start-1 md:row-start-1" },
  "top-right": { col: 2, row: 1, className: "md:col-start-2 md:row-start-1" },
  "bottom-left": { col: 1, row: 2, className: "md:col-start-1 md:row-start-2" },
  "bottom-right": { col: 2, row: 2, className: "md:col-start-2 md:row-start-2" },
};

/** Fill the cell so every copy shares the row height. */
const CELL = "h-full w-full self-stretch";

export const POSITION_CLASS: Record<PersonPosition, string> = {
  "top-left": `${CELL} ${SLOT["top-left"].className}`,
  "top-right": `${CELL} ${SLOT["top-right"].className}`,
  "bottom-left": `${CELL} ${SLOT["bottom-left"].className}`,
  "bottom-right": `${CELL} ${SLOT["bottom-right"].className}`,
};

function cellCenter(index: number, count: number) {
  return ((index - 0.5) / count) * 100;
}

/** Center of each copy's cell. The stage is that grid, with no gap between cells. */
export const NODE: Record<PersonPosition, { x: number; y: number }> = {
  "top-left": {
    x: cellCenter(SLOT["top-left"].col, COLS),
    y: cellCenter(SLOT["top-left"].row, ROWS),
  },
  "top-right": {
    x: cellCenter(SLOT["top-right"].col, COLS),
    y: cellCenter(SLOT["top-right"].row, ROWS),
  },
  "bottom-left": {
    x: cellCenter(SLOT["bottom-left"].col, COLS),
    y: cellCenter(SLOT["bottom-left"].row, ROWS),
  },
  "bottom-right": {
    x: cellCenter(SLOT["bottom-right"].col, COLS),
    y: cellCenter(SLOT["bottom-right"].row, ROWS),
  },
};

export const CONNECTIONS: [PersonPosition, PersonPosition][] = [
  ["top-left", "top-right"],
  ["top-left", "bottom-left"],
  ["top-right", "bottom-right"],
  ["bottom-left", "bottom-right"],
  ["top-left", "bottom-right"],
  ["top-right", "bottom-left"],
];

const POSITION_VEC: Record<PersonPosition, Vec2> = {
  "top-left": { x: -1, y: -1 },
  "top-right": { x: 1, y: -1 },
  "bottom-left": { x: -1, y: 1 },
  "bottom-right": { x: 1, y: 1 },
};

function gazeToward(from: PersonPosition, to: PersonPosition): FaceGaze {
  return gazeTowardFromMap(from, to, POSITION_VEC);
}

function moodFor(
  name: string,
  status: NetworkStatus,
  mismatching: boolean,
): FaceMood {
  if (status === "broadcasting") return "happy";
  if (status === "mismatch" || mismatching) {
    return name === CHEATER ? "happy" : "angry";
  }
  return "neutral";
}

function notebookTone(
  isCheater: boolean,
  status: NetworkStatus,
): "destructive" | "brand" | "default" {
  if (isCheater && status === "mismatch") return "destructive";
  if (status === "mismatch" || status === "broadcasting") return "brand";
  return "default";
}

/** Presentation fields for a peer's notebook copy, derived from scene state. */
export function peerCopyPresentation(
  person: NetworkPerson,
  status: NetworkStatus,
  mismatching: boolean,
) {
  const isCheater = person.name === CHEATER;
  const mood = moodFor(person.name, status, mismatching);
  const angry = mood === "angry" || mood === "disappointed";

  return {
    isCheater,
    mood,
    gaze: angry ? gazeToward(person.position, "top-left") : undefined,
    tone: notebookTone(isCheater, status),
    amountTone:
      isCheater && status === "mismatch"
        ? ("destructive" as const)
        : ("default" as const),
    editable: isCheater && status !== "broadcasting",
  };
}
