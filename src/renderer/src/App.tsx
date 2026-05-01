import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChordDisplay } from "./components/ChordDisplay";
import { PianoKeyboard } from "./components/PianoKeyboard";
import { ScaleWheel } from "./components/ScaleWheel";
import { StaffNotation } from "./components/StaffNotation";
import { TopBar, type ThemeMode } from "./components/TopBar";
import {
  type ActiveInputTransition,
  type ActiveNote,
  applyMidiNoteOff,
  applyMidiNoteOn,
  applyScreenNoteStart,
  applyScreenNoteStop,
  createActiveInputState,
} from "./music/activeNotes";
import { analyzeChord } from "./music/chords";
import type { ChordPreview } from "./music/chordPreview";
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
import { groupTimedMidiNotesForStaff } from "./music/staff";
import {
  connectWebMidi,
  type MidiNoteEvent,
  type MidiStatus,
} from "./services/midi";
import { PianoAudioEngine } from "./services/pianoAudio";

const keyboardKeys = buildKeyboardRange();
const SCREEN_INPUT_VELOCITY = 0.5;
const initialMidiStatus: MidiStatus = {
  supported: true,
  permission: "unknown",
  inputs: [],
};

export function App(): React.ReactElement {
  const audioEngineRef = useRef(new PianoAudioEngine());
  const activeInputStateRef = useRef(createActiveInputState());
  const [midiStatus, setMidiStatus] = useState<MidiStatus>(initialMidiStatus);
  const [activeInputState, setActiveInputState] = useState(
    createActiveInputState,
  );
  const [audioLevel, setAudioLevel] = useState(0);
  const [selectedScale, setSelectedScale] = useState<SelectedScale | null>(null);
  const [selectedChordPreview, setSelectedChordPreview] =
    useState<ChordPreview | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const [screenInputResetKey, setScreenInputResetKey] = useState(0);
  const activeNotes = activeInputState.notes;

  const activeMidiNotes = useMemo(
    () => new Set(activeNotes.keys()),
    [activeNotes],
  );
  const activePitchClasses = useMemo(
    () => new Set([...activeNotes.values()].map((note) => note.pitchClass)),
    [activeNotes],
  );
  const activeMidiNoteGroups = useMemo(
    () => groupTimedMidiNotesForStaff([...activeNotes.values()]),
    [activeNotes],
  );
  const orderedActiveMidiNotes = useMemo(
    () => activeMidiNoteGroups.flat(),
    [activeMidiNoteGroups],
  );
  const chordAnalysis = useMemo(
    () => analyzeChord(orderedActiveMidiNotes),
    [orderedActiveMidiNotes],
  );
  const scaleMidiNotes = useMemo(
    () => buildScaleMidiSet(selectedScale),
    [selectedScale],
  );
  const previewMidiNotes = useMemo(
    () => selectedChordPreview?.midiNotes ?? [],
    [selectedChordPreview],
  );
  const previewMidiNoteSet = useMemo(
    () => new Set(previewMidiNotes),
    [previewMidiNotes],
  );

  const applyInputTransition = useCallback(
    (transition: ActiveInputTransition): void => {
      for (const midi of transition.noteOffs) {
        audioEngineRef.current.noteOff(midi);
      }

      for (const note of transition.noteOns) {
        audioEngineRef.current.noteOn(note.midi, note.velocity);
      }

      const latestNoteOn = transition.noteOns.at(-1);

      if (latestNoteOn) {
        setAudioLevel(latestNoteOn.velocity);
      }

      activeInputStateRef.current = transition.state;
      setActiveInputState(transition.state);
    },
    [],
  );

  const handleMidiEvent = useCallback(
    (event: MidiNoteEvent): void => {
      const midi = mapMidiInputToKeyboardMidi(event.midi);

      if (midi < DEFAULT_LOW_MIDI || midi > DEFAULT_HIGH_MIDI) {
        return;
      }

      if (event.type === "noteon") {
        const previousSource = activeInputStateRef.current.source;

        applyInputTransition(
          applyMidiNoteOn(
            activeInputStateRef.current,
            buildActiveNote(midi, event.velocity, event.receivedAt),
          ),
        );

        if (previousSource === "screen") {
          setScreenInputResetKey((resetKey) => resetKey + 1);
        }

        return;
      }

      applyInputTransition(
        applyMidiNoteOff(activeInputStateRef.current, midi),
      );
    },
    [applyInputTransition],
  );

  const handleScreenNoteStart = useCallback(
    (midi: number): void => {
      if (midi < DEFAULT_LOW_MIDI || midi > DEFAULT_HIGH_MIDI) {
        return;
      }

      applyInputTransition(
        applyScreenNoteStart(
          activeInputStateRef.current,
          buildActiveNote(midi, SCREEN_INPUT_VELOCITY, performance.now()),
        ),
      );
    },
    [applyInputTransition],
  );

  const handleScalePitchClassStart = useCallback(
    (pitchClass: PitchClass): void => {
      handleScreenNoteStart(48 + pitchClassToSemitone(pitchClass));
    },
    [handleScreenNoteStart],
  );

  const handleScreenNoteStop = useCallback((): void => {
    applyInputTransition(applyScreenNoteStop(activeInputStateRef.current));
  }, [applyInputTransition]);

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
        selectedChordPreview={selectedChordPreview}
        themeMode={themeMode}
        onScaleChange={setSelectedScale}
        onChordPreviewChange={setSelectedChordPreview}
        onThemeModeChange={setThemeMode}
      />

      <main className="practice-surface">
        <div className="middle-grid">
          <ScaleWheel
            scale={selectedScale}
            activePitchClasses={activePitchClasses}
            onPitchClassInputStart={handleScalePitchClassStart}
            onInputStop={handleScreenNoteStop}
            inputResetKey={screenInputResetKey}
          />
          <ChordDisplay
            analysis={chordAnalysis}
            previewChord={selectedChordPreview}
          />
          <StaffNotation
            activeMidiNotes={orderedActiveMidiNotes}
            activeMidiNoteGroups={activeMidiNoteGroups}
            previewMidiNotes={previewMidiNotes}
            onNoteInputStart={handleScreenNoteStart}
            onInputStop={handleScreenNoteStop}
            inputResetKey={screenInputResetKey}
          />
        </div>
      </main>

      <PianoKeyboard
        keys={keyboardKeys}
        activeMidiNotes={activeMidiNotes}
        previewMidiNotes={previewMidiNoteSet}
        scaleMidiNotes={scaleMidiNotes}
        onNoteInputStart={handleScreenNoteStart}
        onInputStop={handleScreenNoteStop}
        inputResetKey={screenInputResetKey}
      />
    </div>
  );
}

function buildActiveNote(
  midi: number,
  velocity: number,
  receivedAt: number,
): ActiveNote {
  return {
    midi,
    note: midiToNoteName(midi),
    pitchClass: midiToPitchClass(midi),
    velocity,
    receivedAt,
  };
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
