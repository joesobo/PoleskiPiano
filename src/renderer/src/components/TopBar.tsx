import { useEffect, useRef, useState, type RefObject } from "react";
import type { MidiStatus } from "../services/midi";
import {
  getChordPreviewByValue,
  getChordPreviewOptions,
  type ChordPreview,
} from "../music/chordPreview";
import { noteCssVars } from "../music/colors";
import { PITCH_CLASSES, type PitchClass } from "../music/notes";
import {
  SCALE_MODE_LABELS,
  SCALE_MODES,
  type ScaleMode,
  type SelectedScale,
} from "../music/scales";
import type { PerformanceScore, PracticeRunMode } from "../music/fallingNotes";
import type { PracticeSongOption } from "../music/practiceSongs";

export type ThemeMode = "dark" | "light";
export const NONE_PRACTICE_SONG_ID = "none";
export const PENDING_PRACTICE_SONG_ID = "pending-practice-song";
export const PRACTICE_SONG_CONTROL_ICONS = {
  previousStep: "←",
  play: "▶",
  pause: "⏸",
  nextStep: "→",
  restart: "↺",
  edit: "✎",
  save: "✓",
  cancel: "×",
} as const;
export const THEME_MODE_ICONS = {
  light: "☀",
  dark: "☾",
} as const;

export function getNextThemeMode(themeMode: ThemeMode): ThemeMode {
  return themeMode === "dark" ? "light" : "dark";
}

interface TopBarProps {
  midiStatus: MidiStatus;
  audioLevel: number;
  selectedScale: SelectedScale | null;
  selectedChordPreview: ChordPreview | null;
  practiceSongOptions: PracticeSongOption[];
  selectedPracticeSongId: string;
  hasSelectedPracticeSong: boolean;
  hasPendingPracticeSong: boolean;
  pendingPracticeSongTitle: string;
  isPracticePlaying: boolean;
  practiceRunMode: PracticeRunMode;
  practiceTempoBpm: number | null;
  practiceSpeedPercent: number;
  practiceSpeedStepPercent: number;
  performanceScore: PerformanceScore | null;
  isPracticeSongBuilderActive: boolean;
  practiceSongBuilderTitle: string | null;
  themeMode: ThemeMode;
  onScaleChange: (scale: SelectedScale | null) => void;
  onChordPreviewChange: (preview: ChordPreview | null) => void;
  onPracticeSongChange: (practiceSongId: string) => void;
  onPendingPracticeSongTitleChange: (title: string) => void;
  onPendingPracticeSongSubmit: () => void;
  onPendingPracticeSongCancel: () => void;
  onPracticeSongBuilderTitleChange: (title: string) => void;
  onPracticeSongBuilderStart: () => void;
  onPracticeSongBuilderSave: () => void;
  onPracticeSongBuilderCancel: () => void;
  onPracticeBack: () => void;
  onPracticeNext: () => void;
  onPracticeRestart: () => void;
  onPracticeRunModeChange: (runMode: PracticeRunMode) => void;
  onPracticeSpeedPercentChange: (speedPercent: number) => void;
  onPracticePlayingChange: (isPlaying: boolean) => void;
  onThemeModeChange: (themeMode: ThemeMode) => void;
}

export function TopBar({
  midiStatus,
  audioLevel,
  selectedScale,
  selectedChordPreview,
  practiceSongOptions,
  selectedPracticeSongId,
  hasSelectedPracticeSong,
  hasPendingPracticeSong,
  pendingPracticeSongTitle,
  isPracticePlaying,
  practiceRunMode,
  practiceTempoBpm,
  practiceSpeedPercent,
  practiceSpeedStepPercent,
  performanceScore,
  isPracticeSongBuilderActive,
  practiceSongBuilderTitle,
  themeMode,
  onScaleChange,
  onChordPreviewChange,
  onPracticeSongChange,
  onPendingPracticeSongTitleChange,
  onPendingPracticeSongSubmit,
  onPendingPracticeSongCancel,
  onPracticeSongBuilderTitleChange,
  onPracticeSongBuilderStart,
  onPracticeSongBuilderSave,
  onPracticeSongBuilderCancel,
  onPracticeBack,
  onPracticeNext,
  onPracticeRestart,
  onPracticeRunModeChange,
  onPracticeSpeedPercentChange,
  onPracticePlayingChange,
  onThemeModeChange,
}: TopBarProps): React.ReactElement {
  const midiLabel =
    midiStatus.selectedInputName ??
    (midiStatus.supported ? "No MIDI device" : "MIDI unavailable");
  const chordPreviewOptions = getChordPreviewOptions(selectedScale);
  const hasSelectedScale = selectedScale !== null;
  const hasActionRow =
    isPracticeSongBuilderActive ||
    hasSelectedPracticeSong ||
    hasPendingPracticeSong;

  return (
    <header className="top-bar">
      <div className="status-group signal-status" aria-label={midiLabel}>
        <StatusDot tone={midiStatus.selectedInputName ? "good" : "warn"} />
        <div className="level-meter" aria-label="Audio level">
          <span style={{ inlineSize: `${Math.round(audioLevel * 100)}%` }} />
        </div>
        <ThemeToggleButton
          themeMode={themeMode}
          onThemeModeChange={onThemeModeChange}
        />
      </div>

      <div className="top-bar-content">
        <div className="top-select-row">
          <div className="select-control scale-control">
            <span>Scale</span>
            <ScaleSelect
              selectedScale={selectedScale}
              onScaleChange={onScaleChange}
            />
          </div>
          <div className="select-control chord-preview-control">
            <span>Chord Preview</span>
            <ChordPreviewSelect
              disabled={isPracticeSongBuilderActive}
              hasSelectedScale={hasSelectedScale}
              options={chordPreviewOptions}
              selectedChordPreview={selectedChordPreview}
              onChordPreviewChange={onChordPreviewChange}
            />
          </div>
          <div className="select-control practice-song-control">
            <span>Song</span>
            <PracticeSongSelect
              options={practiceSongOptions}
              selectedPracticeSongId={selectedPracticeSongId}
              pendingPracticeSongTitle={pendingPracticeSongTitle}
              isPracticeSongBuilderActive={isPracticeSongBuilderActive}
              practiceSongBuilderTitle={practiceSongBuilderTitle}
              onPracticeSongChange={onPracticeSongChange}
            />
          </div>
        </div>
        {hasActionRow ? (
          <div className="top-action-row">
            {isPracticeSongBuilderActive ? (
              <div className="practice-song-builder-row">
                <PracticeSongTitleField
                  label="Title"
                  placeholder="Song title"
                  value={practiceSongBuilderTitle ?? ""}
                  onChange={onPracticeSongBuilderTitleChange}
                />
                <PracticeSongBuilderControls
                  onBack={onPracticeBack}
                  onNext={onPracticeNext}
                  onSave={onPracticeSongBuilderSave}
                  onCancel={onPracticeSongBuilderCancel}
                />
              </div>
            ) : hasSelectedPracticeSong ? (
              <PracticeSongControls
                isPracticePlaying={isPracticePlaying}
                runMode={practiceRunMode}
                tempoBpm={practiceTempoBpm}
                speedPercent={practiceSpeedPercent}
                speedStepPercent={practiceSpeedStepPercent}
                performanceScore={performanceScore}
                onBack={onPracticeBack}
                onNext={onPracticeNext}
                onRestart={onPracticeRestart}
                onBuilderStart={onPracticeSongBuilderStart}
                onRunModeChange={onPracticeRunModeChange}
                onSpeedPercentChange={onPracticeSpeedPercentChange}
                onPlayingChange={onPracticePlayingChange}
              />
            ) : hasPendingPracticeSong ? (
              <NewPracticeSongComposer
                title={pendingPracticeSongTitle}
                onTitleChange={onPendingPracticeSongTitleChange}
                onSubmit={onPendingPracticeSongSubmit}
                onCancel={onPendingPracticeSongCancel}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}

interface PracticeSongSelectProps {
  options: PracticeSongOption[];
  selectedPracticeSongId: string;
  pendingPracticeSongTitle: string;
  isPracticeSongBuilderActive: boolean;
  practiceSongBuilderTitle: string | null;
  onPracticeSongChange: (practiceSongId: string) => void;
}

function PracticeSongSelect({
  options,
  selectedPracticeSongId,
  pendingPracticeSongTitle,
  isPracticeSongBuilderActive,
  practiceSongBuilderTitle,
  onPracticeSongChange,
}: PracticeSongSelectProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(
    (option) => option.id === selectedPracticeSongId,
  );
  const selectedName = getPracticeSongSelectedName(
    selectedPracticeSongId,
    selectedOption,
    pendingPracticeSongTitle,
    isPracticeSongBuilderActive,
    practiceSongBuilderTitle,
  );

  useCloseOnOutsidePointer(isOpen, rootRef, setIsOpen);

  return (
    <div className="top-select practice-song-select" ref={rootRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-disabled={isPracticeSongBuilderActive}
        className="top-select-trigger"
        disabled={isPracticeSongBuilderActive}
        type="button"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsOpen(false);
          }
        }}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="top-select-selected-name">{selectedName}</span>
        <span className="top-select-arrow" aria-hidden="true">
          ▾
        </span>
      </button>
      {isOpen ? (
        <div
          aria-label="Practice song"
          className="top-select-menu practice-song-menu"
          role="listbox"
        >
          <button
            aria-disabled={isPracticeSongBuilderActive}
            aria-selected={selectedPracticeSongId === NONE_PRACTICE_SONG_ID}
            className="top-select-option"
            role="option"
            type="button"
            onClick={() => {
              onPracticeSongChange(NONE_PRACTICE_SONG_ID);
              setIsOpen(false);
            }}
            disabled={isPracticeSongBuilderActive}
          >
            <span className="top-select-option-name">None</span>
          </button>
          <button
            aria-selected={selectedPracticeSongId === PENDING_PRACTICE_SONG_ID}
            className="top-select-option new-song-option"
            role="option"
            type="button"
            onClick={() => {
              onPracticeSongChange(PENDING_PRACTICE_SONG_ID);
              setIsOpen(false);
            }}
          >
            <span className="top-select-option-name">New Song</span>
          </button>
          {!isPracticeSongBuilderActive
            ? options.map((option) => {
                const isInvalid = option.status === "invalid";

                return (
                  <button
                    aria-disabled={isInvalid}
                    aria-selected={selectedPracticeSongId === option.id}
                    className={[
                      "top-select-option",
                      "practice-song-option",
                      getPracticeSongOptionClassName(option),
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    key={option.id}
                    role="option"
                    title={isInvalid ? option.error : undefined}
                    type="button"
                    onClick={() => {
                      if (isInvalid) {
                        return;
                      }

                      onPracticeSongChange(option.id);
                      setIsOpen(false);
                    }}
                  >
                    {isInvalid ? (
                      <span className="song-invalid-marker" aria-hidden="true" />
                    ) : null}
                    <span className="top-select-option-name">{option.title}</span>
                  </button>
                );
              })
            : null}
        </div>
      ) : null}
    </div>
  );
}

interface PracticeSongControlsProps {
  isPracticePlaying: boolean;
  runMode: PracticeRunMode;
  tempoBpm: number | null;
  speedPercent: number;
  speedStepPercent: number;
  performanceScore: PerformanceScore | null;
  onBack: () => void;
  onNext: () => void;
  onRestart: () => void;
  onBuilderStart: () => void;
  onRunModeChange: (runMode: PracticeRunMode) => void;
  onSpeedPercentChange: (speedPercent: number) => void;
  onPlayingChange: (isPlaying: boolean) => void;
}

function PracticeSongControls({
  isPracticePlaying,
  runMode,
  tempoBpm,
  speedPercent,
  speedStepPercent,
  performanceScore,
  onBack,
  onNext,
  onRestart,
  onBuilderStart,
  onRunModeChange,
  onSpeedPercentChange,
  onPlayingChange,
}: PracticeSongControlsProps): React.ReactElement {
  return (
    <div className="practice-song-controls" aria-label="Practice song controls">
      <div className="practice-mode-control" aria-label="Practice mode">
        <button
          className={[
            "practice-mode-button",
            runMode === "guided" ? "is-active-practice-mode" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          type="button"
          aria-pressed={runMode === "guided"}
          onClick={() => onRunModeChange("guided")}
        >
          Guided Practice
        </button>
        <button
          className={[
            "practice-mode-button",
            runMode === "performance" ? "is-active-practice-mode" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          type="button"
          aria-pressed={runMode === "performance"}
          onClick={() => onRunModeChange("performance")}
        >
          Performance Practice
        </button>
      </div>
      <span className="practice-tempo-readout">
        {tempoBpm ? `${tempoBpm} BPM` : "BPM"}
      </span>
      <div className="practice-speed-control" aria-label="Practice speed">
        <button
          className="practice-speed-button"
          type="button"
          aria-label="Decrease Practice Speed"
          title="Slower"
          onClick={() => onSpeedPercentChange(speedPercent - speedStepPercent)}
        >
          -
        </button>
        <span className="practice-speed-value">{speedPercent}%</span>
        <button
          className="practice-speed-button"
          type="button"
          aria-label="Increase Practice Speed"
          title="Faster"
          onClick={() => onSpeedPercentChange(speedPercent + speedStepPercent)}
        >
          +
        </button>
      </div>
      {runMode === "performance" && performanceScore ? (
        <span className="practice-score-readout">
          {performanceScore.hits}/{performanceScore.total} ·{" "}
          {performanceScore.percent}%
        </span>
      ) : null}
      <button
        className="practice-control-button"
        type="button"
        aria-label="Previous Practice Target"
        title="Previous target"
        onClick={onBack}
      >
        <span aria-hidden="true">{PRACTICE_SONG_CONTROL_ICONS.previousStep}</span>
      </button>
      <button
        className="practice-control-button practice-play-button"
        type="button"
        aria-label={isPracticePlaying ? "Pause Practice Song" : "Play Practice Song"}
        title={isPracticePlaying ? "Pause" : "Play"}
        onClick={() => onPlayingChange(!isPracticePlaying)}
      >
        <span aria-hidden="true">
          {isPracticePlaying
            ? PRACTICE_SONG_CONTROL_ICONS.pause
            : PRACTICE_SONG_CONTROL_ICONS.play}
        </span>
      </button>
      <button
        className="practice-control-button"
        type="button"
        aria-label="Next Practice Target"
        title="Next target"
        onClick={onNext}
      >
        <span aria-hidden="true">{PRACTICE_SONG_CONTROL_ICONS.nextStep}</span>
      </button>
      <button
        className="practice-control-button"
        type="button"
        aria-label="Restart Practice Song"
        title="Restart"
        onClick={onRestart}
      >
        <span aria-hidden="true">{PRACTICE_SONG_CONTROL_ICONS.restart}</span>
      </button>
      <PracticeSongBuilderStartButton
        label="Edit Practice Song"
        title="Edit practice song"
        onBuilderStart={onBuilderStart}
      />
    </div>
  );
}

interface PracticeSongBuilderStartButtonProps {
  label: string;
  title: string;
  onBuilderStart: () => void;
}

function PracticeSongBuilderStartButton({
  label,
  title,
  onBuilderStart,
}: PracticeSongBuilderStartButtonProps): React.ReactElement {
  return (
    <button
      className="practice-control-button"
      type="button"
      aria-label={label}
      title={title}
      onClick={onBuilderStart}
    >
      <span aria-hidden="true">{PRACTICE_SONG_CONTROL_ICONS.edit}</span>
    </button>
  );
}

interface PracticeSongBuilderControlsProps {
  onBack: () => void;
  onNext: () => void;
  onSave: () => void;
  onCancel: () => void;
}

function PracticeSongBuilderControls({
  onBack,
  onNext,
  onSave,
  onCancel,
}: PracticeSongBuilderControlsProps): React.ReactElement {
  return (
    <div className="practice-song-controls" aria-label="Notation builder">
      <button
        className="practice-control-button"
        type="button"
        aria-label="Previous Draft Target"
        title="Previous target"
        onClick={onBack}
      >
        <span aria-hidden="true">{PRACTICE_SONG_CONTROL_ICONS.previousStep}</span>
      </button>
      <button
        className="practice-control-button"
        type="button"
        aria-label="Next Draft Target"
        title="Next target"
        onClick={onNext}
      >
        <span aria-hidden="true">{PRACTICE_SONG_CONTROL_ICONS.nextStep}</span>
      </button>
      <button
        className="practice-control-button practice-save-button"
        type="button"
        aria-label="Save Practice Song"
        title="Save practice song"
        onClick={onSave}
      >
        <span aria-hidden="true">{PRACTICE_SONG_CONTROL_ICONS.save}</span>
      </button>
      <button
        className="practice-control-button"
        type="button"
        aria-label="Cancel Notation Builder"
        title="Cancel"
        onClick={onCancel}
      >
        <span aria-hidden="true">{PRACTICE_SONG_CONTROL_ICONS.cancel}</span>
      </button>
    </div>
  );
}

interface NewPracticeSongComposerProps {
  title: string;
  onTitleChange: (title: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

function NewPracticeSongComposer({
  title,
  onTitleChange,
  onSubmit,
  onCancel,
}: NewPracticeSongComposerProps): React.ReactElement {
  const canSubmit = title.trim().length > 0;

  return (
    <div className="new-song-composer" aria-label="New practice song">
      <PracticeSongTitleField
        label="New Song"
        placeholder="Song title"
        value={title}
        onChange={onTitleChange}
        onSubmit={canSubmit ? onSubmit : undefined}
      />
      <div className="practice-song-controls" aria-label="New song controls">
        <button
          className="practice-control-button"
          type="button"
          aria-label="Create Practice Song"
          title="Create practice song"
          disabled={!canSubmit}
          onClick={onSubmit}
        >
          <span aria-hidden="true">{PRACTICE_SONG_CONTROL_ICONS.edit}</span>
        </button>
        <button
          className="practice-control-button"
          type="button"
          aria-label="Cancel New Practice Song"
          title="Cancel"
          onClick={onCancel}
        >
          <span aria-hidden="true">{PRACTICE_SONG_CONTROL_ICONS.cancel}</span>
        </button>
      </div>
    </div>
  );
}

interface PracticeSongTitleFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
}

function PracticeSongTitleField({
  label,
  placeholder,
  value,
  onChange,
  onSubmit,
}: PracticeSongTitleFieldProps): React.ReactElement {
  return (
    <label className="practice-song-title-field">
      <span>{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onKeyDown={(event) => {
          event.stopPropagation();

          if (event.key === "Enter" && onSubmit) {
            event.preventDefault();
            onSubmit();
          }
        }}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </label>
  );
}

function StatusDot({ tone }: { tone: "good" | "warn" }): React.ReactElement {
  return <span className={`status-dot status-dot-${tone}`} />;
}

interface ThemeToggleButtonProps {
  themeMode: ThemeMode;
  onThemeModeChange: (themeMode: ThemeMode) => void;
}

function ThemeToggleButton({
  themeMode,
  onThemeModeChange,
}: ThemeToggleButtonProps): React.ReactElement {
  const nextThemeMode = getNextThemeMode(themeMode);
  const label =
    nextThemeMode === "light" ? "Use Light Appearance" : "Use Dark Appearance";

  return (
    <button
      className="theme-toggle-button"
      type="button"
      aria-label={label}
      title={label}
      onClick={() => onThemeModeChange(nextThemeMode)}
    >
      <span aria-hidden="true">{THEME_MODE_ICONS[nextThemeMode]}</span>
    </button>
  );
}

interface ScaleSelectProps {
  selectedScale: SelectedScale | null;
  onScaleChange: (scale: SelectedScale | null) => void;
}

function ScaleSelect({
  selectedScale,
  onScaleChange,
}: ScaleSelectProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useCloseOnOutsidePointer(isOpen, rootRef, setIsOpen);

  return (
    <div className="top-select scale-select" ref={rootRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="top-select-trigger"
        type="button"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsOpen(false);
          }
        }}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span
          className="top-select-selected-name scale-option-name"
          style={selectedScale ? noteCssVars(selectedScale.tonic) : undefined}
        >
          {selectedScale
            ? getScaleOptionLabel(selectedScale.tonic, selectedScale.mode)
            : "None"}
        </span>
        <span className="top-select-arrow" aria-hidden="true">
          ▾
        </span>
      </button>
      {isOpen ? (
        <div aria-label="Selected scale" className="top-select-menu" role="listbox">
          <button
            aria-selected={selectedScale === null}
            className="top-select-option"
            role="option"
            type="button"
            onClick={() => {
              onScaleChange(null);
              setIsOpen(false);
            }}
          >
            <span className="top-select-option-name">None</span>
          </button>
          {PITCH_CLASSES.flatMap((pitchClass) =>
            SCALE_MODES.map((mode) => (
              <button
                aria-selected={
                  selectedScale?.tonic === pitchClass &&
                  selectedScale?.mode === mode
                }
                className="top-select-option"
                key={`${pitchClass}:${mode}`}
                role="option"
                type="button"
                onClick={() => {
                  onScaleChange({ tonic: pitchClass, mode });
                  setIsOpen(false);
                }}
              >
                <span
                  className="top-select-option-name scale-option-name"
                  style={noteCssVars(pitchClass)}
                >
                  {getScaleOptionLabel(pitchClass, mode)}
                </span>
              </button>
            )),
          )}
        </div>
      ) : null}
    </div>
  );
}

interface ChordPreviewSelectProps {
  disabled?: boolean;
  hasSelectedScale: boolean;
  options: ReturnType<typeof getChordPreviewOptions>;
  selectedChordPreview: ChordPreview | null;
  onChordPreviewChange: (preview: ChordPreview | null) => void;
}

function ChordPreviewSelect({
  disabled = false,
  hasSelectedScale,
  options,
  selectedChordPreview,
  onChordPreviewChange,
}: ChordPreviewSelectProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedOption = selectedChordPreview
    ? options.find(({ preview }) => preview.value === selectedChordPreview.value)
    : undefined;
  const selectedClassName = selectedOption
    ? getChordPreviewOptionClassName(
        selectedOption.isInSelectedScale,
        hasSelectedScale,
      )
    : undefined;

  useCloseOnOutsidePointer(isOpen, rootRef, setIsOpen);

  return (
    <div className="top-select chord-preview-select" ref={rootRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-disabled={disabled}
        className="top-select-trigger"
        disabled={disabled}
        type="button"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsOpen(false);
          }
        }}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span
          className={getChordPreviewSelectedClassName(selectedClassName)}
          style={
            selectedChordPreview ? noteCssVars(selectedChordPreview.root) : undefined
          }
        >
          {selectedChordPreview?.optionLabel ?? "None"}
        </span>
        <span className="top-select-arrow" aria-hidden="true">
          ▾
        </span>
      </button>
      {isOpen ? (
        <div
          aria-label="Chord preview"
          className="top-select-menu chord-preview-menu"
          role="listbox"
        >
          <button
            className="top-select-option"
            role="option"
            type="button"
            aria-selected={selectedChordPreview === null}
            onClick={() => {
              onChordPreviewChange(getChordPreviewByValue("none"));
              setIsOpen(false);
            }}
          >
            <span className="top-select-option-name">None</span>
          </button>
          {options.map(({ preview, isInSelectedScale }) => {
            const optionClassName = getChordPreviewOptionClassName(
              isInSelectedScale,
              hasSelectedScale,
            );

            return (
              <button
                className="top-select-option"
                key={preview.value}
                role="option"
                type="button"
                aria-selected={selectedChordPreview?.value === preview.value}
                onClick={() => {
                  onChordPreviewChange(preview);
                  setIsOpen(false);
                }}
              >
                <span
                  className={[
                    "top-select-option-name",
                    "chord-preview-option-name",
                    optionClassName,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={noteCssVars(preview.root)}
                >
                  {preview.optionLabel}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function useCloseOnOutsidePointer(
  isOpen: boolean,
  rootRef: RefObject<HTMLElement | null>,
  setIsOpen: (isOpen: boolean) => void,
): void {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOnPointerDown = (event: PointerEvent): void => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener("pointerdown", closeOnPointerDown);

    return () => window.removeEventListener("pointerdown", closeOnPointerDown);
  }, [isOpen, rootRef, setIsOpen]);
}

function getScaleOptionLabel(tonic: PitchClass, mode: ScaleMode): string {
  return `${tonic} ${SCALE_MODE_LABELS[mode].toLowerCase()}`;
}

function getPracticeSongSelectedName(
  selectedPracticeSongId: string,
  selectedOption: PracticeSongOption | undefined,
  pendingPracticeSongTitle: string,
  isPracticeSongBuilderActive: boolean,
  practiceSongBuilderTitle: string | null,
): string {
  if (isPracticeSongBuilderActive) {
    return practiceSongBuilderTitle?.trim() || "Untitled song";
  }

  if (selectedPracticeSongId === PENDING_PRACTICE_SONG_ID) {
    return pendingPracticeSongTitle.trim() || "New Song";
  }

  return selectedOption?.title ?? "None";
}

export function getChordPreviewOptionClassName(
  isInSelectedScale: boolean,
  hasSelectedScale: boolean,
): string | undefined {
  if (!hasSelectedScale) {
    return undefined;
  }

  return isInSelectedScale ? "is-in-scale-option" : "is-out-scale-option";
}

export function getChordPreviewSelectedClassName(
  selectedScaleFitClassName?: string,
): string {
  return [
    "top-select-selected-name",
    "chord-preview-option-name",
    selectedScaleFitClassName,
  ]
    .filter(Boolean)
    .join(" ");
}

export function getPracticeSongOptionClassName(
  option: PracticeSongOption,
): string | undefined {
  return option.status === "invalid" ? "is-invalid-song-option" : undefined;
}
