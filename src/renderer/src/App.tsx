import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import {
  ChordDisplay,
  type ChordDisplayPreview,
} from "./components/ChordDisplay";
import {
  FallingNotesPanel,
  type FallingNoteFeedbackEvent,
} from "./components/FallingNotesPanel";
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
  movePracticeSongDraftTarget,
  preparePracticeSongDraftForSave,
  setPracticeSongDraftError,
  setPracticeSongDraftTitle,
  togglePracticeSongDraftMidi,
  type PracticeSongDraft,
} from "./music/practiceSongBuilder";
import {
  createPracticeSongOptions,
  type PracticeTarget,
  type PracticeTargetNote,
  type PracticeSong,
} from "./music/practiceSongs";
import {
  getScalePitchClasses,
  type SelectedScale,
} from "./music/scales";
import { groupTimedMidiNotesForStaff } from "./music/staff";
import {
  clampPracticeSpeedPercent,
  activeMidiNotesMatchGuidedTargetAtHitLine,
  activeMidiNotesMatchGuidedTargetInput,
  getGuidedCompletionResult,
  getInitialFallingPlayheadBeat,
  getGuidedInputTargetIndex,
  getPerformanceScore,
  getSongEndBeat,
  getSongLeadInBeats,
  getTargetIndexForPlayhead,
  markMissedPerformanceTargets,
  PRACTICE_SPEED_DEFAULT_PERCENT,
  PRACTICE_SPEED_STEP_PERCENT,
  scorePerformanceInput,
  type PracticeRunMode,
  type PracticeTargetResults,
} from "./music/fallingNotes";
import {
  RANDOM_SCALE_CHORD_PRACTICE_ID,
  createRandomScaleChordPracticeSeed,
  createRandomScaleChordPracticeSongOption,
  getNextRandomScaleChordPracticeSeed,
} from "./music/randomScaleChordPractice";
import {
  createInitialPanelManagerState,
  setPanelVisibility,
  togglePanel,
} from "./panelManager";
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
import {
  PANEL_DEFINITIONS,
  type PanelDefinition,
  type PanelId,
} from "../../shared/panels";

const keyboardKeys = buildKeyboardRange();
const SCREEN_INPUT_VELOCITY = 0.5;
const PLAYBACK_END_PADDING_BEATS = 0.25;
const initialMidiStatus: MidiStatus = {
  supported: true,
  permission: "unknown",
  inputs: [],
};
const initialPracticeState = {
  song: null as PracticeSong | null,
  targetIndex: 0,
  isPlaying: false,
  runMode: "guided" as PracticeRunMode,
  playheadBeat: 0,
  waitingTargetIndex: null as number | null,
};

export function App(): React.ReactElement {
  const audioEngineRef = useRef(new PianoAudioEngine());
  const activeInputStateRef = useRef(createActiveInputState());
  const practiceStateRef = useRef(initialPracticeState);
  const practiceSongBuilderDraftRef = useRef<PracticeSongDraft | null>(null);
  const panelContextMenuRef = useRef<HTMLDivElement | null>(null);
  const playbackFrameRef = useRef<number | null>(null);
  const fallingPlayheadBeatRef = useRef(0);
  const guidedCompletedTargetIdsRef = useRef<ReadonlySet<string>>(new Set());
  const performanceTargetResultsRef = useRef<PracticeTargetResults>({});
  const fallingFeedbackSequenceRef = useRef(0);
  const fallingFeedbackTimeoutsRef = useRef<number[]>([]);
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
  const [randomChordPracticeSeed, setRandomChordPracticeSeed] = useState(
    createRandomScaleChordPracticeSeed,
  );
  const [selectedPracticeSongId, setSelectedPracticeSongId] = useState(
    NONE_PRACTICE_SONG_ID,
  );
  const [pendingPracticeSongTitle, setPendingPracticeSongTitle] = useState("");
  const [practiceSongBuilderDraft, setPracticeSongBuilderDraft] =
    useState<PracticeSongDraft | null>(null);
  const [practiceTargetIndex, setPracticeTargetIndex] = useState(0);
  const [isPracticePlaying, setIsPracticePlaying] = useState(false);
  const [practiceRunMode, setPracticeRunMode] =
    useState<PracticeRunMode>("guided");
  const [practiceSpeedPercent, setPracticeSpeedPercent] = useState(
    PRACTICE_SPEED_DEFAULT_PERCENT,
  );
  const [fallingPlayheadBeat, setFallingPlayheadBeat] = useState(0);
  const [guidedWaitingTargetIndex, setGuidedWaitingTargetIndex] =
    useState<number | null>(null);
  const [guidedCompletedTargetIds, setGuidedCompletedTargetIds] = useState<
    ReadonlySet<string>
  >(new Set());
  const [performanceTargetResults, setPerformanceTargetResults] =
    useState<PracticeTargetResults>({});
  const [fallingFeedbackEvents, setFallingFeedbackEvents] = useState<
    FallingNoteFeedbackEvent[]
  >([]);
  const [panelManagerState, setPanelManagerState] = useState(
    createInitialPanelManagerState,
  );
  const [panelContextMenuPosition, setPanelContextMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const [screenInputResetKey, setScreenInputResetKey] = useState(0);
  const activeNotes = activeInputState.notes;
  const panelVisibility = panelManagerState.visibility;
  const visiblePracticeSongOptions = useMemo(
    () => [
      createRandomScaleChordPracticeSongOption(
        selectedScale,
        randomChordPracticeSeed,
      ),
      ...practiceSongOptions,
    ],
    [practiceSongOptions, randomChordPracticeSeed, selectedScale],
  );
  const selectedPracticeSong = useMemo(() => {
    const option = visiblePracticeSongOptions.find(
      (practiceSongOption) =>
        practiceSongOption.id === selectedPracticeSongId &&
        practiceSongOption.status === "valid",
    );

    return option?.status === "valid" ? option.song : null;
  }, [selectedPracticeSongId, visiblePracticeSongOptions]);
  const hasPendingPracticeSong =
    selectedPracticeSongId === PENDING_PRACTICE_SONG_ID;
  const currentPracticeTarget = selectedPracticeSong
    ? selectedPracticeSong.targets[practiceTargetIndex] ?? null
    : null;
  const practiceTargetPosition = selectedPracticeSong
    ? {
        current: practiceTargetIndex + 1,
        total: selectedPracticeSong.targets.length,
      }
    : null;
  const fallingLeadInBeats = useMemo(
    () => getSongLeadInBeats(selectedPracticeSong),
    [selectedPracticeSong],
  );
  const performanceScore = useMemo(
    () =>
      selectedPracticeSong
        ? getPerformanceScore(
            performanceTargetResults,
            selectedPracticeSong.targets.length,
          )
        : null,
    [performanceTargetResults, selectedPracticeSong],
  );
  const guidedWaitingTarget =
    selectedPracticeSong && guidedWaitingTargetIndex !== null
      ? selectedPracticeSong.targets[guidedWaitingTargetIndex] ?? null
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
        : currentPracticeTarget?.midiNotes ??
          selectedChordPreview?.midiNotes ??
          [],
    [
      currentPracticeTarget,
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
          kicker: "Notation Builder",
          name: practiceSongBuilderDraft.title.trim() || "Untitled song",
          targetCount: `${practiceSongBuilderDraft.targetIndex + 1}/${practiceSongBuilderDraft.targets.length}`,
          notes: practiceSongBuilderNotes,
          message: practiceSongBuilderDraft.error,
        };
      }

      return buildChordDisplayPreview(
        selectedPracticeSong,
        currentPracticeTarget,
        practiceTargetPosition,
        selectedChordPreview,
      );
    },
    [
      currentPracticeTarget,
      practiceTargetPosition,
      practiceSongBuilderDraft,
      practiceSongBuilderNotes,
      selectedChordPreview,
      selectedPracticeSong,
    ],
  );
  const fallingPreviewTarget = useMemo(
    () =>
      selectedPracticeSong || practiceSongBuilderDraft
        ? null
        : buildChordPreviewPracticeTarget(selectedChordPreview),
    [practiceSongBuilderDraft, selectedChordPreview, selectedPracticeSong],
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
  const triggerFallingNoteFeedback = useCallback(
    (target: PracticeTarget): void => {
      const feedbackEvents = target.notes.map((note) => {
        const id = `${target.id}:${note.midi}:${fallingFeedbackSequenceRef.current}`;
        fallingFeedbackSequenceRef.current += 1;

        return {
          id,
          midi: note.midi,
          label: note.label,
          pitchClass: note.pitchClass,
        };
      });

      if (feedbackEvents.length === 0) {
        return;
      }

      setFallingFeedbackEvents((events) => [...events, ...feedbackEvents]);

      const timeout = window.setTimeout(() => {
        const feedbackEventIds = new Set(feedbackEvents.map((event) => event.id));

        setFallingFeedbackEvents((events) =>
          events.filter((event) => !feedbackEventIds.has(event.id)),
        );
      }, 720);

      fallingFeedbackTimeoutsRef.current.push(timeout);
    },
    [],
  );
  const completeGuidedTarget = useCallback(
    (
      practiceSong: PracticeSong,
      targetIndex: number,
      target: PracticeTarget,
    ): void => {
      setGuidedCompletedTargetIds((completedTargetIds) => {
        if (completedTargetIds.has(target.id)) {
          return completedTargetIds;
        }

        const nextCompletedTargetIds = new Set(completedTargetIds);
        nextCompletedTargetIds.add(target.id);
        guidedCompletedTargetIdsRef.current = nextCompletedTargetIds;
        return nextCompletedTargetIds;
      });
      setGuidedWaitingTargetIndex(null);
      triggerFallingNoteFeedback(target);
      const completionResult = getGuidedCompletionResult(
        practiceSong,
        targetIndex,
      );

      if (completionResult.kind === "finish") {
        setPracticeTargetIndex(completionResult.nextTargetIndex);
        return;
      }

      setPracticeTargetIndex(completionResult.nextTargetIndex);
    },
    [triggerFallingNoteFeedback],
  );
  const handlePracticeRunInput = useCallback(
    (transition: ActiveInputTransition): void => {
      const practiceState = practiceStateRef.current;

      if (
        practiceSongBuilderDraftRef.current ||
        transition.state.source !== "midi" ||
        (transition.noteOns.length === 0 && transition.noteOffs.length === 0)
      ) {
        return;
      }

      const practiceSong = practiceState.song;

      if (!practiceSong || !practiceState.isPlaying) {
        return;
      }

      if (practiceState.runMode === "performance") {
        if (transition.noteOns.length === 0) {
          return;
        }

        const nextResults = scorePerformanceInput(
          practiceSong,
          practiceState.playheadBeat,
          transition.state.notes.keys(),
          performanceTargetResultsRef.current,
        );
        const hitTargets = getNewlyHitPerformanceTargets(
          practiceSong,
          performanceTargetResultsRef.current,
          nextResults,
        );

        for (const target of hitTargets) {
          triggerFallingNoteFeedback(target);
        }

        performanceTargetResultsRef.current = nextResults;
        setPerformanceTargetResults(nextResults);
        return;
      }

      const waitingTargetIndex = getGuidedInputTargetIndex(
        practiceSong,
        practiceState.targetIndex,
        practiceState.playheadBeat,
        practiceState.waitingTargetIndex,
        guidedCompletedTargetIdsRef.current,
      );

      if (waitingTargetIndex === null) {
        return;
      }

      const expectedTarget = practiceSong.targets[waitingTargetIndex];

      if (
        expectedTarget &&
        activeMidiNotesMatchGuidedTargetInput(
          transition.state.notes,
          transition.noteOns,
          expectedTarget,
        )
      ) {
        completeGuidedTarget(
          practiceSong,
          waitingTargetIndex,
          expectedTarget,
        );
      }
    },
    [completeGuidedTarget, triggerFallingNoteFeedback],
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
        handlePracticeRunInput(transition);

        if (previousSource === "screen") {
          setScreenInputResetKey((resetKey) => resetKey + 1);
        }

        return;
      }

      const transition = applyMidiNoteOff(activeInputStateRef.current, midi);

      applyInputTransition(transition);
      handlePracticeRunInput(transition);
    },
    [applyInputTransition, handlePracticeRunInput, togglePracticeSongBuilderNote],
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
  const resetPracticeRunState = useCallback((song: PracticeSong | null): void => {
    const emptyCompletedTargetIds = new Set<string>();
    const emptyTargetResults: PracticeTargetResults = {};

    guidedCompletedTargetIdsRef.current = emptyCompletedTargetIds;
    performanceTargetResultsRef.current = emptyTargetResults;
    setFallingPlayheadBeat(getInitialFallingPlayheadBeat(song));
    setGuidedWaitingTargetIndex(null);
    setGuidedCompletedTargetIds(emptyCompletedTargetIds);
    setPerformanceTargetResults(emptyTargetResults);
    setFallingFeedbackEvents([]);
  }, []);
  const seekPracticeTarget = useCallback(
    (targetIndex: number): void => {
      setGuidedWaitingTargetIndex(null);
      setPerformanceTargetResults({});

      if (!selectedPracticeSong) {
        setPracticeTargetIndex(0);
        setFallingPlayheadBeat(getInitialFallingPlayheadBeat(null));
        return;
      }

      const nextTargetIndex = clamp(
        targetIndex,
        0,
        selectedPracticeSong.targets.length - 1,
      );
      const target = selectedPracticeSong.targets[nextTargetIndex];

      setPracticeTargetIndex(nextTargetIndex);
      setFallingPlayheadBeat(
        target
          ? Math.max(
              getInitialFallingPlayheadBeat(selectedPracticeSong),
              target.startBeat - fallingLeadInBeats,
            )
          : getInitialFallingPlayheadBeat(selectedPracticeSong),
      );
    },
    [fallingLeadInBeats, selectedPracticeSong],
  );
  const handlePracticeSongChange = useCallback(
    (practiceSongId: string): void => {
      setSelectedPracticeSongId(practiceSongId);
      setPendingPracticeSongTitle("");
      setPracticeTargetIndex(0);
      setIsPracticePlaying(false);

      if (practiceSongId === PENDING_PRACTICE_SONG_ID) {
        setSelectedChordPreview(null);
        return;
      }

      if (practiceSongId === NONE_PRACTICE_SONG_ID) {
        return;
      }

      const option = visiblePracticeSongOptions.find(
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
    [visiblePracticeSongOptions],
  );
  const handlePendingPracticeSongTitleChange = useCallback(
    (title: string): void => {
      setPendingPracticeSongTitle(title);
      setIsPracticePlaying(false);
      setSelectedPracticeSongId(PENDING_PRACTICE_SONG_ID);
      setSelectedChordPreview(null);
      setPracticeTargetIndex(0);
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
      setPracticeTargetIndex(0);
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
        draft ? movePracticeSongDraftTarget(draft, "previous") : draft,
      );
      return;
    }

    seekPracticeTarget(practiceStateRef.current.targetIndex - 1);
  }, [seekPracticeTarget]);
  const handlePracticeNext = useCallback((): void => {
    if (practiceSongBuilderDraftRef.current) {
      setPracticeSongBuilderDraft((draft) =>
        draft ? movePracticeSongDraftTarget(draft, "next") : draft,
      );
      return;
    }

    seekPracticeTarget(practiceStateRef.current.targetIndex + 1);
  }, [seekPracticeTarget]);
  const handlePracticeRestart = useCallback((): void => {
    setPracticeTargetIndex(0);
    resetPracticeRunState(selectedPracticeSong);
  }, [resetPracticeRunState, selectedPracticeSong]);
  const handlePracticeRunModeChange = useCallback(
    (runMode: PracticeRunMode): void => {
      setPracticeRunMode(runMode);
      setPracticeTargetIndex(0);
      setIsPracticePlaying(false);
      resetPracticeRunState(selectedPracticeSong);
    },
    [resetPracticeRunState, selectedPracticeSong],
  );
  const handlePracticeSpeedPercentChange = useCallback(
    (speedPercent: number): void => {
      setPracticeSpeedPercent(clampPracticeSpeedPercent(speedPercent));
    },
    [],
  );
  const handlePracticePlayingChange = useCallback(
    (nextIsPlaying: boolean): void => {
      if (nextIsPlaying && selectedPracticeSong) {
        if (selectedPracticeSongId === RANDOM_SCALE_CHORD_PRACTICE_ID) {
          setRandomChordPracticeSeed((seed) =>
            getNextRandomScaleChordPracticeSeed(seed),
          );
          setPracticeTargetIndex(0);
        }

        const playbackEndBeat =
          getSongEndBeat(selectedPracticeSong) + PLAYBACK_END_PADDING_BEATS;

        if (fallingPlayheadBeatRef.current >= playbackEndBeat) {
          setPracticeTargetIndex(0);
          resetPracticeRunState(selectedPracticeSong);
        }
      }

      setIsPracticePlaying(nextIsPlaying);
    },
    [resetPracticeRunState, selectedPracticeSong, selectedPracticeSongId],
  );
  const handlePracticeSongBuilderStart = useCallback((): void => {
    setIsPracticePlaying(false);
    setSelectedChordPreview(null);

    if (selectedPracticeSong) {
      setPracticeSongBuilderDraft(
        createPracticeSongDraftFromSong(selectedPracticeSong, practiceTargetIndex),
      );
      return;
    }

    if (pendingPracticeSongTitle.trim().length > 0) {
      setPracticeSongBuilderDraft(
        createNewPracticeSongDraft(pendingPracticeSongTitle),
      );
    }
  }, [pendingPracticeSongTitle, practiceTargetIndex, selectedPracticeSong]);
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

    const { targetIndex, ...request } = saveResult.request;

    try {
      const response = await savePracticeSongFile(request);
      const nextOptions = createPracticeSongOptions(response.files);

      setPracticeSongOptions(nextOptions);
      setPracticeSongBuilderDraft(null);
      setPendingPracticeSongTitle("");
      setSelectedPracticeSongId(response.path);
      setPracticeTargetIndex(targetIndex);
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
  const handlePanelToggle = useCallback((panelId: PanelId): void => {
    setPanelManagerState((state) => togglePanel(state, panelId));
  }, []);
  const handlePanelVisibilityChange = useCallback(
    (panelId: PanelId, isVisible: boolean): void => {
      setPanelManagerState((state) =>
        setPanelVisibility(state, panelId, isVisible),
      );
    },
    [],
  );
  const handlePanelContextMenu = useCallback(
    (event: ReactMouseEvent<HTMLElement>): void => {
      event.preventDefault();
      setPanelContextMenuPosition({
        x: Math.min(event.clientX, window.innerWidth - 232),
        y: Math.min(event.clientY, window.innerHeight - 226),
      });
    },
    [],
  );

  useEffect(() => {
    practiceStateRef.current = {
      song: selectedPracticeSong,
      targetIndex: practiceTargetIndex,
      isPlaying: isPracticePlaying,
      runMode: practiceRunMode,
      playheadBeat: fallingPlayheadBeat,
      waitingTargetIndex: guidedWaitingTargetIndex,
    };
  }, [
    fallingPlayheadBeat,
    guidedWaitingTargetIndex,
    isPracticePlaying,
    practiceRunMode,
    practiceTargetIndex,
    selectedPracticeSong,
  ]);

  useEffect(() => {
    fallingPlayheadBeatRef.current = fallingPlayheadBeat;
  }, [fallingPlayheadBeat]);

  useEffect(() => {
    guidedCompletedTargetIdsRef.current = guidedCompletedTargetIds;
  }, [guidedCompletedTargetIds]);

  useEffect(() => {
    performanceTargetResultsRef.current = performanceTargetResults;
  }, [performanceTargetResults]);

  useEffect(() => {
    resetPracticeRunState(selectedPracticeSong);
  }, [resetPracticeRunState, selectedPracticeSong]);

  useEffect(() => {
    practiceSongBuilderDraftRef.current = practiceSongBuilderDraft;
  }, [practiceSongBuilderDraft]);

  useEffect(() => {
    return () => {
      for (const timeout of fallingFeedbackTimeoutsRef.current) {
        window.clearTimeout(timeout);
      }
      fallingFeedbackTimeoutsRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!isPracticePlaying || !selectedPracticeSong) {
      if (playbackFrameRef.current !== null) {
        window.cancelAnimationFrame(playbackFrameRef.current);
        playbackFrameRef.current = null;
      }
      return;
    }

    let lastFrameAt = performance.now();

    const tick = (frameAt: number): void => {
      const elapsedSeconds = Math.max(0, (frameAt - lastFrameAt) / 1000);
      lastFrameAt = frameAt;
      const practiceState = practiceStateRef.current;
      const song = practiceState.song;

      if (!song || !practiceState.isPlaying) {
        playbackFrameRef.current = null;
        return;
      }

      if (
        practiceState.runMode === "guided" &&
        practiceState.waitingTargetIndex !== null
      ) {
        playbackFrameRef.current = window.requestAnimationFrame(tick);
        return;
      }

      const beatsPerSecond =
        (song.tempoBpm * (practiceSpeedPercent / 100)) / 60;
      const beatAdvance = elapsedSeconds * beatsPerSecond;
      const currentPlayheadBeat = fallingPlayheadBeatRef.current;
      let nextPlayheadBeat = currentPlayheadBeat + beatAdvance;

      if (practiceState.runMode === "guided") {
        const nextTarget = song.targets[practiceState.targetIndex];
        const isTargetCompleted =
          nextTarget &&
          guidedCompletedTargetIdsRef.current.has(nextTarget.id);

        if (
          nextTarget &&
          !isTargetCompleted &&
          currentPlayheadBeat <= nextTarget.startBeat &&
          nextPlayheadBeat >= nextTarget.startBeat
        ) {
          nextPlayheadBeat = nextTarget.startBeat;

          if (
            activeMidiNotesMatchGuidedTargetAtHitLine(
              activeInputStateRef.current.notes,
              nextTarget,
              frameAt,
            )
          ) {
            completeGuidedTarget(
              song,
              practiceState.targetIndex,
              nextTarget,
            );
          } else {
            setGuidedWaitingTargetIndex(practiceState.targetIndex);
          }
        }
      } else {
        const nextResults = markMissedPerformanceTargets(
          song,
          nextPlayheadBeat,
          performanceTargetResultsRef.current,
        );

        if (nextResults !== performanceTargetResultsRef.current) {
          performanceTargetResultsRef.current = nextResults;
          setPerformanceTargetResults(nextResults);
        }

        setPracticeTargetIndex(
          getTargetIndexForPlayhead(song, nextPlayheadBeat),
        );
      }

      const playbackEndBeat =
        getSongEndBeat(song) + PLAYBACK_END_PADDING_BEATS;

      if (nextPlayheadBeat >= playbackEndBeat) {
        nextPlayheadBeat = playbackEndBeat;
        setIsPracticePlaying(false);
      }

      fallingPlayheadBeatRef.current = nextPlayheadBeat;
      setFallingPlayheadBeat(nextPlayheadBeat);

      playbackFrameRef.current = window.requestAnimationFrame(tick);
    };

    playbackFrameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (playbackFrameRef.current !== null) {
        window.cancelAnimationFrame(playbackFrameRef.current);
        playbackFrameRef.current = null;
      }
    };
  }, [
    completeGuidedTarget,
    isPracticePlaying,
    practiceRunMode,
    practiceSpeedPercent,
    selectedPracticeSong,
  ]);

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
    return window.poleskiPiano?.onPanelToggle?.(handlePanelToggle);
  }, [handlePanelToggle]);

  useEffect(() => {
    window.poleskiPiano?.setPanelVisibility?.(panelVisibility);
  }, [panelVisibility]);

  useEffect(() => {
    if (!panelContextMenuPosition) {
      return;
    }

    const closeMenuOnOutsidePointer = (event: PointerEvent): void => {
      const target = event.target;

      if (
        target instanceof Node &&
        panelContextMenuRef.current?.contains(target)
      ) {
        return;
      }

      setPanelContextMenuPosition(null);
    };
    const closeMenuOnEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setPanelContextMenuPosition(null);
      }
    };

    window.addEventListener("pointerdown", closeMenuOnOutsidePointer);
    window.addEventListener("keydown", closeMenuOnEscape);

    return () => {
      window.removeEventListener("pointerdown", closeMenuOnOutsidePointer);
      window.removeEventListener("keydown", closeMenuOnEscape);
    };
  }, [panelContextMenuPosition]);

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
        shouldIgnorePracticeTargetShortcut(event.target)
      ) {
        return;
      }

      const canNavigatePracticeTargets =
        practiceSongBuilderDraft !== null || selectedPracticeSong !== null;

      if (!canNavigatePracticeTargets) {
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
        practiceSongOptions={visiblePracticeSongOptions}
        selectedPracticeSongId={selectedPracticeSongId}
        hasSelectedPracticeSong={selectedPracticeSong !== null}
        hasPendingPracticeSong={hasPendingPracticeSong}
        pendingPracticeSongTitle={pendingPracticeSongTitle}
        isPracticePlaying={isPracticePlaying}
        practiceRunMode={practiceRunMode}
        practiceTempoBpm={selectedPracticeSong?.tempoBpm ?? null}
        practiceSpeedPercent={practiceSpeedPercent}
        practiceSpeedStepPercent={PRACTICE_SPEED_STEP_PERCENT}
        performanceScore={performanceScore}
        isPracticeSongBuilderActive={practiceSongBuilderDraft !== null}
        practiceSongBuilderTitle={practiceSongBuilderDraft?.title ?? null}
        themeMode={themeMode}
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
        onPracticeRunModeChange={handlePracticeRunModeChange}
        onPracticeSpeedPercentChange={handlePracticeSpeedPercentChange}
        onPracticePlayingChange={handlePracticePlayingChange}
        onThemeModeChange={setThemeMode}
      />

      <main className="practice-surface">
        <div className="middle-grid">
          {panelVisibility.scale ? (
            <PanelFrame
              definition={getPanelDefinition("scale")}
              onContextMenu={handlePanelContextMenu}
            >
              <ScaleWheel
                scale={selectedScale}
                activePitchClasses={activePitchClasses}
                onPitchClassInputStart={handleScalePitchClassStart}
                onInputStop={handleScreenNoteStop}
                inputResetKey={screenInputResetKey}
              />
            </PanelFrame>
          ) : null}
          {panelVisibility.chord ? (
            <PanelFrame
              definition={getPanelDefinition("chord")}
              onContextMenu={handlePanelContextMenu}
            >
              <ChordDisplay
                analysis={chordAnalysis}
                preview={chordDisplayPreview}
              />
            </PanelFrame>
          ) : null}
          {panelVisibility.staff ? (
            <PanelFrame
              definition={getPanelDefinition("staff")}
              onContextMenu={handlePanelContextMenu}
            >
              <StaffNotation
                activeMidiNotes={orderedActiveMidiNotes}
                activeMidiNoteGroups={activeMidiNoteGroups}
                previewMidiNotes={previewMidiNotes}
                onNoteInputStart={handleScreenNoteStart}
                onInputStop={handleScreenNoteStop}
                inputResetKey={screenInputResetKey}
              />
            </PanelFrame>
          ) : null}
          {panelVisibility.fallingNotes ? (
            <PanelFrame
              definition={getPanelDefinition("fallingNotes")}
              onContextMenu={handlePanelContextMenu}
            >
              <FallingNotesPanel
                song={selectedPracticeSong}
                previewTarget={fallingPreviewTarget}
                keys={keyboardKeys}
                playheadBeat={fallingPlayheadBeat}
                leadInBeats={fallingLeadInBeats}
                waitingTargetId={guidedWaitingTarget?.id ?? null}
                feedbackEvents={fallingFeedbackEvents}
              />
            </PanelFrame>
          ) : null}
        </div>
        {panelContextMenuPosition ? (
          <div
            ref={panelContextMenuRef}
            aria-label="Panels"
            className="panel-context-menu"
            role="menu"
            style={{
              insetBlockStart: panelContextMenuPosition.y,
              insetInlineStart: panelContextMenuPosition.x,
            }}
            onContextMenu={(event) => event.preventDefault()}
          >
            {PANEL_DEFINITIONS.map((definition) => (
              <label
                className="panel-context-option"
                key={definition.id}
                role="menuitemcheckbox"
                aria-checked={panelVisibility[definition.id]}
              >
                <input
                  type="checkbox"
                  checked={panelVisibility[definition.id]}
                  onChange={(event) =>
                    handlePanelVisibilityChange(
                      definition.id,
                      event.currentTarget.checked,
                    )
                  }
                />
                <span>{definition.label}</span>
              </label>
            ))}
          </div>
        ) : null}
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

interface PanelFrameProps {
  definition: PanelDefinition;
  onContextMenu: (event: ReactMouseEvent<HTMLElement>) => void;
  children: ReactNode;
}

function PanelFrame({
  definition,
  onContextMenu,
  children,
}: PanelFrameProps): React.ReactElement {
  return (
    <div
      className={`panel-frame panel-frame-${definition.id}`}
      style={{
        gridColumn: `${definition.slot + 1} / span ${definition.size}`,
      }}
      onContextMenu={onContextMenu}
    >
      {children}
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
  practiceTarget: PracticeTarget | null,
  practiceTargetPosition: { current: number; total: number } | null,
  chordPreview: ChordPreview | null,
): ChordDisplayPreview | null {
  if (practiceSong && practiceTarget && practiceTargetPosition) {
    const primaryChordGroup = practiceTarget.chordGroups[0] ?? null;
    const chordToneMidiNotes = new Set(primaryChordGroup?.midiNotes ?? []);

    return {
      kind: "practice",
      kicker: "Practice",
      name: practiceSong.title,
      targetCount: `${practiceTargetPosition.current}/${practiceTargetPosition.total}`,
      targetName:
        primaryChordGroup?.name ??
        (practiceTarget.midiNotes.length > 1 ? practiceTarget.label : null),
      colorPitchClass: primaryChordGroup?.root ?? practiceTarget.notes[0]?.pitchClass,
      notes: practiceTarget.notes.map((note) => ({
        ...note,
        isChordTone: primaryChordGroup
          ? chordToneMidiNotes.has(note.midi)
          : undefined,
      })),
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

function buildChordPreviewPracticeTarget(
  chordPreview: ChordPreview | null,
): PracticeTarget | null {
  if (!chordPreview) {
    return null;
  }

  const notes: PracticeTargetNote[] = chordPreview.midiNotes.map((midi) => ({
    midi,
    label: midiToNoteName(midi),
    pitchClass: midiToPitchClass(midi),
  }));

  return {
    id: "chord-preview-target",
    label: notes.map((note) => note.label).join(" + "),
    chordName: chordPreview.label,
    chordGroups: [
      {
        name: chordPreview.label,
        root: chordPreview.root,
        midiNotes: notes.map((note) => note.midi),
        notes,
      },
    ],
    startBeat: 0,
    durationBeats: 1,
    measureNumber: "preview",
    midiNotes: notes.map((note) => note.midi),
    notes,
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to save Practice Song";
}

function shouldIgnorePracticeTargetShortcut(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest(
      'input, textarea, select, [role="listbox"], [aria-haspopup="listbox"], [contenteditable="true"]',
    ),
  );
}

function getPanelDefinition(panelId: PanelId): PanelDefinition {
  const definition = PANEL_DEFINITIONS.find(
    (panelDefinition) => panelDefinition.id === panelId,
  );

  if (!definition) {
    throw new Error(`Unknown panel: ${panelId}`);
  }

  return definition;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function getNewlyHitPerformanceTargets(
  song: PracticeSong,
  previousResults: PracticeTargetResults,
  nextResults: PracticeTargetResults,
): PracticeTarget[] {
  return song.targets.filter(
    (target) =>
      previousResults[target.id] !== "hit" && nextResults[target.id] === "hit",
  );
}
