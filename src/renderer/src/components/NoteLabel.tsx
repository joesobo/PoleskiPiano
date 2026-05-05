import { getNoteDisplayParts } from "../music/notes";

interface NoteLabelProps {
  label: string;
  className?: string;
}

export function NoteLabel({
  label,
  className,
}: NoteLabelProps): React.ReactElement {
  const display = getNoteDisplayParts(label);
  const primaryLabel = `${display.primary}${display.octave ?? ""}`;
  const enharmonicLabel = display.enharmonic
    ? `${display.enharmonic}${display.octave ?? ""}`
    : null;

  return (
    <span
      aria-label={label}
      className={[
        "note-label",
        enharmonicLabel ? "has-enharmonic" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="note-label-line note-label-primary">
        {primaryLabel}
      </span>
      {enharmonicLabel ? (
        <span className="note-label-line note-label-enharmonic">
          {enharmonicLabel}
        </span>
      ) : null}
    </span>
  );
}
