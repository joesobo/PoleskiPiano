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
});
