import { describe, expect, it } from "vitest";
import {
  buildKeyboardRange,
  DEFAULT_HIGH_MIDI,
  DEFAULT_LOW_MIDI,
  getWhiteKeyCount,
  midiToNoteName,
  noteNameToMidi,
} from "./notes";

describe("note mapping", () => {
  it("maps MIDI numbers using C4 as middle C", () => {
    expect(midiToNoteName(36)).toBe("C2");
    expect(midiToNoteName(60)).toBe("C4");
    expect(midiToNoteName(72)).toBe("C5");
  });

  it("round-trips note names used by the Launchkey range", () => {
    expect(noteNameToMidi("C2")).toBe(36);
    expect(noteNameToMidi("F#3")).toBe(54);
    expect(noteNameToMidi("C5")).toBe(72);
  });
});

describe("37-key keyboard range", () => {
  it("builds C2 through C5 inclusive", () => {
    const keys = buildKeyboardRange();

    expect(keys).toHaveLength(37);
    expect(keys[0]).toMatchObject({ midi: DEFAULT_LOW_MIDI, note: "C2" });
    expect(keys.at(-1)).toMatchObject({ midi: DEFAULT_HIGH_MIDI, note: "C5" });
  });

  it("has 22 white keys across three octaves plus top C", () => {
    expect(getWhiteKeyCount(buildKeyboardRange())).toBe(22);
  });
});
