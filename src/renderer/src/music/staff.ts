import {
  DEFAULT_HIGH_MIDI,
  DEFAULT_LOW_MIDI,
  isBlackPitchClass,
  midiToNoteName,
  midiToPitchClass,
  type PitchClass,
} from "./notes";

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
const SIMULTANEOUS_NOTE_WINDOW_MS = 250;
const STAFF_NOTE_START_X = 170;
const STAFF_NOTE_GROUP_SPACING = 58;
const STAFF_NOTE_COLLISION_OFFSET_X = 18;
const STAFF_INPUT_LEFT = 92;
const STAFF_INPUT_RIGHT = 492;
const STAFF_INPUT_VERTICAL_SNAP_RADIUS = STAFF_SPACING / 2;

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

export interface StaffInputTarget {
  midi: number;
  placement: StaffNotePlacement;
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
  return groupTimedMidiNotesForStaff(notes).flat();
}

export function groupTimedMidiNotesForStaff(
  notes: TimedStaffMidiNote[],
): number[][] {
  const orderedByOnset = [...notes].sort(
    (left, right) =>
      left.receivedAt - right.receivedAt || left.midi - right.midi,
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

  return groups.map((group) =>
    group
      .sort((left, right) => left.midi - right.midi)
      .map((note) => note.midi),
  );
}

export function getStaffPlacements(midiNotes: number[]): StaffNotePlacement[] {
  return getStaffPlacementsForGroups(midiNotes.map((midi) => [midi]));
}

export function getStaffPlacementsForGroups(
  midiNoteGroups: number[][],
): StaffNotePlacement[] {
  return midiNoteGroups.flatMap((midiNotes, groupIndex) => {
    const laneCounts = new Map<string, number>();
    const groupX = STAFF_NOTE_START_X + groupIndex * STAFF_NOTE_GROUP_SPACING;

    return midiNotes.map((midi) => {
      const placement = getStaffPlacementForMidi(midi, groupX);
      const laneKey = `${placement.clef}:${Math.round(placement.y)}`;
      const laneOffset = laneCounts.get(laneKey) ?? 0;

      laneCounts.set(laneKey, laneOffset + 1);

      return {
        ...placement,
        x: placement.x + laneOffset * STAFF_NOTE_COLLISION_OFFSET_X,
      };
    });
  });
}

export function getStaffPlacementForMidi(
  midi: number,
  x = STAFF_NOTE_START_X,
): StaffNotePlacement {
  const noteName = midiToNoteName(midi);
  const parsed = parseNoteName(noteName);
  const clef = midi >= 60 ? "treble" : "bass";
  const top = clef === "treble" ? TREBLE_TOP : BASS_TOP;
  const topIndex =
    clef === "treble" ? TREBLE_TOP_LINE_INDEX : BASS_TOP_LINE_INDEX;
  const y =
    top + (topIndex - diatonicIndex(parsed.letter, parsed.octave)) * 8;

  return {
    clef,
    x,
    y,
    label: noteName.replace(/\d+$/, ""),
    pitchClass: midiToPitchClass(midi),
    ledgerLines: getLedgerLines(y, top),
  };
}

export function getStaffInputTargetFromPoint(
  point: { x: number; y: number },
): StaffInputTarget | null {
  const candidates = getNaturalStaffInputCandidates();
  const minY =
    Math.min(...candidates.map((candidate) => candidate.placement.y)) -
    STAFF_INPUT_VERTICAL_SNAP_RADIUS;
  const maxY =
    Math.max(...candidates.map((candidate) => candidate.placement.y)) +
    STAFF_INPUT_VERTICAL_SNAP_RADIUS;

  if (point.y < minY || point.y > maxY) {
    return null;
  }

  const nearest = candidates.reduce((bestCandidate, candidate) => {
    const bestDistance = Math.abs(point.y - bestCandidate.placement.y);
    const candidateDistance = Math.abs(point.y - candidate.placement.y);

    return candidateDistance < bestDistance ? candidate : bestCandidate;
  });

  return {
    midi: nearest.midi,
    placement: {
      ...nearest.placement,
      x: Math.max(STAFF_INPUT_LEFT, Math.min(STAFF_INPUT_RIGHT, point.x)),
    },
  };
}

function getNaturalStaffInputCandidates(): StaffInputTarget[] {
  const candidates: StaffInputTarget[] = [];

  for (let midi = DEFAULT_LOW_MIDI; midi <= DEFAULT_HIGH_MIDI; midi += 1) {
    if (!isBlackPitchClass(midiToPitchClass(midi))) {
      candidates.push({
        midi,
        placement: getStaffPlacementForMidi(midi),
      });
    }
  }

  return candidates;
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
