import { describe, expect, it } from "vitest";
import {
  getStaffPlacements,
  getStaffPlacementsForGroups,
  getStaffInputTargetFromPoint,
  getStaffPlacementForMidi,
  groupTimedMidiNotesForStaff,
  orderTimedMidiNotesForStaff,
} from "./staff";

describe("staff placements", () => {
  it("places middle C on the treble staff with a ledger line", () => {
    const [middleC] = getStaffPlacements([60]);

    expect(middleC.clef).toBe("treble");
    expect(middleC.label).toBe("C");
    expect(middleC.ledgerLines.length).toBeGreaterThan(0);
  });

  it("places C2 on the bass staff", () => {
    const [lowC] = getStaffPlacements([36]);

    expect(lowC.clef).toBe("bass");
    expect(lowC.label).toBe("C");
    expect(lowC.ledgerLines.length).toBeGreaterThan(0);
  });

  it("keeps pressed order when assigning horizontal note positions", () => {
    const placements = getStaffPlacements([60, 59]);

    expect(placements.map((placement) => placement.label)).toEqual(["C", "B"]);
    expect(placements[0].x).toBeLessThan(placements[1].x);
  });

  it("stacks simultaneous chord notes in one horizontal notation slot", () => {
    const placements = getStaffPlacementsForGroups([[60, 64, 67]]);

    expect(placements.map((placement) => placement.label)).toEqual([
      "C",
      "E",
      "G",
    ]);
    expect(new Set(placements.map((placement) => placement.x))).toHaveLength(1);
  });

  it("keeps separate note groups left-to-right", () => {
    const placements = getStaffPlacementsForGroups([[60], [64, 67]]);

    expect(placements[0].x).toBeLessThan(placements[1].x);
    expect(placements[1].x).toBe(placements[2].x);
  });

  it("keeps sequential active notes in onset order", () => {
    expect(
      orderTimedMidiNotesForStaff([
        { midi: 60, receivedAt: 1000 },
        { midi: 59, receivedAt: 1300 },
      ]),
    ).toEqual([60, 59]);
  });

  it("orders simultaneous active notes from lower pitch to higher pitch", () => {
    expect(
      orderTimedMidiNotesForStaff([
        { midi: 60, receivedAt: 1000 },
        { midi: 59, receivedAt: 1005 },
      ]),
    ).toEqual([59, 60]);
  });

  it("groups simultaneous active notes for staff chord stacking", () => {
    expect(
      groupTimedMidiNotesForStaff([
        { midi: 60, receivedAt: 1000 },
        { midi: 67, receivedAt: 1008 },
        { midi: 64, receivedAt: 1004 },
        { midi: 72, receivedAt: 1300 },
      ]),
    ).toEqual([[60, 64, 67], [72]]);
  });

  it("treats realistic same-chord MIDI timing as one staff group", () => {
    expect(
      groupTimedMidiNotesForStaff([
        { midi: 60, receivedAt: 1000 },
        { midi: 64, receivedAt: 1120 },
        { midi: 67, receivedAt: 1240 },
      ]),
    ).toEqual([[60, 64, 67]]);
  });

  it("maps a grand staff point to the nearest natural note in range", () => {
    const d3Placement = getStaffPlacementForMidi(50);

    expect(
      getStaffInputTargetFromPoint({
        x: 320,
        y: d3Placement.y,
      }),
    ).toMatchObject({
      midi: 50,
      placement: {
        label: "D",
        x: 320,
      },
    });
  });

  it("does not map grand staff input outside the playable pitch band", () => {
    expect(getStaffInputTargetFromPoint({ x: 320, y: -20 })).toBeNull();
  });
});
