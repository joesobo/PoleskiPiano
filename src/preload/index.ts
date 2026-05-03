import { contextBridge, ipcRenderer } from "electron";

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
  listPracticeSongs: () =>
    ipcRenderer.invoke("practice-songs:list") as Promise<Record<string, string>>,
  savePracticeSong: (request: {
    path: string;
    overwrite: boolean;
    song: {
      title: string;
      scale?: string;
      steps: string[];
    };
  }) =>
    ipcRenderer.invoke("practice-songs:save", request) as Promise<{
      path: string;
      files: Record<string, string>;
    }>,
});
