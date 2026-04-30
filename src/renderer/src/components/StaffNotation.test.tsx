import { isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { staffMetrics } from "../music/staff";
import { StaffNotation } from "./StaffNotation";

describe("StaffNotation", () => {
  it("keeps note heads small enough for line and space placement to read cleanly", () => {
    const notation = StaffNotation({ activeMidiNotes: [62, 64, 65] });
    const [noteHead] = collectElements(notation, "ellipse");

    expect(Number(noteHead.props.ry)).toBeLessThanOrEqual(
      staffMetrics.spacing / 2 + 2,
    );
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
