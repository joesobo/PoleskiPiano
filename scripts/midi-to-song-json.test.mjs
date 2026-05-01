import { describe, expect, it } from "vitest";
import {
  createPracticeSongJson,
  filterMidiEvents,
  midiEventsToPracticeSteps,
  parseMidiNoteOnEvents,
} from "./midi-to-song-json.mjs";

describe("midi-to-song-json", () => {
  it("parses MIDI note-on events and groups simultaneous notes into steps", () => {
    const midi = parseMidiNoteOnEvents(
      createTestMidi([
        [0, [0x90, 48, 90]],
        [0, [0x90, 52, 88]],
        [120, [0x90, 55, 92]],
        [120, [0x80, 48, 0]],
        [0, [0x80, 52, 0]],
        [0, [0x80, 55, 0]],
      ]),
    );

    expect(midi.ticksPerQuarter).toBe(480);
    expect(midi.events.map((event) => [event.tick, event.midi])).toEqual([
      [0, 48],
      [0, 52],
      [120, 55],
    ]);

    expect(midiEventsToPracticeSteps(midi.events).steps).toEqual([
      "C3 + E3",
      "G3",
    ]);
  });

  it("warns on out-of-range notes unless they are dropped", () => {
    const events = [
      { tick: 0, midi: 84, velocity: 90, channel: 0, track: 0 },
      { tick: 120, midi: 60, velocity: 90, channel: 0, track: 0 },
    ];

    expect(midiEventsToPracticeSteps(events).warnings[0]).toContain("C6");
    expect(
      midiEventsToPracticeSteps(events, { dropOutOfRange: true }).steps,
    ).toEqual(["C4"]);
  });

  it("filters events by track and channel", () => {
    const events = [
      { tick: 0, midi: 48, velocity: 90, channel: 0, track: 1 },
      { tick: 0, midi: 52, velocity: 90, channel: 1, track: 1 },
      { tick: 0, midi: 55, velocity: 90, channel: 0, track: 2 },
    ];

    expect(filterMidiEvents(events, { tracks: "1" })).toHaveLength(2);
    expect(
      filterMidiEvents(events, { channels: "0" }).map((event) => event.midi),
    ).toEqual([48, 55]);
    expect(
      midiEventsToPracticeSteps(events, { tracks: "1", channels: "1" }).steps,
    ).toEqual(["E3"]);
  });

  it("creates app Practice Song JSON", () => {
    expect(
      JSON.parse(
        createPracticeSongJson({
          title: "Test Song",
          scale: "D major",
          steps: ["C3"],
        }),
      ),
    ).toEqual({
      title: "Test Song",
      scale: "D major",
      steps: ["C3"],
    });
  });
});

function createTestMidi(events) {
  const trackEvents = events.flatMap(([delta, bytes]) => [
    ...encodeVariableLengthQuantity(delta),
    ...bytes,
  ]);
  const trackBytes = [...trackEvents, 0x00, 0xff, 0x2f, 0x00];
  const header = [
    ...ascii("MThd"),
    0x00,
    0x00,
    0x00,
    0x06,
    0x00,
    0x00,
    0x00,
    0x01,
    0x01,
    0xe0,
  ];
  const trackHeader = [...ascii("MTrk"), ...uint32(trackBytes.length)];

  return Buffer.from([...header, ...trackHeader, ...trackBytes]);
}

function ascii(value) {
  return [...Buffer.from(value, "ascii")];
}

function uint32(value) {
  return [
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  ];
}

function encodeVariableLengthQuantity(value) {
  let buffer = value & 0x7f;

  while ((value >>= 7) > 0) {
    buffer <<= 8;
    buffer |= (value & 0x7f) | 0x80;
  }

  const bytes = [];

  while (true) {
    bytes.push(buffer & 0xff);

    if (buffer & 0x80) {
      buffer >>= 8;
    } else {
      break;
    }
  }

  return bytes;
}
