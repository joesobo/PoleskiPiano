import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  main: {
    resolve: {
      alias: {
        "@main": resolve("src/main"),
      },
    },
  },
  preload: {
    resolve: {
      alias: {
        "@preload": resolve("src/preload"),
      },
    },
  },
  renderer: {
    root: "src/renderer",
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
      },
    },
    plugins: [react()],
  },
});
