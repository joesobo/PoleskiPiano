import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChordDisplay } from "./components/ChordDisplay";
import { PianoKeyboard } from "./components/PianoKeyboard";
import { ScaleWheel } from "./components/ScaleWheel";
import { StaffNotation } from "./components/StaffNotation";
import { TopBar, type ThemeMode } from "./components/TopBar";
import { analyzeChord } from "./music/chords";
import {
  buildKeyboardRange,
  DEFAULT_HIGH_MIDI,
  DEFAULT_LOW_MIDI,
  mapMidiInputToKeyboardMidi,
  midiToNoteName,
  midiToPitchClass,
  pitchClassToSemitone,
  type PitchClass,
} from "./music/notes";
import {
  getScalePitchClasses,
  type SelectedScale,
} from "./music/scales";
import { orderTimedMidiNotesForStaff } from "./music/staff";
import {
  connectWebMidi,
  type MidiNoteEvent,
  type MidiStatus,
} from "./services/midi";
import { PianoAudioEngine } from "./services/pianoAudio";

interface ActiveNote {
  midi: number;
  note: string;
  pitchClass: PitchClass;
  velocity: number;
  receivedAt: number;
}

const keyboardKeys = buildKeyboardRange();
const initialMidiStatus: MidiStatus = {
  supported: true,
  permission: "unknown",
  inputs: [],
};

export function App(): React.ReactElement {
  const audioEngineRef = useRef(new PianoAudioEngine());
  const activeNotesRef = useRef<Map<number, ActiveNote>>(new Map());
  const [midiStatus, setMidiStatus] = useState<MidiStatus>(initialMidiStatus);
  const [activeNotes, setActiveNotes] = useState<Map<number, ActiveNote>>(
    () => new Map(),
  );
  const [audioLevel, setAudioLevel] = useState(0);
  const [selectedScale, setSelectedScale] = useState<SelectedScale | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");

  const activeMidiNotes = useMemo(
    () => new Set(activeNotes.keys()),
    [activeNotes],
  );
  const activePitchClasses = useMemo(
    () => new Set([...activeNotes.values()].map((note) => note.pitchClass)),
    [activeNotes],
  );
  const orderedActiveMidiNotes = useMemo(
    () => orderTimedMidiNotesForStaff([...activeNotes.values()]),
    [activeNotes],
  );
  const chordAnalysis = useMemo(
    () => analyzeChord(orderedActiveMidiNotes),
    [orderedActiveMidiNotes],
  );
  const scaleMidiNotes = useMemo(
    () => buildScaleMidiSet(selectedScale),
    [selectedScale],
  );

  const handleMidiEvent = useCallback((event: MidiNoteEvent): void => {
    const midi = mapMidiInputToKeyboardMidi(event.midi);

    if (midi < DEFAULT_LOW_MIDI || midi > DEFAULT_HIGH_MIDI) {
      return;
    }

    if (event.type === "noteon") {
      const note = midiToNoteName(midi);
      const pitchClass = midiToPitchClass(midi);

      audioEngineRef.current.noteOn(midi, event.velocity);
      setAudioLevel(event.velocity);
      const nextActiveNotes = new Map(activeNotesRef.current);

      nextActiveNotes.set(midi, {
        midi,
        note,
        pitchClass,
        velocity: event.velocity,
        receivedAt: event.receivedAt,
      });
      activeNotesRef.current = nextActiveNotes;
      setActiveNotes(nextActiveNotes);
      return;
    }

    audioEngineRef.current.noteOff(midi);
    const nextActiveNotes = new Map(activeNotesRef.current);

    nextActiveNotes.delete(midi);
    activeNotesRef.current = nextActiveNotes;
    setActiveNotes(nextActiveNotes);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let connection: { close: () => void } | undefined;

    connectWebMidi(handleMidiEvent, (status) => {
      if (isMounted) {
        setMidiStatus(status);
      }
    }).then((nextConnection) => {
      if (isMounted) {
        connection = nextConnection;
      } else {
        nextConnection.close();
      }
    });

    return () => {
      isMounted = false;
      connection?.close();
      audioEngineRef.current.stopAll();
    };
  }, [handleMidiEvent]);

  useEffect(() => {
    if (audioLevel <= 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setAudioLevel(0);
    }, 240);

    return () => window.clearTimeout(timeout);
  }, [audioLevel]);

  const enableAudio = useCallback(async (): Promise<void> => {
    try {
      await audioEngineRef.current.initialize();
    } catch (error) {
      console.warn("Audio unavailable", error);
    }
  }, []);

  useEffect(() => {
    void enableAudio();
  }, [enableAudio]);

  return (
    <div className="app-shell" data-theme={themeMode}>
      <TopBar
        midiStatus={midiStatus}
        audioLevel={audioLevel}
        selectedScale={selectedScale}
        themeMode={themeMode}
        onScaleChange={setSelectedScale}
        onThemeModeChange={setThemeMode}
      />

      <main className="practice-surface">
        <div className="middle-grid">
          <ScaleWheel
            scale={selectedScale}
            activePitchClasses={activePitchClasses}
          />
          <ChordDisplay analysis={chordAnalysis} />
          <StaffNotation activeMidiNotes={orderedActiveMidiNotes} />
        </div>
      </main>

      <PianoKeyboard
        keys={keyboardKeys}
        activeMidiNotes={activeMidiNotes}
        scaleMidiNotes={scaleMidiNotes}
      />
    </div>
  );
}

function buildScaleMidiSet(scale: SelectedScale | null): Set<number> {
  const midiNotes = new Set<number>();

  if (!scale) {
    for (let midi = DEFAULT_LOW_MIDI; midi <= DEFAULT_HIGH_MIDI; midi += 1) {
      midiNotes.add(midi);
    }

    return midiNotes;
  }

  const scaleSemitones = new Set(
    getScalePitchClasses(scale).map(pitchClassToSemitone),
  );

  for (let midi = DEFAULT_LOW_MIDI; midi <= DEFAULT_HIGH_MIDI; midi += 1) {
    if (scaleSemitones.has(((midi % 12) + 12) % 12)) {
      midiNotes.add(midi);
    }
  }

  return midiNotes;
}
