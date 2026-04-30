import type { MidiStatus } from "../services/midi";
import { PITCH_CLASSES, type PitchClass } from "../music/notes";
import {
  SCALE_MODE_LABELS,
  SCALE_MODES,
  type ScaleMode,
  type SelectedScale,
} from "../music/scales";

export type ThemeMode = "dark" | "light";

interface TopBarProps {
  midiStatus: MidiStatus;
  audioLevel: number;
  selectedScale: SelectedScale | null;
  themeMode: ThemeMode;
  onScaleChange: (scale: SelectedScale | null) => void;
  onThemeModeChange: (themeMode: ThemeMode) => void;
}

export function TopBar({
  midiStatus,
  audioLevel,
  selectedScale,
  themeMode,
  onScaleChange,
  onThemeModeChange,
}: TopBarProps): React.ReactElement {
  const midiLabel =
    midiStatus.selectedInputName ??
    (midiStatus.supported ? "No MIDI device" : "MIDI unavailable");
  const selectedKey = scaleToKeyValue(selectedScale);
  const nextThemeMode = themeMode === "dark" ? "light" : "dark";

  return (
    <header className="top-bar">
      <div className="status-group">
        <StatusDot tone={midiStatus.selectedInputName ? "good" : "warn"} />
        <span className="status-label">{midiLabel}</span>
      </div>

      <div className="status-group level-status">
        <div className="level-meter" aria-label="Audio level">
          <span style={{ inlineSize: `${Math.round(audioLevel * 100)}%` }} />
        </div>
      </div>

      <div className="key-controls">
        <span>Key</span>
        <select
          value={selectedKey}
          onChange={(event) => onScaleChange(keyValueToScale(event.target.value))}
          aria-label="Selected key"
        >
          <option value="none">None</option>
          {PITCH_CLASSES.flatMap((pitchClass) =>
            SCALE_MODES.map((mode) => (
              <option key={`${pitchClass}:${mode}`} value={`${pitchClass}:${mode}`}>
                {pitchClass} {SCALE_MODE_LABELS[mode].toLowerCase()}
              </option>
            )),
          )}
        </select>
        <button
          className="theme-toggle"
          type="button"
          aria-label={`Switch to ${nextThemeMode} mode`}
          aria-pressed={themeMode === "light"}
          onClick={() => onThemeModeChange(nextThemeMode)}
        >
          <span className="theme-toggle-track">
            <span className="theme-toggle-thumb" />
          </span>
          <span className="theme-toggle-label">
            {themeMode === "dark" ? "Dark" : "Light"}
          </span>
        </button>
      </div>
    </header>
  );
}

function StatusDot({ tone }: { tone: "good" | "warn" }): React.ReactElement {
  return <span className={`status-dot status-dot-${tone}`} />;
}

function scaleToKeyValue(scale: SelectedScale | null): string {
  return scale ? `${scale.tonic}:${scale.mode}` : "none";
}

function keyValueToScale(value: string): SelectedScale | null {
  if (value === "none") {
    return null;
  }

  const [tonic, mode] = value.split(":");
  return {
    tonic: tonic as PitchClass,
    mode: mode as ScaleMode,
  };
}
