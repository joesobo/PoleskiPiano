import type { Piano } from "@tonejs/piano/build/piano/Piano";
import { DEFAULT_HIGH_MIDI, DEFAULT_LOW_MIDI } from "../music/notes";

export type AudioEngineStatus = "idle" | "loading" | "ready" | "error";

export interface PianoAudioEngineSnapshot {
  status: AudioEngineStatus;
  message: string;
}

export class PianoAudioEngine {
  private piano?: Piano;
  private status: AudioEngineStatus = "idle";
  private message = "Audio off";
  private loadingPromise?: Promise<PianoAudioEngineSnapshot>;

  getSnapshot(): PianoAudioEngineSnapshot {
    return {
      status: this.status,
      message: this.message,
    };
  }

  async initialize(): Promise<PianoAudioEngineSnapshot> {
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    if (this.status === "ready" || this.status === "error") {
      return this.getSnapshot();
    }

    this.loadingPromise = this.loadPiano();
    const snapshot = await this.loadingPromise;
    this.loadingPromise = undefined;
    return snapshot;
  }

  noteOn(midi: number, velocity: number): void {
    if (this.status === "ready" && this.piano) {
      this.piano.keyDown({ midi, velocity });
    }
  }

  noteOff(midi: number): void {
    if (this.status === "ready" && this.piano) {
      this.piano.keyUp({ midi });
    }
  }

  stopAll(): void {
    this.piano?.stopAll();
  }

  private async loadPiano(): Promise<PianoAudioEngineSnapshot> {
    this.status = "loading";
    this.message = "Loading piano";

    const [Tone, pianoModule] = await Promise.all([
      import("tone"),
      import("@tonejs/piano/build/piano/Piano"),
    ]);

    await Tone.start();

    try {
      const piano = new pianoModule.Piano({
        velocities: 3,
        minNote: DEFAULT_LOW_MIDI,
        maxNote: DEFAULT_HIGH_MIDI,
        release: false,
        pedal: false,
        maxPolyphony: 20,
        volume: {
          strings: -4,
          pedal: -12,
          keybed: -12,
          harmonics: -12,
        },
      }).toDestination();

      await piano.load();

      this.piano = piano;
      this.status = "ready";
      this.message = "Piano ready";
    } catch (error) {
      this.status = "error";
      this.message =
        error instanceof Error
          ? `Sample load failed: ${error.message}`
          : "Sample load failed";
    }

    return this.getSnapshot();
  }
}
