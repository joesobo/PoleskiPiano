import { noteCssVars } from "../music/colors";
import { getWhiteKeyCount, type PianoKey } from "../music/notes";

interface PianoKeyboardProps {
  keys: PianoKey[];
  activeMidiNotes: Set<number>;
  scaleMidiNotes: Set<number>;
}

export function PianoKeyboard({
  keys,
  activeMidiNotes,
  scaleMidiNotes,
}: PianoKeyboardProps): React.ReactElement {
  const whiteKeys = keys.filter((key) => !key.isBlack);
  const blackKeys = keys.filter((key) => key.isBlack);
  const whiteCount = getWhiteKeyCount(keys);

  return (
    <section className="piano-panel" aria-label="37 key piano">
      <div
        className="white-keys"
        style={{ gridTemplateColumns: `repeat(${whiteCount}, minmax(0, 1fr))` }}
      >
        {whiteKeys.map((key) => (
          <KeyFace
            key={key.midi}
            keyData={key}
            isActive={activeMidiNotes.has(key.midi)}
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
  isInScale: boolean;
  tone: "white" | "black";
  style?: React.CSSProperties;
}

function KeyFace({
  keyData,
  isActive,
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
        isInScale ? "is-in-scale" : "is-out-scale",
      ].join(" ")}
      style={{ ...noteCssVars(keyData.pitchClass), ...style }}
      data-note={keyData.note}
    >
      <span className="key-note">{keyData.note}</span>
    </div>
  );
}
