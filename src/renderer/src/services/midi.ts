import { normalizeMidiVelocity } from "../music/notes";

export type MidiEventType = "noteon" | "noteoff";

export interface MidiNoteEvent {
  type: MidiEventType;
  midi: number;
  velocity: number;
  rawVelocity: number;
  channel: number;
  deviceName: string;
  receivedAt: number;
}

export interface MidiInputSummary {
  id: string;
  name: string;
  manufacturer: string;
  state: MIDIPort["state"];
  connection: MIDIPort["connection"];
}

export interface MidiStatus {
  supported: boolean;
  permission: "unknown" | "granted" | "denied";
  selectedInputName?: string;
  inputs: MidiInputSummary[];
  error?: string;
}

export interface MidiConnection {
  close: () => void;
}

type MidiEventHandler = (event: MidiNoteEvent) => void;
type MidiStatusHandler = (status: MidiStatus) => void;

export async function connectWebMidi(
  onMidiEvent: MidiEventHandler,
  onStatus: MidiStatusHandler,
): Promise<MidiConnection> {
  if (!navigator.requestMIDIAccess) {
    onStatus({
      supported: false,
      permission: "denied",
      inputs: [],
      error: "Web MIDI unavailable",
    });
    return { close: () => undefined };
  }

  try {
    const access = await navigator.requestMIDIAccess({ sysex: false });

    const publishStatus = (): void => {
      const inputs = summarizeInputs(access);
      onStatus({
        supported: true,
        permission: "granted",
        selectedInputName: inputs[0]?.name,
        inputs,
      });
    };

    const attachInputs = (): void => {
      for (const input of access.inputs.values()) {
        input.onmidimessage = (message) => {
          const parsed = parseMidiMessage(
            message,
            input.name ?? "MIDI Input",
            performance.now(),
          );
          if (parsed) {
            onMidiEvent(parsed);
          }
        };
      }
    };

    access.onstatechange = () => {
      attachInputs();
      publishStatus();
    };

    attachInputs();
    publishStatus();

    return {
      close: () => {
        access.onstatechange = null;
        for (const input of access.inputs.values()) {
          input.onmidimessage = null;
        }
      },
    };
  } catch (error) {
    onStatus({
      supported: true,
      permission: "denied",
      inputs: [],
      error: error instanceof Error ? error.message : "MIDI permission denied",
    });

    return { close: () => undefined };
  }
}

function summarizeInputs(access: MIDIAccess): MidiInputSummary[] {
  return [...access.inputs.values()].map((input) => ({
    id: input.id,
    name: input.name ?? "Unknown MIDI Input",
    manufacturer: input.manufacturer ?? "Unknown",
    state: input.state,
    connection: input.connection,
  }));
}

export function parseMidiMessage(
  message: MIDIMessageEvent,
  deviceName: string,
  receivedAt = performance.now(),
): MidiNoteEvent | null {
  if (!message.data || message.data.length < 2) {
    return null;
  }

  const statusByte = message.data[0];
  const midi = message.data[1];
  const rawVelocity = message.data[2] ?? 0;
  const command = statusByte & 0xf0;
  const channel = (statusByte & 0x0f) + 1;

  if (command === 0x90 && rawVelocity > 0) {
    return {
      type: "noteon",
      midi,
      velocity: normalizeMidiVelocity(rawVelocity),
      rawVelocity,
      channel,
      deviceName,
      receivedAt,
    };
  }

  if (command === 0x80 || (command === 0x90 && rawVelocity === 0)) {
    return {
      type: "noteoff",
      midi,
      velocity: normalizeMidiVelocity(rawVelocity),
      rawVelocity,
      channel,
      deviceName,
      receivedAt,
    };
  }

  return null;
}
