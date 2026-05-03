export {};

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
      listPracticeSongs?: () => Promise<Record<string, string>>;
      savePracticeSong?: (request: {
        path: string;
        overwrite: boolean;
        song: {
          title: string;
          scale?: string;
          steps: string[];
        };
      }) => Promise<{
        path: string;
        files: Record<string, string>;
      }>;
    };
  }
}
