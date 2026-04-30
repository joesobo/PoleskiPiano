import { describe, expect, it } from "vitest";
import { analyzeChord } from "./chords";

describe("chord analysis", () => {
  it("detects major triads from MIDI notes", () => {
    expect(analyzeChord([57, 61, 64])).toMatchObject({
      label: "Amaj",
      root: "A",
      notes: ["C#", "E", "A"],
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
    });
  });
});
