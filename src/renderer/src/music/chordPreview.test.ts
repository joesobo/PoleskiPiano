import { describe, expect, it } from "vitest";
import {
  buildChordPreview,
  type ChordPreviewQuality,
  getChordPreviewByValue,
  getChordPreviewOptions,
  isChordPreviewInScale,
} from "./chordPreview";
import { midiToNoteName, type PitchClass } from "./notes";

const EXPECTED_PREVIEW_NOTE_NAMES: Array<{
  root: PitchClass;
  quality: ChordPreviewQuality;
  noteNames: string[];
}> = [
  { root: "C", quality: "major", noteNames: ["C3", "E3", "G3"] },
  { root: "C", quality: "minor", noteNames: ["C3", "D#3", "G3"] },
  { root: "C#", quality: "major", noteNames: ["C#3", "F3", "G#3"] },
  { root: "C#", quality: "minor", noteNames: ["C#3", "E3", "G#3"] },
  { root: "D", quality: "major", noteNames: ["D3", "F#3", "A3"] },
  { root: "D", quality: "minor", noteNames: ["D3", "F3", "A3"] },
  { root: "D#", quality: "major", noteNames: ["D#3", "G3", "A#3"] },
  { root: "D#", quality: "minor", noteNames: ["D#3", "F#3", "A#3"] },
  { root: "E", quality: "major", noteNames: ["E3", "G#3", "B3"] },
  { root: "E", quality: "minor", noteNames: ["E3", "G3", "B3"] },
  { root: "F", quality: "major", noteNames: ["F3", "A3", "C4"] },
  { root: "F", quality: "minor", noteNames: ["F3", "G#3", "C4"] },
  { root: "F#", quality: "major", noteNames: ["F#3", "A#3", "C#4"] },
  { root: "F#", quality: "minor", noteNames: ["F#3", "A3", "C#4"] },
  { root: "G", quality: "major", noteNames: ["G3", "B3", "D4"] },
  { root: "G", quality: "minor", noteNames: ["G3", "A#3", "D4"] },
  { root: "G#", quality: "major", noteNames: ["G#3", "C4", "D#4"] },
  { root: "G#", quality: "minor", noteNames: ["G#3", "B3", "D#4"] },
  { root: "A", quality: "major", noteNames: ["A3", "C#4", "E4"] },
  { root: "A", quality: "minor", noteNames: ["A3", "C4", "E4"] },
  { root: "A#", quality: "major", noteNames: ["A#3", "D4", "F4"] },
  { root: "A#", quality: "minor", noteNames: ["A#3", "C#4", "F4"] },
  { root: "B", quality: "major", noteNames: ["B3", "D#4", "F#4"] },
  { root: "B", quality: "minor", noteNames: ["B3", "D4", "F#4"] },
];

describe("chord preview", () => {
  it("builds major and minor triad options for all roots", () => {
    expect(getChordPreviewOptions(null)).toHaveLength(24);
  });

  it("uses third-octave root shapes for preview chords", () => {
    for (const { root, quality, noteNames } of EXPECTED_PREVIEW_NOTE_NAMES) {
      expect(
        buildChordPreview(root, quality).midiNotes.map(midiToNoteName),
        `${root} ${quality}`,
      ).toEqual(noteNames);
    }
  });

  it("finds a preview chord from a select value", () => {
    expect(getChordPreviewByValue("A:minor")).toMatchObject({
      label: "Am",
      midiNotes: [57, 60, 64],
    });
    expect(getChordPreviewByValue("none")).toBeNull();
  });

  it("marks preview chords as inside a scale only when every note belongs", () => {
    const cMajor = { tonic: "C", mode: "major" } as const;

    expect(isChordPreviewInScale(buildChordPreview("F", "major"), cMajor)).toBe(
      true,
    );
    expect(isChordPreviewInScale(buildChordPreview("F", "minor"), cMajor)).toBe(
      false,
    );
  });
});
