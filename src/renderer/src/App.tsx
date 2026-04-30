import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChordDisplay } from "./components/ChordDisplay";
import { PianoKeyboard } from "./components/PianoKeyboard";
import { RecentTimeline, type RecentNote } from "./components/RecentTimeline";
import { ScaleWheel } from "./components/ScaleWheel";
import { StaffNotation } from "./components/StaffNotation";
import { TopBar } from "./components/TopBar";
import { analyzeChord } from "./music/chords";
import {
  buildKeyboardRange,
  DEFAULT_HIGH_MIDI,
  DEFAULT_LOW_MIDI,
  midiToNoteName,
  midiToPitchClass,
  pitchClassToSemitone,
  type PitchClass,
} from "./music/notes";
import {
  getScalePitchClasses,
  type ScaleMode,
  type SelectedScale,
} from "./music/scales";
import { connectWebMidi, type MidiNoteEvent, type MidiStatus } from "./services/midi";
import { PianoAudioEngine, type PianoAudioEngineSnapshot } from "./services/pianoAudio";

interface ActiveNote {
  midi: number;
  note: string;
  pitchClass: PitchClass;
  velocity: number;
}

const keyboardKeys = buildKeyboardRange();
const initialMidiStatus: MidiStatus = {
  supported: true,
  permission: "unknown",
  inputs: [],
};

export function App(): React.ReactElement {
  const audioEngineRef = useRef(new PianoAudioEngine());
  const [audioSnapshot, setAudioSnapshot] = useState<PianoAudioEngineSnapshot>(
    audioEngineRef.current.getSnapshot(),
  );
  const [midiStatus, setMidiStatus] = useState<MidiStatus>(initialMidiStatus);
  const [activeNotes, setActiveNotes] = useState<Map<number, ActiveNote>>(
    () => new Map(),
  );
  const [recentNotes, setRecentNotes] = useState<RecentNote[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [selectedScale, setSelectedScale] = useState<SelectedScale>({
    tonic: "C",
    mode: "major",
  });

  const activeMidiNotes = useMemo(
    () => new Set(activeNotes.keys()),
    [activeNotes],
  );
  const activePitchClasses = useMemo(
    () => new Set([...activeNotes.values()].map((note) => note.pitchClass)),
    [activeNotes],
  );
  const chordAnalysis = useMemo(
    () => analyzeChord([...activeNotes.keys()]),
    [activeNotes],
  );
  const scaleMidiNotes = useMemo(
    () => buildScaleMidiSet(selectedScale),
    [selectedScale],
  );

  const handleMidiEvent = useCallback((event: MidiNoteEvent): void => {
    if (event.midi < DEFAULT_LOW_MIDI || event.midi > DEFAULT_HIGH_MIDI) {
      return;
    }

    if (event.type === "noteon") {
      const note = midiToNoteName(event.midi);
      const pitchClass = midiToPitchClass(event.midi);

      audioEngineRef.current.noteOn(event.midi, event.velocity);
      setAudioLevel(event.velocity);
      setActiveNotes((current) => {
        const next = new Map(current);
        next.set(event.midi, {
          midi: event.midi,
          note,
          pitchClass,
          velocity: event.velocity,
        });
        return next;
      });
      setRecentNotes((current) =>
        [
          {
            id: `${event.midi}-${event.receivedAt}-${Math.random()}`,
            note,
            pitchClass,
            velocity: event.velocity,
          },
          ...current,
        ].slice(0, 18),
      );
      return;
    }

    audioEngineRef.current.noteOff(event.midi);
    setActiveNotes((current) => {
      const next = new Map(current);
      next.delete(event.midi);
      return next;
    });
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
    setAudioSnapshot({ status: "loading", message: "Loading piano" });
    setAudioSnapshot(await audioEngineRef.current.initialize());
  }, []);

  return (
    <div className="app-shell">
      <TopBar
        midiStatus={midiStatus}
        audioStatus={audioSnapshot.status}
        audioMessage={audioSnapshot.message}
        audioLevel={audioLevel}
        selectedTonic={selectedScale.tonic}
        selectedMode={selectedScale.mode}
        onTonicChange={(tonic) =>
          setSelectedScale((current) => ({ ...current, tonic }))
        }
        onModeChange={(mode) =>
          setSelectedScale((current) => ({ ...current, mode }))
        }
        onEnableAudio={enableAudio}
      />

      <main className="practice-surface">
        <div className="middle-grid">
          <ScaleWheel
            scale={selectedScale}
            activePitchClasses={activePitchClasses}
          />
          <ChordDisplay analysis={chordAnalysis} />
          <StaffNotation activeMidiNotes={[...activeNotes.keys()]} />
        </div>
        <RecentTimeline notes={recentNotes} />
      </main>

      <PianoKeyboard
        keys={keyboardKeys}
        activeMidiNotes={activeMidiNotes}
        scaleMidiNotes={scaleMidiNotes}
      />
    </div>
  );
}

function buildScaleMidiSet(scale: SelectedScale): Set<number> {
  const scaleSemitones = new Set(
    getScalePitchClasses(scale).map(pitchClassToSemitone),
  );
  const midiNotes = new Set<number>();

  for (let midi = DEFAULT_LOW_MIDI; midi <= DEFAULT_HIGH_MIDI; midi += 1) {
    if (scaleSemitones.has(((midi % 12) + 12) % 12)) {
      midiNotes.add(midi);
    }
  }

  return midiNotes;
}
