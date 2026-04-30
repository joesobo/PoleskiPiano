import type { AudioEngineStatus } from "../services/pianoAudio";
import type { MidiStatus } from "../services/midi";
import { PITCH_CLASSES, type PitchClass } from "../music/notes";
import { SCALE_MODE_LABELS, type ScaleMode } from "../music/scales";

interface TopBarProps {
  midiStatus: MidiStatus;
  audioStatus: AudioEngineStatus;
  audioMessage: string;
  audioLevel: number;
  selectedTonic: PitchClass;
  selectedMode: ScaleMode;
  onTonicChange: (tonic: PitchClass) => void;
  onModeChange: (mode: ScaleMode) => void;
  onEnableAudio: () => void;
}

export function TopBar({
  midiStatus,
  audioStatus,
  audioMessage,
  audioLevel,
  selectedTonic,
  selectedMode,
  onTonicChange,
  onModeChange,
  onEnableAudio,
}: TopBarProps): React.ReactElement {
  const midiLabel =
    midiStatus.selectedInputName ??
    (midiStatus.supported ? "No MIDI device" : "MIDI unavailable");

  return (
    <header className="top-bar">
      <div className="status-group">
        <StatusDot tone={midiStatus.selectedInputName ? "good" : "warn"} />
        <span className="status-label">{midiLabel}</span>
      </div>

      <div className="status-group audio-status">
        <StatusDot
          tone={
            audioStatus === "ready"
              ? "good"
              : audioStatus === "fallback"
                ? "warn"
                : "idle"
          }
        />
        <button
          className="audio-button"
          type="button"
          onClick={onEnableAudio}
          disabled={
            audioStatus === "loading" ||
            audioStatus === "ready" ||
            audioStatus === "fallback"
          }
        >
          {audioStatus === "ready" || audioStatus === "fallback"
            ? audioMessage
            : "Start audio"}
        </button>
        <div className="level-meter" aria-label="Audio level">
          <span style={{ inlineSize: `${Math.round(audioLevel * 100)}%` }} />
        </div>
      </div>

      <div className="key-controls">
        <span>Key</span>
        <select
          value={selectedTonic}
          onChange={(event) => onTonicChange(event.target.value as PitchClass)}
          aria-label="Selected key"
        >
          {PITCH_CLASSES.map((pitchClass) => (
            <option key={pitchClass} value={pitchClass}>
              {pitchClass}
            </option>
          ))}
        </select>
        <select
          value={selectedMode}
          onChange={(event) => onModeChange(event.target.value as ScaleMode)}
          aria-label="Selected scale mode"
        >
          {Object.entries(SCALE_MODE_LABELS).map(([mode, label]) => (
            <option key={mode} value={mode}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}

function StatusDot({ tone }: { tone: "good" | "warn" | "idle" }): React.ReactElement {
  return <span className={`status-dot status-dot-${tone}`} />;
}
