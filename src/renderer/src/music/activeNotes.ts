import type { PitchClass } from "./notes";

export interface ActiveNote {
  midi: number;
  note: string;
  pitchClass: PitchClass;
  velocity: number;
  receivedAt: number;
}

export type ActiveInputSource = "midi" | "screen";

export interface ActiveInputState {
  source: ActiveInputSource | null;
  notes: Map<number, ActiveNote>;
}

export interface ActiveInputTransition {
  state: ActiveInputState;
  noteOns: ActiveNote[];
  noteOffs: number[];
}

export function createActiveInputState(): ActiveInputState {
  return {
    source: null,
    notes: new Map(),
  };
}

export function applyActiveNoteOn(
  activeNotes: Map<number, ActiveNote>,
  note: ActiveNote,
): Map<number, ActiveNote> {
  const nextActiveNotes = new Map(activeNotes);
  const existingNote = nextActiveNotes.get(note.midi);

  nextActiveNotes.set(note.midi, {
    ...note,
    receivedAt: existingNote?.receivedAt ?? note.receivedAt,
  });

  return nextActiveNotes;
}

export function applyMidiNoteOn(
  state: ActiveInputState,
  note: ActiveNote,
): ActiveInputTransition {
  const shouldReplaceSource = state.source !== null && state.source !== "midi";
  const baseNotes = shouldReplaceSource
    ? new Map<number, ActiveNote>()
    : state.notes;
  const wasAlreadyActive = baseNotes.has(note.midi);
  const nextNotes = applyActiveNoteOn(baseNotes, note);

  return {
    state: {
      source: "midi",
      notes: nextNotes,
    },
    noteOns: wasAlreadyActive ? [] : [note],
    noteOffs: shouldReplaceSource ? [...state.notes.keys()] : [],
  };
}

export function applyMidiNoteOff(
  state: ActiveInputState,
  midi: number,
): ActiveInputTransition {
  if (state.source !== "midi" || !state.notes.has(midi)) {
    return {
      state,
      noteOns: [],
      noteOffs: [],
    };
  }

  const nextNotes = applyActiveNoteOff(state.notes, midi);

  return {
    state: {
      source: nextNotes.size > 0 ? "midi" : null,
      notes: nextNotes,
    },
    noteOns: [],
    noteOffs: [midi],
  };
}

export function applyScreenNoteStart(
  state: ActiveInputState,
  note: ActiveNote,
): ActiveInputTransition {
  const priorMidiNotes = [...state.notes.keys()];
  const shouldReplaceSource = state.source !== "screen";
  const wasAlreadyActive =
    state.source === "screen" && state.notes.has(note.midi);
  const noteOffs = shouldReplaceSource
    ? priorMidiNotes
    : priorMidiNotes.filter((midi) => midi !== note.midi);

  return {
    state: {
      source: "screen",
      notes: applyActiveNoteOn(new Map(), note),
    },
    noteOns: wasAlreadyActive ? [] : [note],
    noteOffs,
  };
}

export function applyScreenNoteStop(
  state: ActiveInputState,
): ActiveInputTransition {
  if (state.source !== "screen") {
    return {
      state,
      noteOns: [],
      noteOffs: [],
    };
  }

  return {
    state: createActiveInputState(),
    noteOns: [],
    noteOffs: [...state.notes.keys()],
  };
}

export function applyActiveNoteOff(
  activeNotes: Map<number, ActiveNote>,
  midi: number,
): Map<number, ActiveNote> {
  const nextActiveNotes = new Map(activeNotes);

  nextActiveNotes.delete(midi);

  return nextActiveNotes;
}
