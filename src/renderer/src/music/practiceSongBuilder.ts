import {
  DEFAULT_HIGH_MIDI,
  DEFAULT_LOW_MIDI,
  midiToNoteName,
  midiToPitchClass,
} from "./notes";
import {
  createPracticeSongMusicXml,
  type PracticeSong,
  type PracticeTargetNote,
} from "./practiceSongs";
import type { SelectedScale } from "./scales";

export type PracticeSongDraftSource = "new" | "existing";

export interface PracticeSongDraft {
  source: PracticeSongDraftSource;
  path: string | null;
  originalTitle: string;
  title: string;
  targets: number[][];
  targetIndex: number;
  isDirty: boolean;
  error: string | null;
}

export interface PracticeSongDraftSaveRequest {
  path: string;
  overwrite: boolean;
  targetIndex: number;
  contents: string;
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
    targets: [[]],
    targetIndex: 0,
    isDirty: false,
    error: null,
  };
}

export function createPracticeSongDraftFromSong(
  song: PracticeSong,
  targetIndex: number,
): PracticeSongDraft {
  return {
    source: "existing",
    path: song.id,
    originalTitle: song.title,
    title: song.title,
    targets: song.targets.map((target) =>
      normalizeTargetMidiNotes(target.midiNotes),
    ),
    targetIndex: clampTargetIndex(targetIndex, song.targets.length),
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

  const targets = draft.targets.map((target, index) => {
    if (index !== draft.targetIndex) {
      return target;
    }

    return target.includes(midi)
      ? target.filter((targetMidi) => targetMidi !== midi)
      : normalizeTargetMidiNotes([...target, midi]);
  });

  return {
    ...draft,
    targets,
    isDirty: true,
    error: null,
  };
}

export function movePracticeSongDraftTarget(
  draft: PracticeSongDraft,
  direction: "previous" | "next",
): PracticeSongDraft {
  if (direction === "previous") {
    return {
      ...draft,
      targetIndex: Math.max(0, draft.targetIndex - 1),
      error: null,
    };
  }

  if (draft.targetIndex < draft.targets.length - 1) {
    return {
      ...draft,
      targetIndex: draft.targetIndex + 1,
      error: null,
    };
  }

  return {
    ...draft,
    targets: [...draft.targets, []],
    targetIndex: draft.targets.length,
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
): PracticeTargetNote[] {
  return (draft.targets[draft.targetIndex] ?? []).map((midi) => ({
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

  const targets = trimTrailingEmptyTargets(draft.targets);

  if (targets.length === 0) {
    return { ok: false, error: "Add at least one target" };
  }

  const emptyTargetIndex = targets.findIndex((target) => target.length === 0);

  if (emptyTargetIndex >= 0) {
    return { ok: false, error: `Target ${emptyTargetIndex + 1} is empty` };
  }

  const path =
    draft.source === "existing" && draft.path
      ? draft.path
      : `songs/${slugifyPracticeSongTitle(title)}.musicxml`;

  if (draft.source === "new") {
    const slug = slugifyPracticeSongTitle(title);

    if (slug.length === 0) {
      return { ok: false, error: "Use letters or numbers in the song title" };
    }

    if (new Set(existingPaths).has(path)) {
      return { ok: false, error: "A song with this filename already exists" };
    }
  }

  return {
    ok: true,
    request: {
      path,
      overwrite: draft.source === "existing",
      targetIndex: Math.min(draft.targetIndex, targets.length - 1),
      contents: createPracticeSongMusicXml({
        title,
        scale,
        targets: targets.map((target) => ({
          notes: normalizeTargetMidiNotes(target).map((midi) => ({ midi })),
        })),
      }),
    },
  };
}

export function serializePracticeSongDraftTarget(midiNotes: number[]): string {
  return normalizeTargetMidiNotes(midiNotes).map(midiToNoteName).join(" + ");
}

export function slugifyPracticeSongTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/#/g, " sharp ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeTargetMidiNotes(midiNotes: Iterable<number>): number[] {
  return [...new Set(midiNotes)].sort((left, right) => left - right);
}

function trimTrailingEmptyTargets(targets: number[][]): number[][] {
  let lastNonEmptyIndex = targets.length - 1;

  while (lastNonEmptyIndex >= 0 && targets[lastNonEmptyIndex].length === 0) {
    lastNonEmptyIndex -= 1;
  }

  return targets.slice(0, lastNonEmptyIndex + 1);
}

function clampTargetIndex(targetIndex: number, targetCount: number): number {
  return Math.max(0, Math.min(targetIndex, Math.max(0, targetCount - 1)));
}
