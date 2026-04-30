import { describe, expect, it } from "vitest";
import { getScalePitchClasses } from "./scales";

describe("scales", () => {
  it("builds C major", () => {
    expect(getScalePitchClasses({ tonic: "C", mode: "major" })).toEqual([
      "C",
      "D",
      "E",
      "F",
      "G",
      "A",
      "B",
    ]);
  });

  it("builds A natural minor", () => {
    expect(getScalePitchClasses({ tonic: "A", mode: "minor" })).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
    ]);
  });
});
