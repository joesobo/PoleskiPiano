import type { MenuItemConstructorOptions } from "electron";
import { describe, expect, it } from "vitest";
import { DEFAULT_PANEL_VISIBILITY } from "../shared/panels";
import { createApplicationMenuTemplate } from "./appMenu";

describe("application menu", () => {
  it("creates labeled native menu items so macOS does not receive zero-height custom rows", () => {
    const template = createApplicationMenuTemplate({
      isMac: true,
      panelVisibility: DEFAULT_PANEL_VISIBILITY,
      onTogglePanel: () => undefined,
    });

    for (const item of flattenMenuItems(template)) {
      if (item.type === "separator") {
        continue;
      }

      expect(item.label).toEqual(expect.any(String));
      expect(item.label?.trim().length).toBeGreaterThan(0);
    }
  });

  it("adds View menu checkbox items for every practice panel", () => {
    const template = createApplicationMenuTemplate({
      isMac: false,
      panelVisibility: DEFAULT_PANEL_VISIBILITY,
      onTogglePanel: () => undefined,
    });
    const viewMenu = template.find((item) => item.label === "View");
    const panelMenu = getSubmenuItems(viewMenu).find(
      (item) => item.label === "Panels",
    );

    expect(getSubmenuItems(panelMenu).map((item) => item.label)).toEqual([
      "Scale Wheel",
      "Chord Display",
      "Grand Staff",
      "Falling Notes",
    ]);
    expect(getSubmenuItems(panelMenu).map((item) => item.type)).toEqual([
      "checkbox",
      "checkbox",
      "checkbox",
      "checkbox",
    ]);
  });

  it("keeps appearance switching out of the native View menu", () => {
    const template = createApplicationMenuTemplate({
      isMac: false,
      panelVisibility: DEFAULT_PANEL_VISIBILITY,
      onTogglePanel: () => undefined,
    });
    const viewMenu = template.find((item) => item.label === "View");
    const viewItems = getSubmenuItems(viewMenu);

    expect(viewItems.map((item) => item.id)).not.toContain("appearance-toggle");
    expect(viewItems.map((item) => item.label)).not.toContain(
      "Use Light Appearance",
    );
    expect(viewItems.map((item) => item.label)).not.toContain(
      "Use Dark Appearance",
    );
  });
});

function flattenMenuItems(
  items: MenuItemConstructorOptions[],
): MenuItemConstructorOptions[] {
  return items.flatMap((item) => [item, ...flattenMenuItems(getSubmenuItems(item))]);
}

function getSubmenuItems(
  item: MenuItemConstructorOptions | undefined,
): MenuItemConstructorOptions[] {
  return Array.isArray(item?.submenu) ? item.submenu : [];
}
