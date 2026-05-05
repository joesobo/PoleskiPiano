import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import type { PanelId, PanelVisibility } from "../shared/panels";

contextBridge.exposeInMainWorld("poleskiPiano", {
  platform: process.platform,
  versions: {
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
  onThemeToggle: (callback: () => void) => {
    const listener = (): void => callback();

    ipcRenderer.on("theme:toggle", listener);

    return () => ipcRenderer.removeListener("theme:toggle", listener);
  },
  setThemeMode: (themeMode: "dark" | "light") => {
    ipcRenderer.send("theme:mode-changed", themeMode);
  },
  onPanelToggle: (callback: (panelId: PanelId) => void) => {
    const listener = (_event: IpcRendererEvent, panelId: PanelId): void =>
      callback(panelId);

    ipcRenderer.on("panel:toggle", listener);

    return () => ipcRenderer.removeListener("panel:toggle", listener);
  },
  setPanelVisibility: (panelVisibility: PanelVisibility) => {
    ipcRenderer.send("panels:visibility-changed", panelVisibility);
  },
  listPracticeSongs: () =>
    ipcRenderer.invoke("practice-songs:list") as Promise<Record<string, string>>,
  savePracticeSong: (request: {
    path: string;
    overwrite: boolean;
    contents: string;
  }) =>
    ipcRenderer.invoke("practice-songs:save", request) as Promise<{
      path: string;
      files: Record<string, string>;
    }>,
});
