import { noteCssVars } from "../music/colors";
import type { PitchClass } from "../music/notes";

export interface RecentNote {
  id: string;
  note: string;
  pitchClass: PitchClass;
  velocity: number;
}

interface RecentTimelineProps {
  notes: RecentNote[];
}

export function RecentTimeline({ notes }: RecentTimelineProps): React.ReactElement {
  return (
    <section className="timeline-panel" aria-label="Recent notes">
      {notes.map((note) => (
        <span
          key={note.id}
          className="timeline-note"
          style={{
            ...noteCssVars(note.pitchClass),
            blockSize: `${Math.max(24, 24 + note.velocity * 44)}px`,
          }}
        >
          {note.note}
        </span>
      ))}
    </section>
  );
}
