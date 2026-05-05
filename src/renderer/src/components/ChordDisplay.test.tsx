import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ChordDisplay } from "./ChordDisplay";

describe("ChordDisplay practice preview", () => {
  it("shows the current practice chord name above its note pills", () => {
    const html = renderToStaticMarkup(
      createElement(ChordDisplay, {
        analysis: {
          label: "No notes",
          notes: [],
          isNamedChord: false,
        },
        preview: {
          kind: "practice",
          kicker: "Practice",
          name: "Practice: C Chord Changes",
          targetName: "Cmaj",
          targetCount: "1/8",
          notes: [
            { label: "C3", pitchClass: "C" },
            { label: "E3", pitchClass: "E" },
            { label: "G3", pitchClass: "G" },
          ],
        },
      }),
    );

    expect(html).toContain("practice-preview-target-name");
    expect(html).toContain("Cmaj");
    expect(html).toContain("C3");
    expect(html).toContain("E3");
    expect(html).toContain("G3");
  });

  it("distinguishes chord tones from extra notes in the practice preview", () => {
    const html = renderToStaticMarkup(
      createElement(ChordDisplay, {
        analysis: {
          label: "No notes",
          notes: [],
          isNamedChord: false,
        },
        preview: {
          kind: "practice",
          kicker: "Practice",
          name: "Chord With Extra Note",
          targetName: "Cmaj",
          targetCount: "1/1",
          notes: [
            { label: "C3", pitchClass: "C", isChordTone: true },
            { label: "D3", pitchClass: "D", isChordTone: false },
            { label: "E3", pitchClass: "E", isChordTone: true },
            { label: "G3", pitchClass: "G", isChordTone: true },
          ],
        },
      }),
    );

    expect(html.match(/is-chord-tone/g) ?? []).toHaveLength(3);
    expect(html).toContain("D3");
  });
});
