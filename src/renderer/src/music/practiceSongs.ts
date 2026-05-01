import { buildChordPreview } from "./chordPreview";
import {
  DEFAULT_HIGH_MIDI,
  DEFAULT_LOW_MIDI,
  PITCH_CLASSES,
  midiToNoteName,
  midiToPitchClass,
  noteNameToMidi,
  type PitchClass,
} from "./notes";
import { SCALE_MODES, type ScaleMode, type SelectedScale } from "./scales";

export interface PracticeStepNote {
  midi: number;
  label: string;
  pitchClass: PitchClass;
}

export interface PracticeStep {
  source: string;
  label: string;
  midiNotes: number[];
  notes: PracticeStepNote[];
}

export interface PracticeSong {
  id: string;
  title: string;
  scale: SelectedScale | null;
  steps: PracticeStep[];
}

export type PracticeSongOption =
  | {
      status: "valid";
      id: string;
      title: string;
      path: string;
      song: PracticeSong;
    }
  | {
      status: "invalid";
      id: string;
      title: string;
      path: string;
      error: string;
    };

const DEFAULT_PRACTICE_OCTAVE = 3;

export function createPracticeSongOptions(
  files: Record<string, string>,
): PracticeSongOption[] {
  return Object.entries(files)
    .map(([path, rawFile]) => createPracticeSongOption(path, rawFile))
    .sort((left, right) => left.title.localeCompare(right.title));
}

export function parsePracticeSong(
  rawSong: unknown,
  id: string,
  fallbackTitle: string,
): PracticeSong {
  if (!isRecord(rawSong)) {
    throw new Error("Practice Song must be a JSON object");
  }

  const title =
    typeof rawSong.title === "string" && rawSong.title.trim().length > 0
      ? rawSong.title.trim()
      : fallbackTitle;
  const scale = parseOptionalPracticeScale(rawSong.scale);

  if (!Array.isArray(rawSong.steps)) {
    throw new Error("Practice Song must include a steps array");
  }

  if (rawSong.steps.length === 0) {
    throw new Error("Practice Song must include at least one step");
  }

  const steps = rawSong.steps.map((step, index) => {
    if (typeof step !== "string") {
      throw new Error(`Practice Step ${index + 1} must be a string`);
    }

    return parsePracticeStep(step);
  });

  return {
    id,
    title,
    scale,
    steps,
  };
}

export function parsePracticeStep(source: string): PracticeStep {
  const tokens = source
    .split("+")
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  if (tokens.length === 0) {
    throw new Error("Practice Step must contain at least one note or chord");
  }

  const tokenResults = tokens.map(parsePracticeStepToken);
  const notes = dedupePracticeStepNotes(
    tokenResults.flatMap((result) => result.notes),
  );

  if (notes.length === 0) {
    throw new Error("Practice Step must resolve to at least one note");
  }

  return {
    source,
    label: tokenResults.map((result) => result.label).join(" + "),
    midiNotes: notes.map((note) => note.midi),
    notes,
  };
}

export function parseOptionalPracticeScale(
  rawScale: unknown,
): SelectedScale | null {
  if (rawScale === undefined || rawScale === null || rawScale === "") {
    return null;
  }

  if (typeof rawScale !== "string") {
    throw new Error("Practice Song scale must be a string");
  }

  const match = /^([A-G]#?)\s+(major|minor)$/i.exec(rawScale.trim());

  if (!match) {
    throw new Error(`Invalid Practice Song scale: ${rawScale}`);
  }

  const tonic = normalizePitchClass(match[1]);
  const mode = match[2].toLowerCase() as ScaleMode;

  if (!SCALE_MODES.includes(mode)) {
    throw new Error(`Invalid Practice Song scale mode: ${match[2]}`);
  }

  return { tonic, mode };
}

export function activeMidiNotesMatchPracticeStep(
  activeMidiNotes: Iterable<number>,
  step: PracticeStep,
): boolean {
  const active = new Set(activeMidiNotes);
  const expected = new Set(step.midiNotes);

  if (active.size !== expected.size) {
    return false;
  }

  for (const midi of expected) {
    if (!active.has(midi)) {
      return false;
    }
  }

  return true;
}

function createPracticeSongOption(
  path: string,
  rawFile: string,
): PracticeSongOption {
  const fallbackTitle = titleFromPath(path);

  try {
    const rawSong = JSON.parse(rawFile) as unknown;
    const song = parsePracticeSong(rawSong, path, fallbackTitle);

    return {
      status: "valid",
      id: path,
      title: song.title,
      path,
      song,
    };
  } catch (error) {
    return {
      status: "invalid",
      id: path,
      title: getInvalidSongTitle(rawFile) ?? fallbackTitle,
      path,
      error: error instanceof Error ? error.message : "Invalid Practice Song",
    };
  }
}

function parsePracticeStepToken(token: string): {
  label: string;
  notes: PracticeStepNote[];
} {
  if (/^[A-G]b/i.test(token)) {
    throw new Error(`Flat notes are not supported yet: ${token}`);
  }

  const chordMatch = /^([A-G]#?)\s*(major|minor)$/i.exec(token);

  if (chordMatch) {
    const root = normalizePitchClass(chordMatch[1]);
    const quality = chordMatch[2].toLowerCase() as "major" | "minor";
    const preview = buildChordPreview(root, quality);

    return {
      label: preview.optionLabel,
      notes: preview.midiNotes.map(buildPracticeStepNote),
    };
  }

  const noteMatch = /^([A-G]#?)(-?\d+)$/i.exec(token);

  if (noteMatch) {
    const noteName = `${normalizePitchClass(noteMatch[1])}${noteMatch[2]}`;
    const midi = noteNameToMidi(noteName);

    assertMidiInPracticeRange(midi, noteName);

    return {
      label: noteName,
      notes: [buildPracticeStepNote(midi)],
    };
  }

  const pitchClassMatch = /^([A-G]#?)$/i.exec(token);

  if (pitchClassMatch) {
    const noteName = `${normalizePitchClass(pitchClassMatch[1])}${DEFAULT_PRACTICE_OCTAVE}`;
    const midi = noteNameToMidi(noteName);

    assertMidiInPracticeRange(midi, noteName);

    return {
      label: noteName,
      notes: [buildPracticeStepNote(midi)],
    };
  }

  throw new Error(`Invalid Practice Step token: ${token}`);
}

function normalizePitchClass(rawPitchClass: string): PitchClass {
  const normalized = rawPitchClass[0].toUpperCase() + rawPitchClass.slice(1);

  if (!PITCH_CLASSES.includes(normalized as PitchClass)) {
    throw new Error(`Unsupported pitch class: ${rawPitchClass}`);
  }

  return normalized as PitchClass;
}

function buildPracticeStepNote(midi: number): PracticeStepNote {
  return {
    midi,
    label: midiToNoteName(midi),
    pitchClass: midiToPitchClass(midi),
  };
}

function dedupePracticeStepNotes(notes: PracticeStepNote[]): PracticeStepNote[] {
  const seen = new Set<number>();
  const deduped: PracticeStepNote[] = [];

  for (const note of notes) {
    if (!seen.has(note.midi)) {
      seen.add(note.midi);
      deduped.push(note);
    }
  }

  return deduped;
}

function assertMidiInPracticeRange(midi: number, label: string): void {
  if (midi < DEFAULT_LOW_MIDI || midi > DEFAULT_HIGH_MIDI) {
    throw new Error(`Practice Step note ${label} is outside the C2-C5 range`);
  }
}

function titleFromPath(path: string): string {
  const filename = path.split("/").at(-1)?.replace(/\.json$/i, "") ?? path;
  const words = filename.split(/[-_\s]+/).filter(Boolean);

  return words.length > 0
    ? words
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(" ")
    : "Untitled Practice Song";
}

function getLoosePracticeSongTitle(rawSong: unknown): string | null {
  if (
    isRecord(rawSong) &&
    typeof rawSong.title === "string" &&
    rawSong.title.trim().length > 0
  ) {
    return rawSong.title.trim();
  }

  return null;
}

function getInvalidSongTitle(rawFile: string): string | null {
  try {
    return getLoosePracticeSongTitle(JSON.parse(rawFile) as unknown);
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
