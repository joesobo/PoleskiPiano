export {};

import type { PanelId, PanelVisibility } from "../../../shared/panels";

declare global {
  interface Window {
    poleskiPiano?: {
      platform: NodeJS.Platform;
      versions: {
        chrome: string;
        electron: string;
      };
      onThemeToggle?: (callback: () => void) => () => void;
      setThemeMode?: (themeMode: "dark" | "light") => void;
      onPanelToggle?: (callback: (panelId: PanelId) => void) => () => void;
      setPanelVisibility?: (panelVisibility: PanelVisibility) => void;
      listPracticeSongs?: () => Promise<Record<string, string>>;
      savePracticeSong?: (request: {
        path: string;
        overwrite: boolean;
        contents: string;
      }) => Promise<{
        path: string;
        files: Record<string, string>;
      }>;
    };
  }
}
