import { midiToNoteName, midiToPitchClass, type PitchClass } from "./notes";

const LETTER_STEPS: Record<string, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
};

const STAFF_SPACING = 16;
const TREBLE_TOP = 54;
const BASS_TOP = 218;
const TREBLE_TOP_LINE_INDEX = diatonicIndex("F", 5);
const BASS_TOP_LINE_INDEX = diatonicIndex("A", 3);
const SIMULTANEOUS_NOTE_WINDOW_MS = 35;

export interface TimedStaffMidiNote {
  midi: number;
  receivedAt: number;
}

export interface StaffNotePlacement {
  clef: "treble" | "bass";
  x: number;
  y: number;
  label: string;
  pitchClass: PitchClass;
  ledgerLines: number[];
}

export const staffMetrics = {
  trebleTop: TREBLE_TOP,
  bassTop: BASS_TOP,
  spacing: STAFF_SPACING,
  width: 520,
  height: 344,
};

export function orderTimedMidiNotesForStaff(
  notes: TimedStaffMidiNote[],
): number[] {
  const orderedByOnset = [...notes].sort(
    (left, right) => left.receivedAt - right.receivedAt || left.midi - right.midi,
  );
  const groups: TimedStaffMidiNote[][] = [];

  for (const note of orderedByOnset) {
    const current = groups.at(-1);

    if (
      current &&
      note.receivedAt - current[0].receivedAt <= SIMULTANEOUS_NOTE_WINDOW_MS
    ) {
      current.push(note);
      continue;
    }

    groups.push([note]);
  }

  return groups.flatMap((group) =>
    group.sort((left, right) => left.midi - right.midi).map((note) => note.midi),
  );
}

export function getStaffPlacements(midiNotes: number[]): StaffNotePlacement[] {
  const laneCounts = new Map<string, number>();

  return midiNotes.map((midi, index) => {
    const noteName = midiToNoteName(midi);
    const parsed = parseNoteName(noteName);
    const clef = midi >= 60 ? "treble" : "bass";
    const top = clef === "treble" ? TREBLE_TOP : BASS_TOP;
    const topIndex =
      clef === "treble" ? TREBLE_TOP_LINE_INDEX : BASS_TOP_LINE_INDEX;
    const y = top + (topIndex - diatonicIndex(parsed.letter, parsed.octave)) * 8;
    const laneKey = `${clef}:${Math.round(y)}`;
    const laneOffset = laneCounts.get(laneKey) ?? 0;

    laneCounts.set(laneKey, laneOffset + 1);

    return {
      clef,
      x: 170 + index * 58 + laneOffset * 18,
      y,
      label: noteName.replace(/\d+$/, ""),
      pitchClass: midiToPitchClass(midi),
      ledgerLines: getLedgerLines(y, top),
    };
  });
}

function parseNoteName(noteName: string): { letter: string; octave: number } {
  const match = /^([A-G])#?(-?\d+)$/.exec(noteName);
  if (!match) {
    throw new Error(`Invalid note name: ${noteName}`);
  }

  return { letter: match[1], octave: Number(match[2]) };
}

function diatonicIndex(letter: string, octave: number): number {
  return octave * 7 + LETTER_STEPS[letter];
}

function getLedgerLines(y: number, top: number): number[] {
  const bottom = top + STAFF_SPACING * 4;
  const ledgerLines: number[] = [];

  if (y > bottom + STAFF_SPACING / 2) {
    for (
      let lineY = bottom + STAFF_SPACING;
      lineY <= y + 1;
      lineY += STAFF_SPACING
    ) {
      ledgerLines.push(lineY);
    }
  }

  if (y < top - STAFF_SPACING / 2) {
    for (
      let lineY = top - STAFF_SPACING;
      lineY >= y - 1;
      lineY -= STAFF_SPACING
    ) {
      ledgerLines.push(lineY);
    }
  }

  return ledgerLines;
}
