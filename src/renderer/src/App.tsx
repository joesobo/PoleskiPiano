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
  PENDING_PRACTICE_SONG_ID,
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
  createNewPracticeSongDraft,
  createPracticeSongDraftFromSong,
  getPracticeSongDraftCurrentNotes,
  movePracticeSongDraftStep,
  preparePracticeSongDraftForSave,
  setPracticeSongDraftError,
  setPracticeSongDraftTitle,
  togglePracticeSongDraftMidi,
  type PracticeSongDraft,
} from "./music/practiceSongBuilder";
import {
  activeMidiNotesMatchPracticeStep,
  createPracticeSongOptions,
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
import {
  listPracticeSongFiles,
  savePracticeSongFile,
} from "./services/practiceSongFiles";

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
  const practiceSongBuilderDraftRef = useRef<PracticeSongDraft | null>(null);
  const [midiStatus, setMidiStatus] = useState<MidiStatus>(initialMidiStatus);
  const [activeInputState, setActiveInputState] = useState(
    createActiveInputState,
  );
  const [audioLevel, setAudioLevel] = useState(0);
  const [selectedScale, setSelectedScale] = useState<SelectedScale | null>(null);
  const [selectedChordPreview, setSelectedChordPreview] =
    useState<ChordPreview | null>(null);
  const [practiceSongOptions, setPracticeSongOptions] = useState(
    PRACTICE_SONG_OPTIONS,
  );
  const [selectedPracticeSongId, setSelectedPracticeSongId] = useState(
    NONE_PRACTICE_SONG_ID,
  );
  const [pendingPracticeSongTitle, setPendingPracticeSongTitle] = useState("");
  const [practiceSongBuilderDraft, setPracticeSongBuilderDraft] =
    useState<PracticeSongDraft | null>(null);
  const [practiceStepIndex, setPracticeStepIndex] = useState(0);
  const [isPracticePlaying, setIsPracticePlaying] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const [screenInputResetKey, setScreenInputResetKey] = useState(0);
  const activeNotes = activeInputState.notes;
  const selectedPracticeSong = useMemo(() => {
    const option = practiceSongOptions.find(
      (practiceSongOption) =>
        practiceSongOption.id === selectedPracticeSongId &&
        practiceSongOption.status === "valid",
    );

    return option?.status === "valid" ? option.song : null;
  }, [practiceSongOptions, selectedPracticeSongId]);
  const hasPendingPracticeSong =
    selectedPracticeSongId === PENDING_PRACTICE_SONG_ID;
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
  const practiceSongBuilderNotes = useMemo(
    () =>
      practiceSongBuilderDraft
        ? getPracticeSongDraftCurrentNotes(practiceSongBuilderDraft)
        : [],
    [practiceSongBuilderDraft],
  );
  const previewMidiNotes = useMemo(
    () =>
      practiceSongBuilderDraft
        ? practiceSongBuilderNotes.map((note) => note.midi)
        : currentPracticeStep?.midiNotes ?? selectedChordPreview?.midiNotes ?? [],
    [
      currentPracticeStep,
      practiceSongBuilderDraft,
      practiceSongBuilderNotes,
      selectedChordPreview,
    ],
  );
  const previewMidiNoteSet = useMemo(
    () => new Set(previewMidiNotes),
    [previewMidiNotes],
  );
  const chordDisplayPreview = useMemo(
    () => {
      if (practiceSongBuilderDraft) {
        return {
          kind: "practice" as const,
          kicker: "Practice Song Builder",
          name: practiceSongBuilderDraft.title.trim() || "Untitled song",
          stepCount: `${practiceSongBuilderDraft.stepIndex + 1}/${practiceSongBuilderDraft.steps.length}`,
          notes: practiceSongBuilderNotes,
          message: practiceSongBuilderDraft.error,
        };
      }

      return buildChordDisplayPreview(
        selectedPracticeSong,
        currentPracticeStep,
        practiceStepPosition,
        selectedChordPreview,
      );
    },
    [
      currentPracticeStep,
      practiceStepPosition,
      practiceSongBuilderDraft,
      practiceSongBuilderNotes,
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
        practiceSongBuilderDraftRef.current ||
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
  const togglePracticeSongBuilderNote = useCallback((midi: number): void => {
    setPracticeSongBuilderDraft((draft) =>
      draft ? togglePracticeSongDraftMidi(draft, midi) : draft,
    );
  }, []);

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
        if (
          practiceSongBuilderDraftRef.current &&
          transition.noteOns.length > 0
        ) {
          togglePracticeSongBuilderNote(midi);
        }
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
    [applyInputTransition, maybeAdvancePracticeStep, togglePracticeSongBuilderNote],
  );

  const handleScreenNoteStart = useCallback(
    (midi: number): void => {
      if (midi < DEFAULT_LOW_MIDI || midi > DEFAULT_HIGH_MIDI) {
        return;
      }

      const transition = applyScreenNoteStart(
        activeInputStateRef.current,
        buildActiveNote(midi, SCREEN_INPUT_VELOCITY, performance.now()),
      );

      applyInputTransition(transition);

      if (
        practiceSongBuilderDraftRef.current &&
        transition.noteOns.length > 0
      ) {
        togglePracticeSongBuilderNote(midi);
      }
    },
    [applyInputTransition, togglePracticeSongBuilderNote],
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
  const handlePracticeSongChange = useCallback(
    (practiceSongId: string): void => {
      setSelectedPracticeSongId(practiceSongId);
      setPendingPracticeSongTitle("");
      setPracticeStepIndex(0);
      setIsPracticePlaying(false);

      if (practiceSongId === PENDING_PRACTICE_SONG_ID) {
        setSelectedChordPreview(null);
        return;
      }

      if (practiceSongId === NONE_PRACTICE_SONG_ID) {
        return;
      }

      const option = practiceSongOptions.find(
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
    },
    [practiceSongOptions],
  );
  const handlePendingPracticeSongTitleChange = useCallback(
    (title: string): void => {
      setPendingPracticeSongTitle(title);
      setIsPracticePlaying(false);
      setSelectedPracticeSongId(PENDING_PRACTICE_SONG_ID);
      setSelectedChordPreview(null);
      setPracticeStepIndex(0);
    },
    [],
  );
  const handlePendingPracticeSongCancel = useCallback((): void => {
    setPendingPracticeSongTitle("");
    setSelectedPracticeSongId(NONE_PRACTICE_SONG_ID);
    setIsPracticePlaying(false);
  }, []);
  const handleChordPreviewChange = useCallback(
    (preview: ChordPreview | null): void => {
      setSelectedChordPreview(preview);

      if (!preview) {
        return;
      }

      setSelectedPracticeSongId(NONE_PRACTICE_SONG_ID);
      setPendingPracticeSongTitle("");
      setPracticeStepIndex(0);
      setIsPracticePlaying(false);
    },
    [],
  );
  const handlePracticeSongBuilderTitleChange = useCallback(
    (title: string): void => {
      setPracticeSongBuilderDraft((draft) =>
        draft ? setPracticeSongDraftTitle(draft, title) : draft,
      );
    },
    [],
  );
  const handlePracticeBack = useCallback((): void => {
    if (practiceSongBuilderDraftRef.current) {
      setPracticeSongBuilderDraft((draft) =>
        draft ? movePracticeSongDraftStep(draft, "previous") : draft,
      );
      return;
    }

    setPracticeStepIndex((currentStepIndex) =>
      Math.max(0, currentStepIndex - 1),
    );
  }, []);
  const handlePracticeNext = useCallback((): void => {
    if (practiceSongBuilderDraftRef.current) {
      setPracticeSongBuilderDraft((draft) =>
        draft ? movePracticeSongDraftStep(draft, "next") : draft,
      );
      return;
    }

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
  const handlePracticeSongBuilderStart = useCallback((): void => {
    setIsPracticePlaying(false);
    setSelectedChordPreview(null);

    if (selectedPracticeSong) {
      setPracticeSongBuilderDraft(
        createPracticeSongDraftFromSong(selectedPracticeSong, practiceStepIndex),
      );
      return;
    }

    if (pendingPracticeSongTitle.trim().length > 0) {
      setPracticeSongBuilderDraft(
        createNewPracticeSongDraft(pendingPracticeSongTitle),
      );
    }
  }, [pendingPracticeSongTitle, practiceStepIndex, selectedPracticeSong]);
  const handlePracticeSongBuilderSave = useCallback(async (): Promise<void> => {
    const draft = practiceSongBuilderDraftRef.current;

    if (!draft) {
      return;
    }

    const saveResult = preparePracticeSongDraftForSave(
      draft,
      selectedScale,
      practiceSongOptions.map((option) => option.path),
    );

    if (!saveResult.ok) {
      setPracticeSongBuilderDraft((currentDraft) =>
        currentDraft
          ? setPracticeSongDraftError(currentDraft, saveResult.error)
          : currentDraft,
      );
      return;
    }

    const { stepIndex, ...request } = saveResult.request;

    try {
      const response = await savePracticeSongFile(request);
      const nextOptions = createPracticeSongOptions(response.files);

      setPracticeSongOptions(nextOptions);
      setPracticeSongBuilderDraft(null);
      setPendingPracticeSongTitle("");
      setSelectedPracticeSongId(response.path);
      setPracticeStepIndex(stepIndex);
      setIsPracticePlaying(false);
      setSelectedChordPreview(null);
    } catch (error) {
      setPracticeSongBuilderDraft((currentDraft) =>
        currentDraft
          ? setPracticeSongDraftError(currentDraft, getErrorMessage(error))
          : currentDraft,
      );
    }
  }, [practiceSongOptions, selectedScale]);
  const handlePracticeSongBuilderCancel = useCallback((): void => {
    const draft = practiceSongBuilderDraftRef.current;

    if (!draft) {
      return;
    }

    if (draft.isDirty && !window.confirm("Discard unsaved changes?")) {
      return;
    }

    setPracticeSongBuilderDraft(null);

    if (draft.source === "new") {
      setPendingPracticeSongTitle(draft.originalTitle);
      setSelectedPracticeSongId(
        draft.originalTitle.trim().length > 0
          ? PENDING_PRACTICE_SONG_ID
          : NONE_PRACTICE_SONG_ID,
      );
    }
  }, []);

  useEffect(() => {
    practiceStateRef.current = {
      song: selectedPracticeSong,
      stepIndex: practiceStepIndex,
      isPlaying: isPracticePlaying,
    };
  }, [isPracticePlaying, practiceStepIndex, selectedPracticeSong]);

  useEffect(() => {
    practiceSongBuilderDraftRef.current = practiceSongBuilderDraft;
  }, [practiceSongBuilderDraft]);

  useEffect(() => {
    let isMounted = true;

    listPracticeSongFiles()
      .then((files) => {
        if (isMounted) {
          setPracticeSongOptions(createPracticeSongOptions(files));
        }
      })
      .catch((error) => {
        console.warn("Practice Songs unavailable", error);
      });

    return () => {
      isMounted = false;
    };
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        shouldIgnorePracticeStepShortcut(event.target)
      ) {
        return;
      }

      const canNavigatePracticeSteps =
        practiceSongBuilderDraft !== null || selectedPracticeSong !== null;

      if (!canNavigatePracticeSteps) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        handlePracticeBack();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        handlePracticeNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handlePracticeBack,
    handlePracticeNext,
    practiceSongBuilderDraft,
    selectedPracticeSong,
  ]);

  return (
    <div className="app-shell" data-theme={themeMode}>
      <TopBar
        midiStatus={midiStatus}
        audioLevel={audioLevel}
        selectedScale={selectedScale}
        selectedChordPreview={selectedChordPreview}
        practiceSongOptions={practiceSongOptions}
        selectedPracticeSongId={selectedPracticeSongId}
        hasSelectedPracticeSong={selectedPracticeSong !== null}
        hasPendingPracticeSong={hasPendingPracticeSong}
        pendingPracticeSongTitle={pendingPracticeSongTitle}
        isPracticePlaying={isPracticePlaying}
        isPracticeSongBuilderActive={practiceSongBuilderDraft !== null}
        practiceSongBuilderTitle={practiceSongBuilderDraft?.title ?? null}
        onScaleChange={setSelectedScale}
        onChordPreviewChange={handleChordPreviewChange}
        onPracticeSongChange={handlePracticeSongChange}
        onPendingPracticeSongTitleChange={handlePendingPracticeSongTitleChange}
        onPendingPracticeSongSubmit={handlePracticeSongBuilderStart}
        onPendingPracticeSongCancel={handlePendingPracticeSongCancel}
        onPracticeSongBuilderTitleChange={handlePracticeSongBuilderTitleChange}
        onPracticeSongBuilderStart={handlePracticeSongBuilderStart}
        onPracticeSongBuilderSave={handlePracticeSongBuilderSave}
        onPracticeSongBuilderCancel={handlePracticeSongBuilderCancel}
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

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to save Practice Song";
}

function shouldIgnorePracticeStepShortcut(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest(
      'input, textarea, select, [role="listbox"], [aria-haspopup="listbox"], [contenteditable="true"]',
    ),
  );
}
