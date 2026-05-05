import {
  PITCH_CLASSES,
  midiToPitchClass,
  pitchClassToSemitone,
  type PitchClass,
} from "./notes";
import {
  createPracticeSongMusicXml,
  parsePracticeSong,
  type MusicXmlDraftTarget,
  type PracticeSongOption,
} from "./practiceSongs";
import { SCALE_MODE_LABELS, type SelectedScale } from "./scales";

export const RANDOM_SCALE_CHORD_PRACTICE_ID =
  "generated/random-scale-chords.musicxml";

const RANDOM_CHORD_TARGET_COUNT = 16;
const RANDOM_CHORD_DURATION_BEATS = 2;
const DEFAULT_RANDOM_CHORD_SCALE: SelectedScale = {
  tonic: "C",
  mode: "major",
};
const SCALE_INTERVALS: Record<SelectedScale["mode"], number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

export function createRandomScaleChordPracticeSongOption(
  selectedScale: SelectedScale | null,
  seed = 1,
): PracticeSongOption & { status: "valid"; rawMusicXml: string } {
  const scale = selectedScale ?? DEFAULT_RANDOM_CHORD_SCALE;
  const title = `Random ${scale.tonic} ${SCALE_MODE_LABELS[scale.mode]} Chords`;
  const targets = buildRandomScaleChordTargets(scale, seed);
  const rawMusicXml = createPracticeSongMusicXml({
    title,
    scale,
    targets,
  });
  const song = parsePracticeSong(rawMusicXml, RANDOM_SCALE_CHORD_PRACTICE_ID, title);

  return {
    status: "valid",
    id: RANDOM_SCALE_CHORD_PRACTICE_ID,
    title,
    path: RANDOM_SCALE_CHORD_PRACTICE_ID,
    song,
    rawMusicXml,
  };
}

export function createRandomScaleChordPracticeSeed(): number {
  return Math.floor(Math.random() * 2147483646) + 1;
}

export function getNextRandomScaleChordPracticeSeed(seed: number): number {
  return (seed % 2147483646) + 1;
}

function buildRandomScaleChordTargets(
  scale: SelectedScale,
  seed: number,
): MusicXmlDraftTarget[] {
  const rng = createSeededRandom(seed + scaleToSeed(scale));
  const chords = buildDiatonicTriads(scale);

  return Array.from({ length: RANDOM_CHORD_TARGET_COUNT }, () => {
    const chord = chords[Math.floor(rng() * chords.length)] ?? chords[0];

    return {
      durationBeats: RANDOM_CHORD_DURATION_BEATS,
      notes: chord.map((midi) => ({
        midi,
        durationBeats: RANDOM_CHORD_DURATION_BEATS,
      })),
    };
  });
}

function buildDiatonicTriads(scale: SelectedScale): number[][] {
  const intervals = SCALE_INTERVALS[scale.mode];
  const tonicMidi = 48 + pitchClassToSemitone(scale.tonic);

  return intervals
    .map((_, degree) =>
      [0, 2, 4].map((offset) => {
        const intervalIndex = degree + offset;
        const octaveOffset = Math.floor(intervalIndex / intervals.length) * 12;

        return tonicMidi + intervals[intervalIndex % intervals.length] + octaveOffset;
      }),
    )
    .filter((midiNotes) => isMajorOrMinorTriad(midiNotes))
    .map(fitChordToPracticeRange);
}

function fitChordToPracticeRange(midiNotes: number[]): number[] {
  let fittedNotes = [...midiNotes];

  while (Math.max(...fittedNotes) > 72) {
    fittedNotes = fittedNotes.map((midi) => midi - 12);
  }

  while (Math.min(...fittedNotes) < 36) {
    fittedNotes = fittedNotes.map((midi) => midi + 12);
  }

  return fittedNotes;
}

function isMajorOrMinorTriad(midiNotes: number[]): boolean {
  const root = pitchClassToSemitone(midiToPitchClass(midiNotes[0] ?? 0));
  const normalized = midiNotes.map(
    (midi) => (pitchClassToSemitone(midiToPitchClass(midi)) - root + 12) % 12,
  );
  const signature = normalized.join(",");

  return signature === "0,3,7" || signature === "0,4,7";
}

function createSeededRandom(seed: number): () => number {
  let state = Math.max(1, Math.floor(seed) % 2147483647);

  return () => {
    state = (state * 16807) % 2147483647;

    return (state - 1) / 2147483646;
  };
}

function scaleToSeed(scale: SelectedScale): number {
  return (
    PITCH_CLASSES.indexOf(scale.tonic as PitchClass) * 31 +
    (scale.mode === "major" ? 101 : 503)
  );
}
