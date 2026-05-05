import { describe, expect, it } from "vitest";
import {
  activeMidiNotesContainPracticeTarget,
  activeMidiNotesMatchGuidedTargetAtHitLine,
  activeMidiNotesMatchGuidedTargetInput,
  clampPracticeSpeedPercent,
  getGuidedCompletionResult,
  getGuidedInputTargetIndex,
  getGuidedPracticeEarlyWindowBeats,
  getInitialFallingPlayheadBeat,
  getPerformanceScore,
  getSongEndBeat,
  isPracticeTargetActiveAtBeat,
  markMissedPerformanceTargets,
  scorePerformanceInput,
} from "./fallingNotes";
import type { ActiveNote } from "./activeNotes";
import type { PracticeSong, PracticeTarget } from "./practiceSongs";
import { PRACTICE_TIMING_WINDOWS_MS } from "./practiceTiming";

const cTarget = createTarget("target-1", 0, 1, [48]);
const chordTarget = createTarget("target-2", 2, 0.5, [48, 52, 55]);
const song: PracticeSong = {
  id: "songs/test.musicxml",
  title: "Test Song",
  scale: null,
  tempoBpm: 72,
  timeSignature: "4/4",
  notes: [],
  targets: [cTarget, chordTarget],
  measures: [{ number: "1", startBeat: 0, durationBeats: 4 }],
};

describe("falling note playback timing", () => {
  it("starts with the first target entering from the top of the lane", () => {
    expect(getInitialFallingPlayheadBeat(song)).toBe(-3);
  });

  it("uses note duration as the active hit window", () => {
    expect(isPracticeTargetActiveAtBeat(cTarget, -0.01)).toBe(false);
    expect(isPracticeTargetActiveAtBeat(cTarget, 0)).toBe(true);
    expect(isPracticeTargetActiveAtBeat(cTarget, 1)).toBe(true);
    expect(isPracticeTargetActiveAtBeat(cTarget, 1.01)).toBe(false);
  });

  it("finds the song end from measures, notes, and targets", () => {
    expect(getSongEndBeat(song)).toBe(4);
  });

  it("allows guided input slightly before a target reaches the hit line", () => {
    const earlyWindowBeats = getGuidedPracticeEarlyWindowBeats(song.tempoBpm);

    expect(
      getGuidedInputTargetIndex(
        song,
        1,
        chordTarget.startBeat - earlyWindowBeats / 2,
        null,
        new Set(),
      ),
    ).toBe(1);
  });

  it("limits early hits to a short 100ms to 250ms learner window", () => {
    expect(PRACTICE_TIMING_WINDOWS_MS.earlyHit).toBeGreaterThanOrEqual(100);
    expect(PRACTICE_TIMING_WINDOWS_MS.earlyHit).toBeLessThanOrEqual(250);
    expect(getGuidedPracticeEarlyWindowBeats(60)).toBeCloseTo(0.15);
  });

  it("does not allow guided input before the early window opens", () => {
    const earlyWindowBeats = getGuidedPracticeEarlyWindowBeats(song.tempoBpm);

    expect(
      getGuidedInputTargetIndex(
        song,
        1,
        chordTarget.startBeat - earlyWindowBeats - 0.01,
        null,
        new Set(),
      ),
    ).toBeNull();
  });

  it("matches guided targets from new presses without treating older held notes as wrong extras", () => {
    expect(
      activeMidiNotesMatchGuidedTargetInput(
        new Map([
          [48, activeNote(48, 1000)],
          [62, activeNote(62, 1200)],
        ]),
        [activeNote(62, 1200)],
        createTarget("target-d4", 1, 1, [62]),
      ),
    ).toBe(true);
  });

  it("blocks guided completion when a wrong extra note is part of the same new input", () => {
    expect(
      activeMidiNotesMatchGuidedTargetInput(
        new Map([
          [48, activeNote(48, 1200)],
          [62, activeNote(62, 1200)],
        ]),
        [activeNote(48, 1200), activeNote(62, 1200)],
        createTarget("target-d4", 1, 1, [62]),
      ),
    ).toBe(false);
  });

  it("does not let a target note held too early coast into guided completion at the hit line", () => {
    expect(
      activeMidiNotesMatchGuidedTargetAtHitLine(
        new Map([[62, activeNote(62, 1000)]]),
        createTarget("target-d4", 1, 1, [62]),
        2000,
      ),
    ).toBe(false);
  });

  it("matches recent target notes at the hit line while ignoring older held notes from previous targets", () => {
    expect(
      activeMidiNotesMatchGuidedTargetAtHitLine(
        new Map([
          [48, activeNote(48, 1000)],
          [62, activeNote(62, 1900)],
        ]),
        createTarget("target-d4", 1, 1, [62]),
        2000,
      ),
    ).toBe(true);
  });

  it("keeps completed guided targets from pausing again", () => {
    expect(
      getGuidedInputTargetIndex(song, 1, chordTarget.startBeat, null, new Set([
        chordTarget.id,
      ])),
    ).toBeNull();
  });

  it("can resolve the final guided target at the hit line before waiting state renders", () => {
    expect(
      getGuidedInputTargetIndex(
        song,
        1,
        chordTarget.startBeat,
        null,
        new Set(),
      ),
    ).toBe(1);
  });

  it("completes and resets guided practice after the final target", () => {
    expect(getGuidedCompletionResult(song, 1)).toEqual({
      kind: "finish",
      nextTargetIndex: 1,
      nextPlayheadBeat: null,
    });
  });

  it("clamps speed percentage to the learner control range", () => {
    expect(clampPracticeSpeedPercent(10)).toBe(25);
    expect(clampPracticeSpeedPercent(75)).toBe(75);
    expect(clampPracticeSpeedPercent(250)).toBe(200);
  });
});

describe("falling note scoring", () => {
  it("scores a target when every required MIDI note is active during its window", () => {
    expect(
      scorePerformanceInput(song, 2.25, [48, 52, 55], {}),
    ).toEqual({
      "target-2": "hit",
    });
  });

  it("scores a target when every required MIDI note is active slightly early", () => {
    const earlyWindowBeats = getGuidedPracticeEarlyWindowBeats(song.tempoBpm);

    expect(
      scorePerformanceInput(
        song,
        chordTarget.startBeat - earlyWindowBeats / 2,
        [48, 52, 55],
        {},
      ),
    ).toEqual({
      "target-2": "hit",
    });
  });

  it("does not give partial chord credit", () => {
    expect(scorePerformanceInput(song, 2.25, [48, 52], {})).toEqual({});
  });

  it("allows wrong extra notes without blocking performance hits", () => {
    expect(activeMidiNotesContainPracticeTarget([48, 52, 55, 59], chordTarget)).toBe(
      true,
    );
  });

  it("marks unhit targets missed after their active window passes", () => {
    expect(markMissedPerformanceTargets(song, 1.25, {})).toEqual({
      "target-1": "miss",
    });
  });

  it("summarizes score as hits over total with a percentage", () => {
    expect(
      getPerformanceScore(
        {
          "target-1": "hit",
          "target-2": "miss",
        },
        2,
      ),
    ).toEqual({ hits: 1, total: 2, percent: 50 });
  });
});

function createTarget(
  id: string,
  startBeat: number,
  durationBeats: number,
  midiNotes: number[],
): PracticeTarget {
  return {
    id,
    label: midiNotes.join(" + "),
    chordName: null,
    chordGroups: [],
    startBeat,
    durationBeats,
    measureNumber: "1",
    midiNotes,
    notes: midiNotes.map((midi) => ({
      midi,
      label: String(midi),
      pitchClass: "C",
    })),
  };
}

function activeNote(midi: number, receivedAt: number): ActiveNote {
  return {
    midi,
    note: String(midi),
    pitchClass: "C",
    velocity: 0.8,
    receivedAt,
  };
}
