import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChordDisplay,
  type ChordDisplayPreview,
} from "./components/ChordDisplay";
import { PianoKeyboard } from "./components/PianoKeyboard";
import { ScaleWheel } from "./components/ScaleWheel";
import { StaffNotation } from "./components/StaffNotation";
import {
  NONE_PRACTICE_SONG_ID,
  TopBar,
  type ThemeMode,
} from "./components/TopBar";
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
import { PRACTICE_SONG_OPTIONS } from "./music/practiceSongLibrary";
import {
  activeMidiNotesMatchPracticeStep,
  type PracticeStep,
  type PracticeSong,
} from "./music/practiceSongs";
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
const initialPracticeState = {
  song: null as PracticeSong | null,
  stepIndex: 0,
  isPlaying: false,
};

export function App(): React.ReactElement {
  const audioEngineRef = useRef(new PianoAudioEngine());
  const activeInputStateRef = useRef(createActiveInputState());
  const practiceStateRef = useRef(initialPracticeState);
  const [midiStatus, setMidiStatus] = useState<MidiStatus>(initialMidiStatus);
  const [activeInputState, setActiveInputState] = useState(
    createActiveInputState,
  );
  const [audioLevel, setAudioLevel] = useState(0);
  const [selectedScale, setSelectedScale] = useState<SelectedScale | null>(null);
  const [selectedChordPreview, setSelectedChordPreview] =
    useState<ChordPreview | null>(null);
  const [selectedPracticeSongId, setSelectedPracticeSongId] = useState(
    NONE_PRACTICE_SONG_ID,
  );
  const [practiceStepIndex, setPracticeStepIndex] = useState(0);
  const [isPracticePlaying, setIsPracticePlaying] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const [screenInputResetKey, setScreenInputResetKey] = useState(0);
  const activeNotes = activeInputState.notes;
  const selectedPracticeSong = useMemo(() => {
    const option = PRACTICE_SONG_OPTIONS.find(
      (practiceSongOption) =>
        practiceSongOption.id === selectedPracticeSongId &&
        practiceSongOption.status === "valid",
    );

    return option?.status === "valid" ? option.song : null;
  }, [selectedPracticeSongId]);
  const currentPracticeStep = selectedPracticeSong
    ? selectedPracticeSong.steps[practiceStepIndex] ?? null
    : null;
  const practiceStepPosition = selectedPracticeSong
    ? {
        current: practiceStepIndex + 1,
        total: selectedPracticeSong.steps.length,
      }
    : null;

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
    () => currentPracticeStep?.midiNotes ?? selectedChordPreview?.midiNotes ?? [],
    [currentPracticeStep, selectedChordPreview],
  );
  const previewMidiNoteSet = useMemo(
    () => new Set(previewMidiNotes),
    [previewMidiNotes],
  );
  const chordDisplayPreview = useMemo(
    () =>
      buildChordDisplayPreview(
        selectedPracticeSong,
        currentPracticeStep,
        practiceStepPosition,
        selectedChordPreview,
      ),
    [
      currentPracticeStep,
      practiceStepPosition,
      selectedChordPreview,
      selectedPracticeSong,
    ],
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
  const maybeAdvancePracticeStep = useCallback(
    (transition: ActiveInputTransition): void => {
      const practiceState = practiceStateRef.current;

      if (
        !practiceState.isPlaying ||
        !practiceState.song ||
        transition.state.source !== "midi" ||
        (transition.noteOns.length === 0 && transition.noteOffs.length === 0)
      ) {
        return;
      }

      const practiceSong = practiceState.song;
      const expectedStep = practiceSong.steps[practiceState.stepIndex];

      if (
        activeMidiNotesMatchPracticeStep(
          transition.state.notes.keys(),
          expectedStep,
        )
      ) {
        setPracticeStepIndex((currentStepIndex) => {
          if (currentStepIndex !== practiceState.stepIndex) {
            return currentStepIndex;
          }

          return (currentStepIndex + 1) % practiceSong.steps.length;
        });
      }
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
        const transition = applyMidiNoteOn(
          activeInputStateRef.current,
          buildActiveNote(midi, event.velocity, event.receivedAt),
        );

        applyInputTransition(transition);
        maybeAdvancePracticeStep(transition);

        if (previousSource === "screen") {
          setScreenInputResetKey((resetKey) => resetKey + 1);
        }

        return;
      }

      const transition = applyMidiNoteOff(activeInputStateRef.current, midi);

      applyInputTransition(transition);
      maybeAdvancePracticeStep(transition);
    },
    [applyInputTransition, maybeAdvancePracticeStep],
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
  const handlePracticeSongChange = useCallback((practiceSongId: string): void => {
    setSelectedPracticeSongId(practiceSongId);
    setPracticeStepIndex(0);
    setIsPracticePlaying(false);

    if (practiceSongId === NONE_PRACTICE_SONG_ID) {
      return;
    }

    const option = PRACTICE_SONG_OPTIONS.find(
      (practiceSongOption) =>
        practiceSongOption.id === practiceSongId &&
        practiceSongOption.status === "valid",
    );

    if (option?.status !== "valid") {
      return;
    }

    setSelectedChordPreview(null);

    if (option.song.scale) {
      setSelectedScale(option.song.scale);
    }
  }, []);
  const handlePracticeBack = useCallback((): void => {
    setPracticeStepIndex((currentStepIndex) =>
      Math.max(0, currentStepIndex - 1),
    );
  }, []);
  const handlePracticeNext = useCallback((): void => {
    setPracticeStepIndex((currentStepIndex) => {
      if (!selectedPracticeSong) {
        return 0;
      }

      return Math.min(
        selectedPracticeSong.steps.length - 1,
        currentStepIndex + 1,
      );
    });
  }, [selectedPracticeSong]);
  const handlePracticeRestart = useCallback((): void => {
    setPracticeStepIndex(0);
  }, []);

  useEffect(() => {
    practiceStateRef.current = {
      song: selectedPracticeSong,
      stepIndex: practiceStepIndex,
      isPlaying: isPracticePlaying,
    };
  }, [isPracticePlaying, practiceStepIndex, selectedPracticeSong]);

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

  useEffect(() => {
    return window.poleskiPiano?.onThemeToggle?.(() => {
      setThemeMode((currentThemeMode) =>
        currentThemeMode === "dark" ? "light" : "dark",
      );
    });
  }, []);

  useEffect(() => {
    window.poleskiPiano?.setThemeMode?.(themeMode);
  }, [themeMode]);

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
        practiceSongOptions={PRACTICE_SONG_OPTIONS}
        selectedPracticeSongId={selectedPracticeSongId}
        hasSelectedPracticeSong={selectedPracticeSong !== null}
        isPracticePlaying={isPracticePlaying}
        onScaleChange={setSelectedScale}
        onChordPreviewChange={setSelectedChordPreview}
        onPracticeSongChange={handlePracticeSongChange}
        onPracticeBack={handlePracticeBack}
        onPracticeNext={handlePracticeNext}
        onPracticeRestart={handlePracticeRestart}
        onPracticePlayingChange={setIsPracticePlaying}
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
            preview={chordDisplayPreview}
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

function buildChordDisplayPreview(
  practiceSong: PracticeSong | null,
  practiceStep: PracticeStep | null,
  practiceStepPosition: { current: number; total: number } | null,
  chordPreview: ChordPreview | null,
): ChordDisplayPreview | null {
  if (practiceSong && practiceStep && practiceStepPosition) {
    return {
      kind: "practice",
      kicker: "Practice",
      name: practiceSong.title,
      stepCount: `${practiceStepPosition.current}/${practiceStepPosition.total}`,
      notes: practiceStep.notes,
    };
  }

  if (chordPreview) {
    return {
      kind: "chord",
      kicker: "Chord Preview",
      name: chordPreview.label,
      colorPitchClass: chordPreview.root,
      notes: chordPreview.pitchClasses.map((pitchClass) => ({
        label: pitchClass,
        pitchClass,
      })),
    };
  }

  return null;
}
