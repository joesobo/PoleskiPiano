import { describe, expect, it } from "vitest";
import {
  getChordPreviewOptionClassName,
  getChordPreviewSelectedClassName,
} from "./TopBar";

describe("TopBar chord preview options", () => {
  it("colors chord preview options only when a scale is selected", () => {
    expect(getChordPreviewOptionClassName(true, false)).toBeUndefined();
    expect(getChordPreviewOptionClassName(true, true)).toBe(
      "is-in-scale-option",
    );
    expect(getChordPreviewOptionClassName(false, true)).toBe(
      "is-out-scale-option",
    );
  });
});

describe("TopBar chord preview selected value", () => {
  it("uses the chord preview color class for the selected value", () => {
    expect(getChordPreviewSelectedClassName()).toContain(
      "chord-preview-option-name",
    );
    expect(getChordPreviewSelectedClassName("is-in-scale-option")).toBe(
      "top-select-selected-name chord-preview-option-name is-in-scale-option",
    );
  });
});
