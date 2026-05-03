import { noteCssVars } from "../music/colors";
import type { ChordAnalysis } from "../music/chords";
import type { PitchClass } from "../music/notes";

interface ChordDisplayPreviewNote {
  label: string;
  pitchClass: PitchClass;
}

export interface ChordDisplayPreview {
  kind: "chord" | "practice";
  kicker: string;
  name: string;
  stepCount?: string;
  colorPitchClass?: PitchClass;
  message?: string | null;
  notes: ChordDisplayPreviewNote[];
}

interface ChordDisplayProps {
  analysis: ChordAnalysis;
  preview?: ChordDisplayPreview | null;
}

export function ChordDisplay({
  analysis,
  preview,
}: ChordDisplayProps): React.ReactElement {
  const previewColorPitchClass =
    preview?.colorPitchClass ?? preview?.notes[0]?.pitchClass;

  return (
    <section className="chord-panel practice-panel">
      <div className="panel-kicker">Now playing</div>
      <div className="chord-preview-readout">
        {preview ? (
          preview.kind === "practice" ? (
            <div className="practice-preview-title-row">
              <span className="practice-preview-title">{preview.name}</span>
              {preview.stepCount ? (
                <span className="practice-preview-count">{preview.stepCount}</span>
              ) : null}
            </div>
          ) : (
            <>
              <span className="chord-preview-kicker">{preview.kicker}</span>
              <span
                className="chord-preview-name"
                style={
                  previewColorPitchClass
                    ? noteCssVars(previewColorPitchClass)
                    : undefined
                }
              >
                {preview.name}
              </span>
            </>
          )
        ) : null}
      </div>
      <div className="preview-note-pills" aria-hidden={!preview}>
        {preview?.notes.map((note, index) => (
          <span
            className="note-pill note-pill-preview"
            key={`${note.label}-${index}`}
            style={noteCssVars(note.pitchClass)}
          >
            {note.label}
          </span>
        ))}
      </div>
      {preview?.message ? (
        <div className="practice-preview-error">{preview.message}</div>
      ) : null}
      <div
        className="chord-name"
        style={analysis.root ? noteCssVars(analysis.root) : undefined}
      >
        {analysis.label}
      </div>
      <div className="note-pills">
        {analysis.notes.map((pitchClass) => (
          <span
            className="note-pill"
            key={pitchClass}
            style={noteCssVars(pitchClass)}
          >
            {pitchClass}
          </span>
        ))}
      </div>
    </section>
  );
}
