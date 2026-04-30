import { describe, expect, it } from "vitest";
import { getStaffPlacements } from "./staff";

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
});
