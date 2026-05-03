import {
  DEFAULT_HIGH_MIDI,
  DEFAULT_LOW_MIDI,
  midiToNoteName,
  midiToPitchClass,
} from "./notes";
import type { PracticeSong, PracticeStepNote } from "./practiceSongs";
import type { SelectedScale } from "./scales";

export type PracticeSongDraftSource = "new" | "existing";

export interface PracticeSongDraft {
  source: PracticeSongDraftSource;
  path: string | null;
  originalTitle: string;
  title: string;
  steps: number[][];
  stepIndex: number;
  isDirty: boolean;
  error: string | null;
}

export interface PracticeSongDraftSaveRequest {
  path: string;
  overwrite: boolean;
  stepIndex: number;
  song: {
    title: string;
    scale?: string;
    steps: string[];
  };
}

export type PracticeSongDraftSaveResult =
  | { ok: true; request: PracticeSongDraftSaveRequest }
  | { ok: false; error: string };

export function createNewPracticeSongDraft(title: string): PracticeSongDraft {
  const trimmedTitle = title.trim();

  return {
    source: "new",
    path: null,
    originalTitle: trimmedTitle,
    title: trimmedTitle,
    steps: [[]],
    stepIndex: 0,
    isDirty: false,
    error: null,
  };
}

export function createPracticeSongDraftFromSong(
  song: PracticeSong,
  stepIndex: number,
): PracticeSongDraft {
  return {
    source: "existing",
    path: song.id,
    originalTitle: song.title,
    title: song.title,
    steps: song.steps.map((step) => normalizeStepMidiNotes(step.midiNotes)),
    stepIndex: clampStepIndex(stepIndex, song.steps.length),
    isDirty: false,
    error: null,
  };
}

export function setPracticeSongDraftTitle(
  draft: PracticeSongDraft,
  title: string,
): PracticeSongDraft {
  return {
    ...draft,
    title,
    isDirty: draft.isDirty || title !== draft.title,
    error: null,
  };
}

export function togglePracticeSongDraftMidi(
  draft: PracticeSongDraft,
  midi: number,
): PracticeSongDraft {
  if (midi < DEFAULT_LOW_MIDI || midi > DEFAULT_HIGH_MIDI) {
    return draft;
  }

  const steps = draft.steps.map((step, index) => {
    if (index !== draft.stepIndex) {
      return step;
    }

    return step.includes(midi)
      ? step.filter((stepMidi) => stepMidi !== midi)
      : normalizeStepMidiNotes([...step, midi]);
  });

  return {
    ...draft,
    steps,
    isDirty: true,
    error: null,
  };
}

export function movePracticeSongDraftStep(
  draft: PracticeSongDraft,
  direction: "previous" | "next",
): PracticeSongDraft {
  if (direction === "previous") {
    return {
      ...draft,
      stepIndex: Math.max(0, draft.stepIndex - 1),
      error: null,
    };
  }

  if (draft.stepIndex < draft.steps.length - 1) {
    return {
      ...draft,
      stepIndex: draft.stepIndex + 1,
      error: null,
    };
  }

  return {
    ...draft,
    steps: [...draft.steps, []],
    stepIndex: draft.steps.length,
    isDirty: true,
    error: null,
  };
}

export function setPracticeSongDraftError(
  draft: PracticeSongDraft,
  error: string,
): PracticeSongDraft {
  return {
    ...draft,
    error,
  };
}

export function getPracticeSongDraftCurrentNotes(
  draft: PracticeSongDraft,
): PracticeStepNote[] {
  return (draft.steps[draft.stepIndex] ?? []).map((midi) => ({
    midi,
    label: midiToNoteName(midi),
    pitchClass: midiToPitchClass(midi),
  }));
}

export function preparePracticeSongDraftForSave(
  draft: PracticeSongDraft,
  scale: SelectedScale | null,
  existingPaths: Iterable<string>,
): PracticeSongDraftSaveResult {
  const title = draft.title.trim();

  if (title.length === 0) {
    return { ok: false, error: "Add a song title" };
  }

  const steps = trimTrailingEmptySteps(draft.steps);

  if (steps.length === 0) {
    return { ok: false, error: "Add at least one step" };
  }

  const emptyStepIndex = steps.findIndex((step) => step.length === 0);

  if (emptyStepIndex >= 0) {
    return { ok: false, error: `Step ${emptyStepIndex + 1} is empty` };
  }

  const path =
    draft.source === "existing" && draft.path
      ? draft.path
      : `songs/${slugifyPracticeSongTitle(title)}.json`;

  if (draft.source === "new") {
    const slug = slugifyPracticeSongTitle(title);

    if (slug.length === 0) {
      return { ok: false, error: "Use letters or numbers in the song title" };
    }

    if (new Set(existingPaths).has(path)) {
      return { ok: false, error: "A song with this filename already exists" };
    }
  }

  const song: PracticeSongDraftSaveRequest["song"] = {
    title,
    steps: steps.map(serializePracticeSongDraftStep),
  };
  const scaleValue = serializePracticeSongScale(scale);

  if (scaleValue) {
    song.scale = scaleValue;
  }

  return {
    ok: true,
    request: {
      path,
      overwrite: draft.source === "existing",
      stepIndex: Math.min(draft.stepIndex, steps.length - 1),
      song,
    },
  };
}

export function serializePracticeSongDraftStep(midiNotes: number[]): string {
  return normalizeStepMidiNotes(midiNotes).map(midiToNoteName).join(" + ");
}

export function slugifyPracticeSongTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/#/g, " sharp ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeStepMidiNotes(midiNotes: Iterable<number>): number[] {
  return [...new Set(midiNotes)].sort((left, right) => left - right);
}

function trimTrailingEmptySteps(steps: number[][]): number[][] {
  let lastNonEmptyIndex = steps.length - 1;

  while (lastNonEmptyIndex >= 0 && steps[lastNonEmptyIndex].length === 0) {
    lastNonEmptyIndex -= 1;
  }

  return steps.slice(0, lastNonEmptyIndex + 1);
}

function serializePracticeSongScale(scale: SelectedScale | null): string | null {
  return scale ? `${scale.tonic} ${scale.mode}` : null;
}

function clampStepIndex(stepIndex: number, stepCount: number): number {
  return Math.max(0, Math.min(stepIndex, Math.max(0, stepCount - 1)));
}
