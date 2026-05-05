import { describe, expect, it } from "vitest";
import {
  createInitialPanelManagerState,
  setPanelVisibility,
  togglePanel,
} from "./panelManager";

describe("panel manager", () => {
  it("starts with the three compact middle panels visible", () => {
    expect(createInitialPanelManagerState().visibility).toEqual({
      scale: true,
      chord: true,
      staff: true,
      fallingNotes: false,
    });
  });

  it("turns off compact panels when the full-width Falling Notes panel is shown", () => {
    const state = togglePanel(createInitialPanelManagerState(), "fallingNotes");

    expect(state.visibility).toEqual({
      scale: false,
      chord: false,
      staff: false,
      fallingNotes: true,
    });
  });

  it("restores a compact panel in its remembered slot by evicting Falling Notes", () => {
    const state = setPanelVisibility(
      togglePanel(createInitialPanelManagerState(), "fallingNotes"),
      "chord",
      true,
    );

    expect(state.visibility).toEqual({
      scale: false,
      chord: true,
      staff: false,
      fallingNotes: false,
    });
  });

  it("keeps a requested panel visible while evicting the oldest visible panels first", () => {
    const withoutScale = togglePanel(createInitialPanelManagerState(), "scale");
    const withScaleAgain = togglePanel(withoutScale, "scale");
    const withFallingNotes = togglePanel(withScaleAgain, "fallingNotes");

    expect(withFallingNotes.visibility.fallingNotes).toBe(true);
    expect(withFallingNotes.visibility.scale).toBe(false);
    expect(withFallingNotes.visibility.chord).toBe(false);
    expect(withFallingNotes.visibility.staff).toBe(false);
  });
});
