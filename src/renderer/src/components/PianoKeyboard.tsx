import { useEffect, useRef } from "react";
import { noteCssVars } from "../music/colors";
import { getWhiteKeyCount, type PianoKey } from "../music/notes";

interface PianoKeyboardProps {
  keys: PianoKey[];
  activeMidiNotes: Set<number>;
  previewMidiNotes: Set<number>;
  scaleMidiNotes: Set<number>;
  onNoteInputStart?: (midi: number) => void;
  onInputStop?: () => void;
  inputResetKey?: number;
}

export function PianoKeyboard({
  keys,
  activeMidiNotes,
  previewMidiNotes,
  scaleMidiNotes,
  onNoteInputStart,
  onInputStop,
  inputResetKey,
}: PianoKeyboardProps): React.ReactElement {
  const activePointerIdRef = useRef<number | null>(null);
  const whiteKeys = keys.filter((key) => !key.isBlack);
  const blackKeys = keys.filter((key) => key.isBlack);
  const whiteCount = getWhiteKeyCount(keys);

  useEffect(() => {
    activePointerIdRef.current = null;
  }, [inputResetKey]);

  const handlePointerDown = (
    event: React.PointerEvent<HTMLElement>,
  ): void => {
    const midi = getMidiFromPointerEvent(event);

    if (midi === null || activePointerIdRef.current !== null) {
      return;
    }

    event.preventDefault();
    activePointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    onNoteInputStart?.(midi);
  };

  const handlePointerMove = (
    event: React.PointerEvent<HTMLElement>,
  ): void => {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }

    const midi = getMidiFromPointerEvent(event);

    if (midi !== null) {
      onNoteInputStart?.(midi);
    }
  };

  const stopPointerInput = (event: React.PointerEvent<HTMLElement>): void => {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }

    activePointerIdRef.current = null;
    onInputStop?.();
  };

  return (
    <section
      className="piano-panel"
      aria-label="37 key piano"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopPointerInput}
      onPointerCancel={stopPointerInput}
      onLostPointerCapture={stopPointerInput}
    >
      <div
        className="white-keys"
        style={{ gridTemplateColumns: `repeat(${whiteCount}, minmax(0, 1fr))` }}
      >
        {whiteKeys.map((key) => (
          <KeyFace
            key={key.midi}
            keyData={key}
            isActive={activeMidiNotes.has(key.midi)}
            isPreviewed={previewMidiNotes.has(key.midi)}
            isInScale={scaleMidiNotes.has(key.midi)}
            tone="white"
          />
        ))}
      </div>

      <div className="black-keys" aria-hidden="true">
        {blackKeys.map((key) => (
          <KeyFace
            key={key.midi}
            keyData={key}
            isActive={activeMidiNotes.has(key.midi)}
            isPreviewed={previewMidiNotes.has(key.midi)}
            isInScale={scaleMidiNotes.has(key.midi)}
            tone="black"
            style={{
              left: `${((key.blackCenter ?? 0) / whiteCount) * 100}%`,
              inlineSize: `calc(100% / ${whiteCount} * 0.66)`,
              ...noteCssVars(key.pitchClass),
            }}
          />
        ))}
      </div>
    </section>
  );
}

interface KeyFaceProps {
  keyData: PianoKey;
  isActive: boolean;
  isPreviewed: boolean;
  isInScale: boolean;
  tone: "white" | "black";
  style?: React.CSSProperties;
}

function KeyFace({
  keyData,
  isActive,
  isPreviewed,
  isInScale,
  tone,
  style,
}: KeyFaceProps): React.ReactElement {
  return (
    <div
      className={[
        "piano-key",
        `piano-key-${tone}`,
        isActive ? "is-active" : "",
        isPreviewed ? "is-previewed" : "",
        isInScale ? "is-in-scale" : "is-out-scale",
      ].join(" ")}
      style={{ ...noteCssVars(keyData.pitchClass), ...style }}
      data-note={keyData.note}
      data-midi={keyData.midi}
      role="button"
      aria-label={keyData.note}
    >
      {isPreviewed && !isActive ? (
        <span className="key-preview-marker" aria-hidden="true" />
      ) : null}
      <span className="key-note">{keyData.note}</span>
    </div>
  );
}

function getMidiFromPointerEvent(
  event: React.PointerEvent<HTMLElement>,
): number | null {
  const target = document
    .elementFromPoint(event.clientX, event.clientY)
    ?.closest<HTMLElement>("[data-midi]");
  const midi = target?.dataset.midi;

  return midi ? Number(midi) : null;
}
