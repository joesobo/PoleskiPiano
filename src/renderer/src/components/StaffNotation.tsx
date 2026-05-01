import { useEffect, useRef, useState } from "react";
import { noteCssVars } from "../music/colors";
import {
  type StaffInputTarget,
  getStaffPlacements,
  getStaffPlacementsForGroups,
  getStaffInputTargetFromPoint,
  staffMetrics,
} from "../music/staff";

interface StaffNotationProps {
  activeMidiNotes: number[];
  activeMidiNoteGroups?: number[][];
  previewMidiNotes?: number[];
  onNoteInputStart?: (midi: number) => void;
  onInputStop?: () => void;
  inputResetKey?: number;
}

export function StaffNotation({
  activeMidiNotes,
  activeMidiNoteGroups,
  previewMidiNotes = [],
  onNoteInputStart,
  onInputStop,
  inputResetKey,
}: StaffNotationProps): React.ReactElement {
  const activePointerIdRef = useRef<number | null>(null);
  const [hoverTarget, setHoverTarget] = useState<StaffInputTarget | null>(null);

  useEffect(() => {
    activePointerIdRef.current = null;
    setHoverTarget(null);
  }, [inputResetKey]);

  const handlePointerDown = (
    event: React.PointerEvent<SVGSVGElement>,
  ): void => {
    const target = getStaffTargetFromPointerEvent(event);

    if (!target || activePointerIdRef.current !== null) {
      return;
    }

    event.preventDefault();
    activePointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    setHoverTarget(null);
    onNoteInputStart?.(target.midi);
  };

  const handlePointerMove = (
    event: React.PointerEvent<SVGSVGElement>,
  ): void => {
    const target = getStaffTargetFromPointerEvent(event);

    if (activePointerIdRef.current === event.pointerId) {
      if (target) {
        onNoteInputStart?.(target.midi);
      }

      return;
    }

    setHoverTarget(target);
  };

  const handlePointerLeave = (): void => {
    if (activePointerIdRef.current === null) {
      setHoverTarget(null);
    }
  };

  const stopPointerInput = (
    event: React.PointerEvent<SVGSVGElement>,
  ): void => {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }

    activePointerIdRef.current = null;
    setHoverTarget(null);
    onInputStop?.();
  };

  return (
    <StaffNotationView
      activeMidiNotes={activeMidiNotes}
      activeMidiNoteGroups={activeMidiNoteGroups}
      previewMidiNotes={previewMidiNotes}
      hoverTarget={hoverTarget}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerUp={stopPointerInput}
      onPointerCancel={stopPointerInput}
      onLostPointerCapture={stopPointerInput}
    />
  );
}

interface StaffNotationViewProps {
  activeMidiNotes: number[];
  activeMidiNoteGroups?: number[][];
  previewMidiNotes: number[];
  hoverTarget?: StaffInputTarget | null;
  onPointerDown?: React.PointerEventHandler<SVGSVGElement>;
  onPointerMove?: React.PointerEventHandler<SVGSVGElement>;
  onPointerLeave?: React.PointerEventHandler<SVGSVGElement>;
  onPointerUp?: React.PointerEventHandler<SVGSVGElement>;
  onPointerCancel?: React.PointerEventHandler<SVGSVGElement>;
  onLostPointerCapture?: React.PointerEventHandler<SVGSVGElement>;
}

export function StaffNotationView({
  activeMidiNotes,
  activeMidiNoteGroups,
  previewMidiNotes,
  hoverTarget = null,
  onPointerDown,
  onPointerMove,
  onPointerLeave,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
}: StaffNotationViewProps): React.ReactElement {
  const placements = activeMidiNoteGroups
    ? getStaffPlacementsForGroups(activeMidiNoteGroups)
    : getStaffPlacements(activeMidiNotes);
  const previewPlacements =
    previewMidiNotes.length > 0
      ? getStaffPlacementsForGroups([previewMidiNotes])
      : [];
  const staffLines = [0, 1, 2, 3, 4];

  return (
    <section className="staff-panel practice-panel" aria-label="Music notation">
      <svg
        viewBox={`0 0 ${staffMetrics.width} ${staffMetrics.height}`}
        role="img"
        aria-label="Grand staff"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onLostPointerCapture={onLostPointerCapture}
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

        {hoverTarget ? (
          <g
            className="staff-note-group staff-note-group-hover"
            style={noteCssVars(hoverTarget.placement.pitchClass)}
          >
            {hoverTarget.placement.ledgerLines.map((lineY) => (
              <line
                className="ledger-line"
                key={lineY}
                x1={hoverTarget.placement.x - 30}
                x2={hoverTarget.placement.x + 30}
                y1={lineY}
                y2={lineY}
              />
            ))}
            <ellipse
              className="staff-note"
              cx={hoverTarget.placement.x}
              cy={hoverTarget.placement.y}
              rx="21"
              ry="10"
            />
            <text
              className="staff-note-label"
              x={hoverTarget.placement.x}
              y={hoverTarget.placement.y + 4}
            >
              {hoverTarget.placement.label}
            </text>
          </g>
        ) : null}

        {previewPlacements.map((placement) => (
          <g
            key={`preview-${placement.label}-${placement.x}-${placement.y}`}
            className="staff-note-group staff-note-group-preview"
            style={noteCssVars(placement.pitchClass)}
          >
            {placement.ledgerLines.map((lineY) => (
              <line
                className="ledger-line"
                key={lineY}
                x1={placement.x - 30}
                x2={placement.x + 30}
                y1={lineY}
                y2={lineY}
              />
            ))}
            <ellipse
              className="staff-note"
              cx={placement.x}
              cy={placement.y}
              rx="21"
              ry="10"
            />
            <text
              className="staff-note-label"
              x={placement.x}
              y={placement.y + 4}
            >
              {placement.label}
            </text>
          </g>
        ))}

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
                x1={placement.x - 30}
                x2={placement.x + 30}
                y1={lineY}
                y2={lineY}
              />
            ))}
            <ellipse
              className="staff-note"
              cx={placement.x}
              cy={placement.y}
              rx="21"
              ry="10"
            />
            <text
              className="staff-note-label"
              x={placement.x}
              y={placement.y + 4}
            >
              {placement.label}
            </text>
          </g>
        ))}
      </svg>
    </section>
  );
}

function getStaffTargetFromPointerEvent(
  event: React.PointerEvent<SVGSVGElement>,
): StaffInputTarget | null {
  const point = mapClientPointToStaffViewBox(
    { clientX: event.clientX, clientY: event.clientY },
    event.currentTarget.getBoundingClientRect(),
  );

  return getStaffInputTargetFromPoint(point);
}

interface StaffClientPoint {
  clientX: number;
  clientY: number;
}

interface StaffClientRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function mapClientPointToStaffViewBox(
  point: StaffClientPoint,
  rect: StaffClientRect,
): { x: number; y: number } {
  const scale = Math.min(
    rect.width / staffMetrics.width,
    rect.height / staffMetrics.height,
  );
  const renderedWidth = staffMetrics.width * scale;
  const renderedHeight = staffMetrics.height * scale;
  const offsetX = (rect.width - renderedWidth) / 2;
  const offsetY = (rect.height - renderedHeight) / 2;

  return {
    x: (point.clientX - rect.left - offsetX) / scale,
    y: (point.clientY - rect.top - offsetY) / scale,
  };
}
