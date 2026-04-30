import type { Piano } from "@tonejs/piano/build/piano/Piano";
import { DEFAULT_HIGH_MIDI, DEFAULT_LOW_MIDI, midiToNoteName } from "../music/notes";

export type AudioEngineStatus =
  | "idle"
  | "loading"
  | "ready"
  | "fallback"
  | "error";

export interface PianoAudioEngineSnapshot {
  status: AudioEngineStatus;
  message: string;
}

interface FallbackSynth {
  triggerAttack: (note: string, time?: number, velocity?: number) => void;
  triggerRelease: (note: string, time?: number) => void;
  releaseAll: () => void;
}

export class PianoAudioEngine {
  private piano?: Piano;
  private fallback?: FallbackSynth;
  private now?: () => number;
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

    if (this.status === "ready" || this.status === "fallback") {
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
      return;
    }

    if (this.status === "fallback" && this.fallback) {
      this.fallback.triggerAttack(midiToNoteName(midi), this.now?.(), velocity);
    }
  }

  noteOff(midi: number): void {
    if (this.status === "ready" && this.piano) {
      this.piano.keyUp({ midi });
      return;
    }

    if (this.status === "fallback" && this.fallback) {
      this.fallback.triggerRelease(midiToNoteName(midi), this.now?.());
    }
  }

  stopAll(): void {
    this.piano?.stopAll();
    this.fallback?.releaseAll();
  }

  private async loadPiano(): Promise<PianoAudioEngineSnapshot> {
    this.status = "loading";
    this.message = "Loading piano";

    const [Tone, pianoModule] = await Promise.all([
      import("tone"),
      import("@tonejs/piano/build/piano/Piano"),
    ]);

    this.now = Tone.now;
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
      this.fallback = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: {
          attack: 0.01,
          decay: 0.2,
          sustain: 0.35,
          release: 0.8,
        },
      }).toDestination();
      this.status = "fallback";
      this.message =
        error instanceof Error
          ? `Sample load failed; synth fallback active`
          : "Synth fallback active";
    }

    return this.getSnapshot();
  }
}
