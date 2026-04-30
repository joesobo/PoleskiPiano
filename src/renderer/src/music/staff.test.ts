import { describe, expect, it } from "vitest";
import { getStaffPlacements, orderTimedMidiNotesForStaff } from "./staff";

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

  it("keeps sequential active notes in onset order", () => {
    expect(
      orderTimedMidiNotesForStaff([
        { midi: 60, receivedAt: 1000 },
        { midi: 59, receivedAt: 1200 },
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
});
