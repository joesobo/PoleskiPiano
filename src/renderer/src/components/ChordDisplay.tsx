import { noteCssVars } from "../music/colors";
import type { ChordAnalysis } from "../music/chords";

interface ChordDisplayProps {
  analysis: ChordAnalysis;
}

export function ChordDisplay({
  analysis,
}: ChordDisplayProps): React.ReactElement {
  return (
    <section className="chord-panel practice-panel">
      <div className="panel-kicker">Now playing</div>
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
