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

export type ThemeMode = "dark" | "light";

interface TopBarProps {
  midiStatus: MidiStatus;
  audioLevel: number;
  selectedScale: SelectedScale | null;
  selectedChordPreview: ChordPreview | null;
  themeMode: ThemeMode;
  onScaleChange: (scale: SelectedScale | null) => void;
  onChordPreviewChange: (preview: ChordPreview | null) => void;
  onThemeModeChange: (themeMode: ThemeMode) => void;
}

export function TopBar({
  midiStatus,
  audioLevel,
  selectedScale,
  selectedChordPreview,
  themeMode,
  onScaleChange,
  onChordPreviewChange,
  onThemeModeChange,
}: TopBarProps): React.ReactElement {
  const midiLabel =
    midiStatus.selectedInputName ??
    (midiStatus.supported ? "No MIDI device" : "MIDI unavailable");
  const chordPreviewOptions = getChordPreviewOptions(selectedScale);
  const hasSelectedScale = selectedScale !== null;
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

      <div className="top-controls">
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
            hasSelectedScale={hasSelectedScale}
            options={chordPreviewOptions}
            selectedChordPreview={selectedChordPreview}
            onChordPreviewChange={onChordPreviewChange}
          />
        </div>
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
