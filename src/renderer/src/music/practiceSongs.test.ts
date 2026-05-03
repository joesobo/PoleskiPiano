import { describe, expect, it } from "vitest";
import {
  activeMidiNotesMatchPracticeStep,
  createPracticeSongOptions,
  parseOptionalPracticeScale,
  parsePracticeSong,
  parsePracticeStep,
  normalizePracticeSongPath,
} from "./practiceSongs";

describe("Practice Step parsing", () => {
  it("parses exact notes, default-octave pitch classes, chords, and mixed sets", () => {
    expect(parsePracticeStep("c3").midiNotes).toEqual([48]);
    expect(parsePracticeStep("f#").midiNotes).toEqual([54]);

    const mixedStep = parsePracticeStep("G2 + DMajor");

    expect(mixedStep.label).toBe("G2 + D major");
    expect(mixedStep.midiNotes).toEqual([43, 50, 54, 57]);
    expect(mixedStep.notes.map((note) => note.label)).toEqual([
      "G2",
      "D3",
      "F#3",
      "A3",
    ]);
  });

  it("is case-insensitive and keeps duplicate notes unique", () => {
    expect(parsePracticeStep("g2 + d major").midiNotes).toEqual([
      43, 50, 54, 57,
    ]);
    expect(parsePracticeStep("C3 + CMajor").midiNotes).toEqual([48, 52, 55]);
  });

  it("rejects unsupported or out-of-range notes", () => {
    expect(() => parsePracticeStep("Bb2")).toThrow(
      "Flat notes are not supported yet",
    );
    expect(() => parsePracticeStep("H3")).toThrow(
      "Invalid Practice Step token",
    );
    expect(() => parsePracticeStep("C6")).toThrow("outside the C2-C5 range");
  });
});

describe("Practice Song parsing", () => {
  it("normalizes Vite raw-import paths into root song paths", () => {
    expect(normalizePracticeSongPath("../../../../songs/my-song.json")).toBe(
      "songs/my-song.json",
    );
  });

  it("parses optional scale metadata as an initial scale hint", () => {
    expect(parseOptionalPracticeScale("D major")).toEqual({
      tonic: "D",
      mode: "major",
    });

    const song = parsePracticeSong(
      {
        title: "Wet Hands Sketch",
        scale: "D major",
        steps: ["GMajor", "F#2"],
      },
      "wet-hands-sketch",
      "Wet Hands Sketch",
    );

    expect(song.scale).toEqual({ tonic: "D", mode: "major" });
    expect(song.steps).toHaveLength(2);
  });

  it("rejects invalid scale metadata", () => {
    expect(() => parseOptionalPracticeScale("D dorian")).toThrow(
      "Invalid Practice Song scale",
    );
  });

  it("builds disabled selector options for invalid song files", () => {
    const options = createPracticeSongOptions({
      "songs/bad-scale.json": JSON.stringify({
        title: "Bad Scale",
        scale: "H major",
        steps: ["C3"],
      }),
      "songs/bad-json.json": "{",
      "songs/valid.json": JSON.stringify({
        title: "Valid Song",
        steps: ["C3"],
      }),
    });

    expect(options).toHaveLength(3);
    expect(options.find((option) => option.title === "Valid Song")?.status).toBe(
      "valid",
    );

    const badScale = options.find((option) => option.title === "Bad Scale");
    expect(badScale?.status).toBe("invalid");
    expect(badScale?.status === "invalid" ? badScale.error : "").toContain(
      "Invalid Practice Song scale",
    );

    const badJson = options.find((option) => option.title === "Bad Json");
    expect(badJson?.status).toBe("invalid");
  });
});

describe("Practice Step matching", () => {
  it("matches exact active MIDI note sets without caring about order", () => {
    const step = parsePracticeStep("G2 + DMajor");

    expect(activeMidiNotesMatchPracticeStep([57, 54, 50, 43], step)).toBe(true);
    expect(activeMidiNotesMatchPracticeStep([43, 50, 54], step)).toBe(false);
    expect(activeMidiNotesMatchPracticeStep([43, 50, 54, 57, 60], step)).toBe(
      false,
    );
  });
});
