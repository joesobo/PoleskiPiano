import { noteCssVars } from "../music/colors";
import { getStaffPlacements, staffMetrics } from "../music/staff";

interface StaffNotationProps {
  activeMidiNotes: number[];
}

export function StaffNotation({
  activeMidiNotes,
}: StaffNotationProps): React.ReactElement {
  const placements = getStaffPlacements(activeMidiNotes);
  const staffLines = [0, 1, 2, 3, 4];

  return (
    <section className="staff-panel practice-panel" aria-label="Music notation">
      <svg
        viewBox={`0 0 ${staffMetrics.width} ${staffMetrics.height}`}
        role="img"
        aria-label="Grand staff"
      >
        <g className="staff-lines">
          {staffLines.map((line) => (
            <line
              key={`treble-${line}`}
              x1="92"
              x2="492"
              y1={staffMetrics.trebleTop + line * staffMetrics.spacing}
              y2={staffMetrics.trebleTop + line * staffMetrics.spacing}
            />
          ))}
          {staffLines.map((line) => (
            <line
              key={`bass-${line}`}
              x1="92"
              x2="492"
              y1={staffMetrics.bassTop + line * staffMetrics.spacing}
              y2={staffMetrics.bassTop + line * staffMetrics.spacing}
            />
          ))}
        </g>

        <text className="clef clef-treble" x="28" y="122">
          𝄞
        </text>
        <text className="clef clef-bass" x="30" y="278">
          𝄢
        </text>

        {placements.map((placement) => (
          <g
            key={`${placement.label}-${placement.x}-${placement.y}`}
            className="staff-note-group"
            style={noteCssVars(placement.pitchClass)}
          >
            {placement.ledgerLines.map((lineY) => (
              <line
                className="ledger-line"
                key={lineY}
                x1={placement.x - 25}
                x2={placement.x + 25}
                y1={lineY}
                y2={lineY}
              />
            ))}
            <ellipse
              className="staff-note"
              cx={placement.x}
              cy={placement.y}
              rx="23"
              ry="15"
            />
            <text className="staff-note-label" x={placement.x} y={placement.y + 4}>
              {placement.label}
            </text>
          </g>
        ))}
      </svg>
    </section>
  );
}
