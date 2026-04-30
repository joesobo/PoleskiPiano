import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("poleskiPiano", {
  platform: process.platform,
  versions: {
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
});
