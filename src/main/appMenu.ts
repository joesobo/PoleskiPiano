import type { MenuItemConstructorOptions } from "electron";
import {
  PANEL_DEFINITIONS,
  type PanelId,
  type PanelVisibility,
} from "../shared/panels";

export type ThemeMode = "dark" | "light";

export interface ApplicationMenuOptions {
  isMac: boolean;
  panelVisibility: PanelVisibility;
  onToggleAppearance: () => void;
  onTogglePanel: (panelId: PanelId) => void;
}

export function createApplicationMenuTemplate({
  isMac,
  panelVisibility,
  onToggleAppearance,
  onTogglePanel,
}: ApplicationMenuOptions): MenuItemConstructorOptions[] {
  const appMenu: MenuItemConstructorOptions[] = isMac
    ? [
        {
          label: "PoleskiPiano",
          submenu: [
            { role: "about", label: "About PoleskiPiano" },
            { type: "separator" },
            { role: "services", label: "Services" },
            { type: "separator" },
            { role: "hide", label: "Hide PoleskiPiano" },
            { role: "hideOthers", label: "Hide Others" },
            { role: "unhide", label: "Show All" },
            { type: "separator" },
            { role: "quit", label: "Quit PoleskiPiano" },
          ],
        },
      ]
    : [];
  const fileSubmenu: MenuItemConstructorOptions[] = [
    isMac
      ? { role: "close", label: "Close Window" }
      : { role: "quit", label: "Quit" },
  ];
  const platformEditSubmenu: MenuItemConstructorOptions[] = isMac
    ? [
        { role: "pasteAndMatchStyle", label: "Paste and Match Style" },
        { role: "delete", label: "Delete" },
        { role: "selectAll", label: "Select All" },
      ]
    : [
        { role: "delete", label: "Delete" },
        { type: "separator" },
        { role: "selectAll", label: "Select All" },
      ];
  const editSubmenu: MenuItemConstructorOptions[] = [
    { role: "undo", label: "Undo" },
    { role: "redo", label: "Redo" },
    { type: "separator" },
    { role: "cut", label: "Cut" },
    { role: "copy", label: "Copy" },
    { role: "paste", label: "Paste" },
    ...platformEditSubmenu,
  ];
  const panelSubmenu: MenuItemConstructorOptions[] = PANEL_DEFINITIONS.map(
    (definition) => ({
      id: `panel:${definition.id}`,
      label: definition.label,
      type: "checkbox",
      checked: panelVisibility[definition.id],
      click: () => onTogglePanel(definition.id),
    }),
  );
  const viewSubmenu: MenuItemConstructorOptions[] = [
    {
      id: "appearance-toggle",
      label: "Use Light Appearance",
      accelerator: "CmdOrCtrl+Shift+L",
      click: onToggleAppearance,
    },
    { type: "separator" },
    {
      label: "Panels",
      submenu: panelSubmenu,
    },
    { type: "separator" },
    { role: "reload", label: "Reload" },
    { role: "toggleDevTools", label: "Toggle Developer Tools" },
    { type: "separator" },
    { role: "resetZoom", label: "Actual Size" },
    { role: "zoomIn", label: "Zoom In" },
    { role: "zoomOut", label: "Zoom Out" },
  ];
  const windowSubmenu: MenuItemConstructorOptions[] = [
    isMac
      ? { role: "minimize", label: "Minimize" }
      : { role: "close", label: "Close" },
  ];

  return [
    ...appMenu,
    {
      label: "File",
      submenu: fileSubmenu,
    },
    {
      label: "Edit",
      submenu: editSubmenu,
    },
    {
      label: "View",
      submenu: viewSubmenu,
    },
    {
      label: "Window",
      role: "window",
      submenu: windowSubmenu,
    },
  ];
}
