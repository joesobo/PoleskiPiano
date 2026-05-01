import { describe, expect, it } from "vitest";
import { parseMidiMessage } from "./midi";

describe("MIDI parsing", () => {
  it("uses renderer receipt time for note grouping instead of device timestamp", () => {
    const event = parseMidiMessage(
      midiMessage([0x90, 60, 100], 10),
      "Test Controller",
      1234,
    );

    expect(event).toMatchObject({
      type: "noteon",
      midi: 60,
      receivedAt: 1234,
    });
  });
});

function midiMessage(data: number[], receivedTime: number): MIDIMessageEvent {
  return {
    data: new Uint8Array(data),
    receivedTime,
  } as MIDIMessageEvent;
}
