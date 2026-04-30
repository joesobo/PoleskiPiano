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
  isNamedChord: boolean;
  quality?: ChordQuality;
}

export type ChordQuality =
  | "major"
  | "minor"
  | "dominantSeventh"
  | "majorSeventh"
  | "minorSeventh"
  | "diminished"
  | "augmented"
  | "suspendedSecond"
  | "suspendedFourth";

interface ChordPattern {
  suffix: string;
  intervals: number[];
  quality: ChordQuality;
}

const CHORD_PATTERNS: ChordPattern[] = [
  { suffix: "maj7", intervals: [0, 4, 7, 11], quality: "majorSeventh" },
  { suffix: "7", intervals: [0, 4, 7, 10], quality: "dominantSeventh" },
  { suffix: "m7", intervals: [0, 3, 7, 10], quality: "minorSeventh" },
  { suffix: "maj", intervals: [0, 4, 7], quality: "major" },
  { suffix: "m", intervals: [0, 3, 7], quality: "minor" },
  { suffix: "dim", intervals: [0, 3, 6], quality: "diminished" },
  { suffix: "aug", intervals: [0, 4, 8], quality: "augmented" },
  { suffix: "sus2", intervals: [0, 2, 7], quality: "suspendedSecond" },
  { suffix: "sus4", intervals: [0, 5, 7], quality: "suspendedFourth" },
];

export function analyzeChord(midiNotes: number[]): ChordAnalysis {
  const notes = uniquePitchClasses(midiNotes);

  if (notes.length === 0) {
    return { label: "No notes", notes, isNamedChord: false };
  }

  if (notes.length === 1) {
    return { label: notes[0], root: notes[0], notes, isNamedChord: false };
  }

  const semitones = new Set(notes.map(pitchClassToSemitone));
  const rootCandidates = PITCH_CLASSES.filter((pitchClass) =>
    notes.includes(pitchClass),
  );

  for (const root of rootCandidates) {
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
        isNamedChord: true,
        quality: pattern.quality,
      };
    }
  }

  return {
    label: notes.join(" + "),
    notes,
    isNamedChord: false,
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

  return ordered;
}

function sameIntervals(left: number[], right: number[]): boolean {
  return (
    left.length === right.length &&
    left.every((interval, index) => interval === right[index])
  );
}
