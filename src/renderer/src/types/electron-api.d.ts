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
    };
  }
}
