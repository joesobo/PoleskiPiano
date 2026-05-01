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
import type { PracticeSongOption } from "../music/practiceSongs";

export type ThemeMode = "dark" | "light";
export const NONE_PRACTICE_SONG_ID = "none";

interface TopBarProps {
  midiStatus: MidiStatus;
  audioLevel: number;
  selectedScale: SelectedScale | null;
  selectedChordPreview: ChordPreview | null;
  practiceSongOptions: PracticeSongOption[];
  selectedPracticeSongId: string;
  hasSelectedPracticeSong: boolean;
  isPracticePlaying: boolean;
  onScaleChange: (scale: SelectedScale | null) => void;
  onChordPreviewChange: (preview: ChordPreview | null) => void;
  onPracticeSongChange: (practiceSongId: string) => void;
  onPracticeBack: () => void;
  onPracticeNext: () => void;
  onPracticeRestart: () => void;
  onPracticePlayingChange: (isPlaying: boolean) => void;
}

export function TopBar({
  midiStatus,
  audioLevel,
  selectedScale,
  selectedChordPreview,
  practiceSongOptions,
  selectedPracticeSongId,
  hasSelectedPracticeSong,
  isPracticePlaying,
  onScaleChange,
  onChordPreviewChange,
  onPracticeSongChange,
  onPracticeBack,
  onPracticeNext,
  onPracticeRestart,
  onPracticePlayingChange,
}: TopBarProps): React.ReactElement {
  const midiLabel =
    midiStatus.selectedInputName ??
    (midiStatus.supported ? "No MIDI device" : "MIDI unavailable");
  const chordPreviewOptions = getChordPreviewOptions(selectedScale);
  const hasSelectedScale = selectedScale !== null;

  return (
    <header className="top-bar">
      <div className="status-group signal-status" aria-label={midiLabel}>
        <StatusDot tone={midiStatus.selectedInputName ? "good" : "warn"} />
        <div className="level-meter" aria-label="Audio level">
          <span style={{ inlineSize: `${Math.round(audioLevel * 100)}%` }} />
        </div>
      </div>

      <div className="top-controls">
        <div className="select-control scale-control">
          <span>Scale</span>
          <ScaleSelect
            selectedScale={selectedScale}
            onScaleChange={onScaleChange}
          />
        </div>
        <div className="select-control practice-song-control">
          <span>Song</span>
          <PracticeSongSelect
            options={practiceSongOptions}
            selectedPracticeSongId={selectedPracticeSongId}
            onPracticeSongChange={onPracticeSongChange}
          />
        </div>
        {hasSelectedPracticeSong ? (
          <PracticeSongControls
            isPracticePlaying={isPracticePlaying}
            onBack={onPracticeBack}
            onNext={onPracticeNext}
            onRestart={onPracticeRestart}
            onPlayingChange={onPracticePlayingChange}
          />
        ) : (
          <div className="select-control chord-preview-control">
            <span>Chord Preview</span>
            <ChordPreviewSelect
              hasSelectedScale={hasSelectedScale}
              options={chordPreviewOptions}
              selectedChordPreview={selectedChordPreview}
              onChordPreviewChange={onChordPreviewChange}
            />
          </div>
        )}
      </div>
    </header>
  );
}

interface PracticeSongSelectProps {
  options: PracticeSongOption[];
  selectedPracticeSongId: string;
  onPracticeSongChange: (practiceSongId: string) => void;
}

function PracticeSongSelect({
  options,
  selectedPracticeSongId,
  onPracticeSongChange,
}: PracticeSongSelectProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(
    (option) => option.id === selectedPracticeSongId,
  );

  useCloseOnOutsidePointer(isOpen, rootRef, setIsOpen);

  return (
    <div className="top-select practice-song-select" ref={rootRef}>
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
        <span className="top-select-selected-name">
          {selectedOption?.title ?? "None"}
        </span>
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
            aria-selected={selectedPracticeSongId === NONE_PRACTICE_SONG_ID}
            className="top-select-option"
            role="option"
            type="button"
            onClick={() => {
              onPracticeSongChange(NONE_PRACTICE_SONG_ID);
              setIsOpen(false);
            }}
          >
            <span className="top-select-option-name">None</span>
          </button>
          {options.map((option) => {
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
          })}
        </div>
      ) : null}
    </div>
  );
}

interface PracticeSongControlsProps {
  isPracticePlaying: boolean;
  onBack: () => void;
  onNext: () => void;
  onRestart: () => void;
  onPlayingChange: (isPlaying: boolean) => void;
}

function PracticeSongControls({
  isPracticePlaying,
  onBack,
  onNext,
  onRestart,
  onPlayingChange,
}: PracticeSongControlsProps): React.ReactElement {
  return (
    <div className="practice-song-controls" aria-label="Practice song controls">
      <button
        className="practice-control-button"
        type="button"
        aria-label="Previous Practice Step"
        title="Previous step"
        onClick={onBack}
      >
        <span aria-hidden="true">⏮</span>
      </button>
      <button
        className="practice-control-button practice-play-button"
        type="button"
        aria-label={isPracticePlaying ? "Pause Practice Song" : "Play Practice Song"}
        title={isPracticePlaying ? "Pause" : "Play"}
        onClick={() => onPlayingChange(!isPracticePlaying)}
      >
        <span aria-hidden="true">{isPracticePlaying ? "⏸" : "▶"}</span>
      </button>
      <button
        className="practice-control-button"
        type="button"
        aria-label="Next Practice Step"
        title="Next step"
        onClick={onNext}
      >
        <span aria-hidden="true">⏭</span>
      </button>
      <button
        className="practice-control-button"
        type="button"
        aria-label="Restart Practice Song"
        title="Restart"
        onClick={onRestart}
      >
        <span aria-hidden="true">↺</span>
      </button>
    </div>
  );
}

function StatusDot({ tone }: { tone: "good" | "warn" }): React.ReactElement {
  return <span className={`status-dot status-dot-${tone}`} />;
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
  hasSelectedScale: boolean;
  options: ReturnType<typeof getChordPreviewOptions>;
  selectedChordPreview: ChordPreview | null;
  onChordPreviewChange: (preview: ChordPreview | null) => void;
}

function ChordPreviewSelect({
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
