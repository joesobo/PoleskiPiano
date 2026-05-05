import type { PracticeSong, PracticeTarget } from "./practiceSongs";
import { PRACTICE_TIMING_WINDOWS_MS } from "./practiceTiming";

export type PracticeRunMode = "guided" | "performance";
export type PracticeTargetResult = "hit" | "miss";
export type PracticeTargetResults = Record<string, PracticeTargetResult>;
export const PRACTICE_SPEED_MIN_PERCENT = 25;
export const PRACTICE_SPEED_MAX_PERCENT = 200;
export const PRACTICE_SPEED_STEP_PERCENT = 10;
export const PRACTICE_SPEED_DEFAULT_PERCENT = 100;

export interface PerformanceScore {
  hits: number;
  total: number;
  percent: number;
}

export interface TimedActiveMidiNote {
  midi: number;
  receivedAt: number;
}

export type GuidedCompletionResult =
  | {
      kind: "advance";
      nextTargetIndex: number;
      nextPlayheadBeat: null;
    }
  | {
      kind: "finish";
      nextTargetIndex: number;
      nextPlayheadBeat: null;
    };

export function getSongLeadInBeats(song: PracticeSong | null): number {
  return Math.max(1, song?.measures[0]?.durationBeats ?? 4);
}

export function getInitialFallingPlayheadBeat(song: PracticeSong | null): number {
  const leadInBeats = getSongLeadInBeats(song);
  const firstTargetLeadInOffset = Math.min(
    song?.targets[0]?.durationBeats ?? 0,
    leadInBeats * 0.5,
  );

  return -leadInBeats + firstTargetLeadInOffset;
}

export function getGuidedPracticeEarlyWindowBeats(tempoBpm: number): number {
  return (PRACTICE_TIMING_WINDOWS_MS.earlyHit / 1000) * (tempoBpm / 60);
}

export function getGuidedInputTargetIndex(
  song: PracticeSong,
  targetIndex: number,
  playheadBeat: number,
  waitingTargetIndex: number | null,
  completedTargetIds: ReadonlySet<string>,
): number | null {
  if (waitingTargetIndex !== null) {
    const waitingTarget = song.targets[waitingTargetIndex];

    return waitingTarget && !completedTargetIds.has(waitingTarget.id)
      ? waitingTargetIndex
      : null;
  }

  const target = song.targets[targetIndex];

  if (!target || completedTargetIds.has(target.id)) {
    return null;
  }

  const earlyWindowBeats = getGuidedPracticeEarlyWindowBeats(song.tempoBpm);

  return playheadBeat >= target.startBeat - earlyWindowBeats
    ? targetIndex
    : null;
}

export function getGuidedCompletionResult(
  song: PracticeSong,
  targetIndex: number,
): GuidedCompletionResult {
  if (targetIndex >= song.targets.length - 1) {
    return {
      kind: "finish",
      nextTargetIndex: Math.max(0, song.targets.length - 1),
      nextPlayheadBeat: null,
    };
  }

  return {
    kind: "advance",
    nextTargetIndex: targetIndex + 1,
    nextPlayheadBeat: null,
  };
}

export function getSongEndBeat(song: PracticeSong): number {
  return Math.max(
    0,
    ...song.measures.map(
      (measure) => measure.startBeat + measure.durationBeats,
    ),
    ...song.notes.map((note) => note.startBeat + note.durationBeats),
    ...song.targets.map((target) => getPracticeTargetEndBeat(target)),
  );
}

export function clampPracticeSpeedPercent(speedPercent: number): number {
  return Math.min(
    PRACTICE_SPEED_MAX_PERCENT,
    Math.max(PRACTICE_SPEED_MIN_PERCENT, speedPercent),
  );
}

export function getPracticeTargetEndBeat(target: PracticeTarget): number {
  return target.startBeat + Math.max(0.25, target.durationBeats);
}

export function isPracticeTargetActiveAtBeat(
  target: PracticeTarget,
  playheadBeat: number,
): boolean {
  return (
    playheadBeat >= target.startBeat &&
    playheadBeat <= getPracticeTargetEndBeat(target)
  );
}

export function isPracticeTargetHittableAtBeat(
  target: PracticeTarget,
  playheadBeat: number,
  tempoBpm: number,
): boolean {
  const earlyWindowBeats = getGuidedPracticeEarlyWindowBeats(tempoBpm);

  return (
    playheadBeat >= target.startBeat - earlyWindowBeats &&
    playheadBeat <= getPracticeTargetEndBeat(target)
  );
}

export function activeMidiNotesContainPracticeTarget(
  activeMidiNotes: Iterable<number>,
  target: PracticeTarget,
): boolean {
  const active = new Set(activeMidiNotes);

  return target.midiNotes.every((midi) => active.has(midi));
}

export function activeMidiNotesMatchGuidedTargetInput(
  activeMidiNotes: ReadonlyMap<number, TimedActiveMidiNote>,
  noteOns: readonly TimedActiveMidiNote[],
  target: PracticeTarget,
): boolean {
  if (noteOns.length === 0 || !activeMidiNotesContainPracticeTarget(activeMidiNotes.keys(), target)) {
    return false;
  }

  const targetMidiNotes = new Set(target.midiNotes);

  return noteOns.every((note) => targetMidiNotes.has(note.midi));
}

export function activeMidiNotesMatchGuidedTargetAtHitLine(
  activeMidiNotes: ReadonlyMap<number, TimedActiveMidiNote>,
  target: PracticeTarget,
  nowMs: number,
): boolean {
  if (!activeMidiNotesContainPracticeTarget(activeMidiNotes.keys(), target)) {
    return false;
  }

  const earliestAllowedMs = nowMs - PRACTICE_TIMING_WINDOWS_MS.earlyHit;
  const targetMidiNotes = new Set(target.midiNotes);

  for (const note of activeMidiNotes.values()) {
    const isRecent = note.receivedAt >= earliestAllowedMs;

    if (targetMidiNotes.has(note.midi)) {
      if (!isRecent) {
        return false;
      }

      continue;
    }

    if (isRecent) {
      return false;
    }
  }

  return true;
}

export function scorePerformanceInput(
  song: PracticeSong,
  playheadBeat: number,
  activeMidiNotes: Iterable<number>,
  previousResults: PracticeTargetResults,
): PracticeTargetResults {
  const nextResults = { ...previousResults };

  for (const target of song.targets) {
    if (
      nextResults[target.id] ||
      !isPracticeTargetHittableAtBeat(target, playheadBeat, song.tempoBpm)
    ) {
      continue;
    }

    if (activeMidiNotesContainPracticeTarget(activeMidiNotes, target)) {
      nextResults[target.id] = "hit";
    }
  }

  return nextResults;
}

export function markMissedPerformanceTargets(
  song: PracticeSong,
  playheadBeat: number,
  previousResults: PracticeTargetResults,
): PracticeTargetResults {
  let nextResults: PracticeTargetResults | null = null;

  for (const target of song.targets) {
    if (
      previousResults[target.id] ||
      playheadBeat <= getPracticeTargetEndBeat(target)
    ) {
      continue;
    }

    nextResults ??= { ...previousResults };
    nextResults[target.id] = "miss";
  }

  return nextResults ?? previousResults;
}

export function getPerformanceScore(
  results: PracticeTargetResults,
  total: number,
): PerformanceScore {
  const hits = Object.values(results).filter((result) => result === "hit").length;

  return {
    hits,
    total,
    percent: total > 0 ? Math.round((hits / total) * 100) : 0,
  };
}

export function getTargetIndexForPlayhead(
  song: PracticeSong,
  playheadBeat: number,
): number {
  const activeTargetIndex = song.targets.findIndex((target) =>
    isPracticeTargetActiveAtBeat(target, playheadBeat),
  );

  if (activeTargetIndex >= 0) {
    return activeTargetIndex;
  }

  const nextTargetIndex = song.targets.findIndex(
    (target) => target.startBeat > playheadBeat,
  );

  return nextTargetIndex >= 0
    ? nextTargetIndex
    : Math.max(0, song.targets.length - 1);
}
