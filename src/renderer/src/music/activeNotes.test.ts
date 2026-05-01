import { describe, expect, it } from "vitest";
import {
  type ActiveInputState,
  type ActiveNote,
  applyActiveNoteOn,
  applyMidiNoteOn,
  applyScreenNoteStart,
  applyScreenNoteStop,
  createActiveInputState,
} from "./activeNotes";

describe("active notes", () => {
  it("preserves the original receivedAt when a held note gets another noteon", () => {
    const activeNotes = new Map([
      [
        60,
        {
          midi: 60,
          note: "C4",
          pitchClass: "C" as const,
          velocity: 0.5,
          receivedAt: 1000,
        },
      ],
    ]);

    const nextActiveNotes = applyActiveNoteOn(activeNotes, {
      midi: 60,
      note: "C4",
      pitchClass: "C",
      velocity: 0.9,
      receivedAt: 1400,
    });

    expect(nextActiveNotes.get(60)).toMatchObject({
      velocity: 0.9,
      receivedAt: 1000,
    });
  });

  it("keeps MIDI input polyphonic within the MIDI source", () => {
    const c3 = activeNote(48, "C3", "C", 1000);
    const d3 = activeNote(50, "D3", "D", 1100);
    const afterC = applyMidiNoteOn(createActiveInputState(), c3);
    const afterD = applyMidiNoteOn(afterC.state, d3);

    expect([...afterD.state.notes.keys()]).toEqual([48, 50]);
    expect(afterD.state.source).toBe("midi");
    expect(afterD.noteOns.map((note) => note.midi)).toEqual([50]);
    expect(afterD.noteOffs).toEqual([]);
  });

  it("replaces MIDI notes when on-screen input starts", () => {
    const c3 = activeNote(48, "C3", "C", 1000);
    const d3 = activeNote(50, "D3", "D", 1100);
    const f3 = activeNote(53, "F3", "F", 1200);
    const midiState = applyMidiNoteOn(
      applyMidiNoteOn(createActiveInputState(), c3).state,
      d3,
    ).state;
    const transition = applyScreenNoteStart(midiState, f3);

    expect([...transition.state.notes.keys()]).toEqual([53]);
    expect(transition.state.source).toBe("screen");
    expect(transition.noteOffs).toEqual([48, 50]);
    expect(transition.noteOns.map((note) => note.midi)).toEqual([53]);
  });

  it("keeps on-screen input monophonic when dragging to another note", () => {
    const c3 = activeNote(48, "C3", "C", 1000);
    const d3 = activeNote(50, "D3", "D", 1100);
    const afterC = applyScreenNoteStart(createActiveInputState(), c3);
    const afterD = applyScreenNoteStart(afterC.state, d3);

    expect([...afterD.state.notes.keys()]).toEqual([50]);
    expect(afterD.noteOffs).toEqual([48]);
    expect(afterD.noteOns.map((note) => note.midi)).toEqual([50]);
  });

  it("does not retrigger on-screen audio when dragging inside the same note", () => {
    const c3 = activeNote(48, "C3", "C", 1000);
    const afterC = applyScreenNoteStart(createActiveInputState(), c3);
    const repeatedC = applyScreenNoteStart(
      afterC.state,
      activeNote(48, "C3", "C", 1200),
    );

    expect([...repeatedC.state.notes.keys()]).toEqual([48]);
    expect(repeatedC.noteOffs).toEqual([]);
    expect(repeatedC.noteOns).toEqual([]);
  });

  it("does not resume replaced MIDI notes when on-screen input stops", () => {
    const state: ActiveInputState = {
      source: "screen",
      notes: new Map([[48, activeNote(48, "C3", "C", 1000)]]),
    };
    const transition = applyScreenNoteStop(state);

    expect(transition.state.source).toBeNull();
    expect(transition.state.notes.size).toBe(0);
    expect(transition.noteOffs).toEqual([48]);
  });

  it("replaces on-screen input when MIDI starts", () => {
    const c3 = activeNote(48, "C3", "C", 1000);
    const d3 = activeNote(50, "D3", "D", 1100);
    const screenState = applyScreenNoteStart(createActiveInputState(), c3).state;
    const transition = applyMidiNoteOn(screenState, d3);

    expect([...transition.state.notes.keys()]).toEqual([50]);
    expect(transition.state.source).toBe("midi");
    expect(transition.noteOffs).toEqual([48]);
    expect(transition.noteOns.map((note) => note.midi)).toEqual([50]);
  });
});

function activeNote(
  midi: number,
  note: string,
  pitchClass: ActiveNote["pitchClass"],
  receivedAt: number,
): ActiveNote {
  return {
    midi,
    note,
    pitchClass,
    velocity: 0.75,
    receivedAt,
  };
}
