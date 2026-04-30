export {};

declare global {
  interface Navigator {
    requestMIDIAccess?: (options?: MIDIOptions) => Promise<MIDIAccess>;
  }

  interface MIDIOptions {
    sysex?: boolean;
    software?: boolean;
  }

  interface MIDIAccess extends EventTarget {
    inputs: Map<string, MIDIInput>;
    outputs: Map<string, MIDIOutput>;
    sysexEnabled: boolean;
    onstatechange: ((event: MIDIConnectionEvent) => void) | null;
  }

  interface MIDIConnectionEvent extends Event {
    port: MIDIPort;
  }

  interface MIDIPort extends EventTarget {
    id: string;
    manufacturer?: string;
    name?: string;
    type: "input" | "output";
    version?: string;
    state: "connected" | "disconnected";
    connection: "open" | "closed" | "pending";
    open: () => Promise<MIDIPort>;
    close: () => Promise<MIDIPort>;
  }

  interface MIDIInput extends MIDIPort {
    type: "input";
    onmidimessage: ((event: MIDIMessageEvent) => void) | null;
  }

  interface MIDIOutput extends MIDIPort {
    type: "output";
  }

  interface MIDIMessageEvent extends Event {
    data: Uint8Array;
    receivedTime: number;
  }
}
