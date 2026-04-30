import { describe, expect, it } from "vitest";
import { analyzeChord } from "./chords";

describe("chord analysis", () => {
  it("detects major triads from MIDI notes", () => {
    expect(analyzeChord([57, 61, 64])).toMatchObject({
      label: "Amaj",
      root: "A",
      notes: ["A", "C#", "E"],
      isNamedChord: true,
    });
  });

  it("detects minor triads from MIDI notes", () => {
    expect(analyzeChord([60, 63, 67])).toMatchObject({
      label: "Cm",
      root: "C",
      notes: ["C", "D#", "G"],
    });
  });

  it("keeps an explicit note list when no named chord matches", () => {
    expect(analyzeChord([60, 62])).toMatchObject({
      label: "C + D",
      notes: ["C", "D"],
      isNamedChord: false,
    });
  });

  it("keeps pressed order for note sets that are not named chords", () => {
    expect(analyzeChord([71, 60])).toMatchObject({
      label: "B + C",
      notes: ["B", "C"],
      isNamedChord: false,
    });
    expect(analyzeChord([60, 71])).toMatchObject({
      label: "C + B",
      notes: ["C", "B"],
      isNamedChord: false,
    });
  });
});
