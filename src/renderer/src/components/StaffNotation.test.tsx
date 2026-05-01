import { isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import {
  getStaffInputTargetFromPoint,
  getStaffPlacementForMidi,
  staffMetrics,
} from "../music/staff";
import { StaffNotationView, mapClientPointToStaffViewBox } from "./StaffNotation";

describe("StaffNotation", () => {
  it("keeps note heads small enough for line and space placement to read cleanly", () => {
    const notation = StaffNotationView({
      activeMidiNotes: [62, 64, 65],
      previewMidiNotes: [],
    });
    const [noteHead] = collectElements(notation, "ellipse");

    expect(Number(noteHead.props.ry)).toBeLessThanOrEqual(
      staffMetrics.spacing / 2 + 2,
    );
  });

  it("stacks preview chord notes in one horizontal notation slot", () => {
    const notation = StaffNotationView({
      activeMidiNotes: [],
      previewMidiNotes: [53, 57, 60],
    });
    const noteHeads = collectElements(notation, "ellipse");

    expect(new Set(noteHeads.map((noteHead) => noteHead.props.cx))).toHaveLength(
      1,
    );
  });

  it("stacks active chord notes in one horizontal notation slot", () => {
    const notation = StaffNotationView({
      activeMidiNotes: [60, 64, 67],
      activeMidiNoteGroups: [[60, 64, 67]],
      previewMidiNotes: [],
    });
    const noteHeads = collectElements(notation, "ellipse");

    expect(new Set(noteHeads.map((noteHead) => noteHead.props.cx))).toHaveLength(
      1,
    );
  });

  it("renders a local hover target for grand staff aiming", () => {
    const d3Placement = getStaffPlacementForMidi(50, 240);
    const d3Target = getStaffInputTargetFromPoint({
      x: d3Placement.x,
      y: d3Placement.y,
    });
    const notation = StaffNotationView({
      activeMidiNotes: [],
      previewMidiNotes: [],
      hoverTarget: d3Target,
    });
    const hoverGroups = collectElements(notation, "g").filter(
      (group) =>
        group.props.className === "staff-note-group staff-note-group-hover",
    );

    expect(hoverGroups).toHaveLength(1);
  });

  it("maps pointer positions through SVG letterboxing to viewBox coordinates", () => {
    expect(
      mapClientPointToStaffViewBox(
        { clientX: 270, clientY: 98 },
        { left: 10, top: 20, width: 520, height: 500 },
      ),
    ).toEqual({ x: 260, y: 0 });

    expect(
      mapClientPointToStaffViewBox(
        { clientX: 270, clientY: 442 },
        { left: 10, top: 20, width: 520, height: 500 },
      ),
    ).toEqual({ x: 260, y: 344 });
  });
});

function collectElements(
  node: ReactNode,
  type: string,
): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) {
    return node.flatMap((child) => collectElements(child, type));
  }

  if (!isValidElement(node)) {
    return [];
  }

  const element = node as ReactElement<{ children?: ReactNode | ReactNode[] }>;
  const matches =
    element.type === type ? [node as ReactElement<Record<string, unknown>>] : [];
  const children = element.props.children;

  if (!children) {
    return matches;
  }

  return [
    ...matches,
    ...(Array.isArray(children) ? children : [children]).flatMap((child) =>
      collectElements(child, type),
    ),
  ];
}
