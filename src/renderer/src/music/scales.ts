import {
  PITCH_CLASSES,
  pitchClassToSemitone,
  type PitchClass,
} from "./notes";

export const SCALE_MODES = ["major", "minor"] as const;

export type ScaleMode = (typeof SCALE_MODES)[number];

export interface SelectedScale {
  tonic: PitchClass;
  mode: ScaleMode;
}

const SCALE_INTERVALS: Record<ScaleMode, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

export const SCALE_MODE_LABELS: Record<ScaleMode, string> = {
  major: "Major",
  minor: "Minor",
};

export function getScalePitchClasses(scale: SelectedScale): PitchClass[] {
  const tonic = pitchClassToSemitone(scale.tonic);

  return SCALE_INTERVALS[scale.mode].map(
    (interval) => PITCH_CLASSES[(tonic + interval) % PITCH_CLASSES.length],
  );
}

export function isPitchInScale(
  pitchClass: PitchClass,
  scale: SelectedScale,
): boolean {
  return getScalePitchClasses(scale).includes(pitchClass);
}
