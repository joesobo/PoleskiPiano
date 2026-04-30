import {
  PITCH_CLASSES,
  midiToPitchClass,
  pitchClassToSemitone,
  type PitchClass,
} from "./notes";

export interface ChordAnalysis {
  label: string;
  root?: PitchClass;
  notes: PitchClass[];
}

interface ChordPattern {
  suffix: string;
  intervals: number[];
}

const CHORD_PATTERNS: ChordPattern[] = [
  { suffix: "maj7", intervals: [0, 4, 7, 11] },
  { suffix: "7", intervals: [0, 4, 7, 10] },
  { suffix: "m7", intervals: [0, 3, 7, 10] },
  { suffix: "maj", intervals: [0, 4, 7] },
  { suffix: "m", intervals: [0, 3, 7] },
  { suffix: "dim", intervals: [0, 3, 6] },
  { suffix: "aug", intervals: [0, 4, 8] },
  { suffix: "sus2", intervals: [0, 2, 7] },
  { suffix: "sus4", intervals: [0, 5, 7] },
];

export function analyzeChord(midiNotes: number[]): ChordAnalysis {
  const notes = uniquePitchClasses(midiNotes);

  if (notes.length === 0) {
    return { label: "No notes", notes };
  }

  if (notes.length === 1) {
    return { label: notes[0], root: notes[0], notes };
  }

  const semitones = new Set(notes.map(pitchClassToSemitone));

  for (const root of notes) {
    const rootSemitone = pitchClassToSemitone(root);
    const relativeIntervals = [...semitones]
      .map((semitone) => (semitone - rootSemitone + 12) % 12)
      .sort((a, b) => a - b);

    const pattern = CHORD_PATTERNS.find((candidate) =>
      sameIntervals(relativeIntervals, candidate.intervals),
    );

    if (pattern) {
      return {
        label: `${root}${pattern.suffix}`,
        root,
        notes,
      };
    }
  }

  return {
    label: notes.join(" + "),
    notes,
  };
}

function uniquePitchClasses(midiNotes: number[]): PitchClass[] {
  const seen = new Set<PitchClass>();
  const ordered: PitchClass[] = [];

  for (const midi of midiNotes) {
    const pitchClass = midiToPitchClass(midi);
    if (!seen.has(pitchClass)) {
      seen.add(pitchClass);
      ordered.push(pitchClass);
    }
  }

  return PITCH_CLASSES.filter((pitchClass) => ordered.includes(pitchClass));
}

function sameIntervals(left: number[], right: number[]): boolean {
  return (
    left.length === right.length &&
    left.every((interval, index) => interval === right[index])
  );
}
