export {};

declare global {
  interface Window {
    poleskiPiano?: {
      platform: NodeJS.Platform;
      versions: {
        chrome: string;
        electron: string;
      };
    };
  }
}
