import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  getChordPreviewOptionClassName,
  getChordPreviewSelectedClassName,
  getPracticeSongOptionClassName,
  PENDING_PRACTICE_SONG_ID,
  PRACTICE_SONG_CONTROL_ICONS,
  TopBar,
} from "./TopBar";

const validSongOption = {
  status: "valid" as const,
  id: "songs/good.json",
  title: "Good Song",
  path: "songs/good.json",
  song: {
    id: "songs/good.json",
    title: "Good Song",
    scale: null,
    steps: [],
  },
};

describe("TopBar chord preview options", () => {
  it("colors chord preview options only when a scale is selected", () => {
    expect(getChordPreviewOptionClassName(true, false)).toBeUndefined();
    expect(getChordPreviewOptionClassName(true, true)).toBe(
      "is-in-scale-option",
    );
    expect(getChordPreviewOptionClassName(false, true)).toBe(
      "is-out-scale-option",
    );
  });
});

describe("TopBar chord preview selected value", () => {
  it("uses the chord preview color class for the selected value", () => {
    expect(getChordPreviewSelectedClassName()).toContain(
      "chord-preview-option-name",
    );
    expect(getChordPreviewSelectedClassName("is-in-scale-option")).toBe(
      "top-select-selected-name chord-preview-option-name is-in-scale-option",
    );
  });
});

describe("TopBar layout", () => {
  it("keeps Chord Preview visible when a Practice Song is selected", () => {
    const html = renderToStaticMarkup(
      createElement(TopBar, {
        midiStatus: { supported: true, permission: "granted", inputs: [] },
        audioLevel: 0,
        selectedScale: null,
        selectedChordPreview: null,
        practiceSongOptions: [validSongOption],
        selectedPracticeSongId: validSongOption.id,
        hasSelectedPracticeSong: true,
        hasPendingPracticeSong: false,
        pendingPracticeSongTitle: "",
        isPracticePlaying: false,
        isPracticeSongBuilderActive: false,
        practiceSongBuilderTitle: null,
        onScaleChange: () => undefined,
        onChordPreviewChange: () => undefined,
        onPracticeSongChange: () => undefined,
        onPendingPracticeSongTitleChange: () => undefined,
        onPendingPracticeSongSubmit: () => undefined,
        onPendingPracticeSongCancel: () => undefined,
        onPracticeSongBuilderTitleChange: () => undefined,
        onPracticeSongBuilderStart: () => undefined,
        onPracticeSongBuilderSave: () => undefined,
        onPracticeSongBuilderCancel: () => undefined,
        onPracticeBack: () => undefined,
        onPracticeNext: () => undefined,
        onPracticeRestart: () => undefined,
        onPracticePlayingChange: () => undefined,
      }),
    );

    expect(html).toContain("Chord Preview");
    expect(html).toContain("Song");
    expect(html).toContain("Good Song");
    expect(html).toContain("Previous Practice Step");
  });

  it("renders new song title entry in the temporary action row", () => {
    const html = renderToStaticMarkup(
      createElement(TopBar, {
        midiStatus: { supported: true, permission: "granted", inputs: [] },
        audioLevel: 0,
        selectedScale: null,
        selectedChordPreview: null,
        practiceSongOptions: [validSongOption],
        selectedPracticeSongId: PENDING_PRACTICE_SONG_ID,
        hasSelectedPracticeSong: false,
        hasPendingPracticeSong: true,
        pendingPracticeSongTitle: "",
        isPracticePlaying: false,
        isPracticeSongBuilderActive: false,
        practiceSongBuilderTitle: null,
        onScaleChange: () => undefined,
        onChordPreviewChange: () => undefined,
        onPracticeSongChange: () => undefined,
        onPendingPracticeSongTitleChange: () => undefined,
        onPendingPracticeSongSubmit: () => undefined,
        onPendingPracticeSongCancel: () => undefined,
        onPracticeSongBuilderTitleChange: () => undefined,
        onPracticeSongBuilderStart: () => undefined,
        onPracticeSongBuilderSave: () => undefined,
        onPracticeSongBuilderCancel: () => undefined,
        onPracticeBack: () => undefined,
        onPracticeNext: () => undefined,
        onPracticeRestart: () => undefined,
        onPracticePlayingChange: () => undefined,
      }),
    );

    expect(html).toContain("New Song");
    expect(html).toContain("Song title");
    expect(html).toContain("Create Practice Song");
  });
});

describe("TopBar practice song options", () => {
  it("marks invalid songs for disabled selector rendering", () => {
    expect(
      getPracticeSongOptionClassName({
        status: "invalid",
        id: "songs/bad.json",
        title: "Bad Song",
        path: "songs/bad.json",
        error: "Invalid Practice Song scale",
      }),
    ).toBe("is-invalid-song-option");

    expect(
      getPracticeSongOptionClassName({
        ...validSongOption,
      }),
    ).toBeUndefined();
  });
});

describe("TopBar practice song controls", () => {
  it("uses adjacent-step arrows instead of jump-to-start or jump-to-end icons", () => {
    expect(PRACTICE_SONG_CONTROL_ICONS.previousStep).toBe("←");
    expect(PRACTICE_SONG_CONTROL_ICONS.nextStep).toBe("→");
    expect(PRACTICE_SONG_CONTROL_ICONS.previousStep).not.toBe("⏮");
    expect(PRACTICE_SONG_CONTROL_ICONS.nextStep).not.toBe("⏭");
  });
});
