import {
  DEFAULT_HIGH_MIDI,
  DEFAULT_LOW_MIDI,
  PITCH_CLASSES,
  midiToPitchClass,
  pitchClassToSemitone,
  type PitchClass,
} from "./notes";
import { getScalePitchClasses, type SelectedScale } from "./scales";

export const CHORD_PREVIEW_QUALITIES = ["major", "minor"] as const;

export type ChordPreviewQuality = (typeof CHORD_PREVIEW_QUALITIES)[number];

export interface ChordPreview {
  root: PitchClass;
  quality: ChordPreviewQuality;
  value: string;
  label: string;
  optionLabel: string;
  midiNotes: number[];
  pitchClasses: PitchClass[];
}

export interface ChordPreviewOption {
  preview: ChordPreview;
  isInSelectedScale: boolean;
}

const THIRD_OCTAVE_ROOT_BASE_MIDI = 48;
const CHORD_INTERVALS: Record<ChordPreviewQuality, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
};

const CHORD_SUFFIXES: Record<ChordPreviewQuality, string> = {
  major: "maj",
  minor: "m",
};

const CHORD_QUALITY_LABELS: Record<ChordPreviewQuality, string> = {
  major: "major",
  minor: "minor",
};

export function getChordPreviewOptions(
  selectedScale: SelectedScale | null,
): ChordPreviewOption[] {
  return PITCH_CLASSES.flatMap((root) =>
    CHORD_PREVIEW_QUALITIES.map((quality) => {
      const preview = buildChordPreview(root, quality);

      return {
        preview,
        isInSelectedScale: selectedScale
          ? isChordPreviewInScale(preview, selectedScale)
          : true,
      };
    }),
  );
}

export function getChordPreviewByValue(value: string): ChordPreview | null {
  if (value === "none") {
    return null;
  }

  const [root, quality] = value.split(":");

  if (!isPitchClass(root) || !isChordPreviewQuality(quality)) {
    return null;
  }

  return buildChordPreview(root, quality);
}

export function buildChordPreview(
  root: PitchClass,
  quality: ChordPreviewQuality,
): ChordPreview {
  const midiNotes = getThirdOctaveChordMidiNotes(root, quality);

  return {
    root,
    quality,
    value: `${root}:${quality}`,
    label: `${root}${CHORD_SUFFIXES[quality]}`,
    optionLabel: `${root} ${CHORD_QUALITY_LABELS[quality]}`,
    midiNotes,
    pitchClasses: midiNotes.map(midiToPitchClass),
  };
}

export function isChordPreviewInScale(
  preview: ChordPreview,
  scale: SelectedScale,
): boolean {
  const scalePitchClasses = new Set(getScalePitchClasses(scale));

  return preview.pitchClasses.every((pitchClass) =>
    scalePitchClasses.has(pitchClass),
  );
}

function getThirdOctaveChordMidiNotes(
  root: PitchClass,
  quality: ChordPreviewQuality,
): number[] {
  const rootMidi = THIRD_OCTAVE_ROOT_BASE_MIDI + pitchClassToSemitone(root);
  const intervals = CHORD_INTERVALS[quality];
  const midiNotes = intervals.map((interval) => rootMidi + interval);

  if (
    midiNotes.some(
      (midiNote) => midiNote < DEFAULT_LOW_MIDI || midiNote > DEFAULT_HIGH_MIDI,
    )
  ) {
    throw new Error(`No preview chord shape available for ${root} ${quality}`);
  }

  return midiNotes;
}

function isPitchClass(value: string): value is PitchClass {
  return PITCH_CLASSES.includes(value as PitchClass);
}

function isChordPreviewQuality(
  value: string,
): value is ChordPreviewQuality {
  return CHORD_PREVIEW_QUALITIES.includes(value as ChordPreviewQuality);
}
