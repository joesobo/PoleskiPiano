import { noteCssVars } from "../music/colors";
import type { ChordAnalysis } from "../music/chords";
import type { ChordPreview } from "../music/chordPreview";

interface ChordDisplayProps {
  analysis: ChordAnalysis;
  previewChord?: ChordPreview | null;
}

export function ChordDisplay({
  analysis,
  previewChord,
}: ChordDisplayProps): React.ReactElement {
  return (
    <section className="chord-panel practice-panel">
      <div className="panel-kicker">Now playing</div>
      <div className="chord-preview-readout">
        {previewChord ? (
          <>
            <span className="chord-preview-kicker">Chord Preview</span>
            <span
              className="chord-preview-name"
              style={noteCssVars(previewChord.root)}
            >
              {previewChord.label}
            </span>
          </>
        ) : null}
      </div>
      <div className="preview-note-pills" aria-hidden={!previewChord}>
        {previewChord?.pitchClasses.map((pitchClass) => (
          <span
            className="note-pill note-pill-preview"
            key={pitchClass}
            style={noteCssVars(pitchClass)}
          >
            {pitchClass}
          </span>
        ))}
      </div>
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
