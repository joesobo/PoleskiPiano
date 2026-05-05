import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  getChordPreviewOptionClassName,
  getChordPreviewSelectedClassName,
  getNextThemeMode,
  getPracticeSongOptionClassName,
  PENDING_PRACTICE_SONG_ID,
  PRACTICE_SONG_CONTROL_ICONS,
  THEME_MODE_ICONS,
  TopBar,
} from "./TopBar";

const validSongOption = {
  status: "valid" as const,
  id: "songs/good.musicxml",
  title: "Good Song",
  path: "songs/good.musicxml",
  song: {
    id: "songs/good.musicxml",
    title: "Good Song",
    scale: null,
    tempoBpm: 72,
    timeSignature: "4/4",
    notes: [],
    targets: [],
    measures: [],
  },
};

type TopBarPropsForTest = Parameters<typeof TopBar>[0];

function topBarProps(
  overrides: Partial<TopBarPropsForTest> = {},
): TopBarPropsForTest {
  return {
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
    practiceRunMode: "guided" as const,
    practiceTempoBpm: validSongOption.song.tempoBpm,
    practiceSpeedPercent: 100,
    practiceSpeedStepPercent: 10,
    performanceScore: { hits: 0, total: 0, percent: 0 },
    isPracticeSongBuilderActive: false,
    practiceSongBuilderTitle: null,
    themeMode: "dark" as const,
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
    onPracticeRunModeChange: () => undefined,
    onPracticeSpeedPercentChange: () => undefined,
    onPracticePlayingChange: () => undefined,
    onThemeModeChange: () => undefined,
    ...overrides,
  };
}

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
  it("renders the theme toggle in the top signal cluster", () => {
    const html = renderToStaticMarkup(
      createElement(TopBar, topBarProps()),
    );

    expect(html).toContain("theme-toggle-button");
    expect(html).toContain("Use Light Appearance");
    expect(html).toContain(THEME_MODE_ICONS.light);
  });

  it("keeps Chord Preview visible when a Practice Song is selected", () => {
    const html = renderToStaticMarkup(
      createElement(TopBar, topBarProps()),
    );

    expect(html).toContain("Chord Preview");
    expect(html).toContain("Song");
    expect(html).toContain("Good Song");
    expect(html).toContain("Previous Practice Target");
    expect(html).toContain("Guided Practice");
    expect(html).toContain("72 BPM");
    expect(html).toContain("100%");
  });

  it("renders new song title entry in the temporary action row", () => {
    const html = renderToStaticMarkup(
      createElement(TopBar, topBarProps({
        selectedPracticeSongId: PENDING_PRACTICE_SONG_ID,
        hasSelectedPracticeSong: false,
        hasPendingPracticeSong: true,
      })),
    );

    expect(html).toContain("New Song");
    expect(html).toContain("Song title");
    expect(html).toContain("Create Practice Song");
  });

  it("shows score only in Performance Practice", () => {
    const html = renderToStaticMarkup(
      createElement(TopBar, topBarProps({
        practiceRunMode: "performance",
        performanceScore: { hits: 18, total: 24, percent: 75 },
      })),
    );

    expect(html).toContain("Performance Practice");
    expect(html).toContain("18/24");
    expect(html).toContain("75%");
  });
});

describe("TopBar theme modes", () => {
  it("flips directly between dark and light appearances", () => {
    expect(getNextThemeMode("dark")).toBe("light");
    expect(getNextThemeMode("light")).toBe("dark");
  });
});

describe("TopBar practice song options", () => {
  it("marks invalid songs for disabled selector rendering", () => {
    expect(
      getPracticeSongOptionClassName({
        status: "invalid",
        id: "songs/bad.musicxml",
        title: "Bad Song",
        path: "songs/bad.musicxml",
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
