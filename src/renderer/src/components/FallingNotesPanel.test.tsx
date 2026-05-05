import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getInitialFallingPlayheadBeat, getSongLeadInBeats } from "../music/fallingNotes";
import { buildKeyboardRange } from "../music/notes";
import {
  createPracticeSongMusicXml,
  parsePracticeSong,
  type PracticeSong,
  type PracticeTarget,
} from "../music/practiceSongs";
import { FallingNotesPanel } from "./FallingNotesPanel";

describe("FallingNotesPanel feedback", () => {
  it("renders a subtle correct-hit feedback effect at the played key lane", () => {
    const html = renderToStaticMarkup(
      createElement(FallingNotesPanel, {
        song: null,
        previewTarget: null,
        keys: buildKeyboardRange(),
        playheadBeat: 0,
        leadInBeats: 4,
        waitingTargetId: null,
        feedbackEvents: [
          {
            id: "hit-1",
            midi: 48,
            label: "C",
            pitchClass: "C",
          },
        ],
      }),
    );

    expect(html).toContain("falling-note-feedback");
    expect(html).toContain("falling-note-feedback-ring");
    expect(html).toContain("C");
  });

  it("keeps the selected song title out of the visual lane", () => {
    const song: PracticeSong = {
      id: "songs/hidden-title.musicxml",
      title: "Hidden Song Title",
      scale: null,
      tempoBpm: 72,
      timeSignature: "4/4",
      notes: [],
      targets: [],
      measures: [{ number: "1", startBeat: 0, durationBeats: 4 }],
    };
    const html = renderToStaticMarkup(
      createElement(FallingNotesPanel, {
        song,
        previewTarget: null,
        keys: buildKeyboardRange(),
        playheadBeat: 0,
        leadInBeats: 4,
        waitingTargetId: null,
        feedbackEvents: [],
      }),
    );

    expect(html).not.toContain("Hidden Song Title");
  });

  it("shows the first held chord target at the top of the lane on play start", () => {
    const rawSong = readFileSync(
      join(process.cwd(), "songs/practice-c-chord-changes.musicxml"),
      "utf8",
    );
    const song = parsePracticeSong(
      rawSong,
      "songs/practice-c-chord-changes.musicxml",
      "Practice: C Chord Changes",
    );
    const html = renderToStaticMarkup(
      createElement(FallingNotesPanel, {
        song,
        previewTarget: null,
        keys: buildKeyboardRange(),
        playheadBeat: getInitialFallingPlayheadBeat(song),
        leadInBeats: getSongLeadInBeats(song),
        waitingTargetId: null,
        feedbackEvents: [],
      }),
    );

    expect(html).toContain("inset-block-start:0%");
    expect(html).toContain("falling-chord-block");
    expect(html).toContain("falling-chord-block-name");
    expect(html).toContain("Cmaj");
  });

  it("renders a chord as a wide block and layers an extra simultaneous note above it", () => {
    const song = parsePracticeSong(
      createPracticeSongMusicXml({
        title: "Chord With Extra Note",
        scale: null,
        targets: [
          {
            notes: [{ midi: 48 }, { midi: 50 }, { midi: 52 }, { midi: 55 }],
          },
        ],
      }),
      "songs/chord-with-extra-note.musicxml",
      "Chord With Extra Note",
    );
    const html = renderToStaticMarkup(
      createElement(FallingNotesPanel, {
        song,
        previewTarget: null,
        keys: buildKeyboardRange(),
        playheadBeat: getInitialFallingPlayheadBeat(song),
        leadInBeats: getSongLeadInBeats(song),
        waitingTargetId: null,
        feedbackEvents: [],
      }),
    );

    expect(html).toContain("Cmaj");
    expect(html.match(/class="falling-chord-block(?:\s|")/g) ?? []).toHaveLength(1);
    expect(html.match(/class="falling-chord-tone-label"/g) ?? []).toHaveLength(3);
    expect(html).toContain("falling-note-block");
    expect(html).toContain("D3");
  });

  it("shows Chord Preview as a frozen ghost chord block", () => {
    const previewTarget: PracticeTarget = {
      id: "preview-cmaj",
      label: "C3 + E3 + G3",
      chordName: "Cmaj",
      chordGroups: [
        {
          name: "Cmaj",
          root: "C",
          midiNotes: [48, 52, 55],
          notes: [
            { midi: 48, label: "C3", pitchClass: "C" },
            { midi: 52, label: "E3", pitchClass: "E" },
            { midi: 55, label: "G3", pitchClass: "G" },
          ],
        },
      ],
      startBeat: 0,
      durationBeats: 1,
      measureNumber: "preview",
      midiNotes: [48, 52, 55],
      notes: [
        { midi: 48, label: "C3", pitchClass: "C" },
        { midi: 52, label: "E3", pitchClass: "E" },
        { midi: 55, label: "G3", pitchClass: "G" },
      ],
    };
    const html = renderToStaticMarkup(
      createElement(FallingNotesPanel, {
        song: null,
        previewTarget,
        keys: buildKeyboardRange(),
        playheadBeat: 0,
        leadInBeats: 4,
        waitingTargetId: null,
        feedbackEvents: [],
      }),
    );

    expect(html).toContain("falling-chord-block is-preview");
    expect(html).toContain("Cmaj");
    expect(html).toContain("C3");
    expect(html).toContain("E3");
    expect(html).toContain("G3");
  });
});
