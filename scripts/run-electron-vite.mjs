#!/usr/bin/env node
import { spawn, execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import electronBinaryPath from "electron";

const APP_NAME = "PoleskiPiano";
const APP_BUNDLE_ID = "com.poleski.piano";
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");
const DEV_ELECTRON_DIST = join(REPO_ROOT, ".electron-dev");
const DEV_ELECTRON_APP = join(DEV_ELECTRON_DIST, `${APP_NAME}.app`);
const DEV_ELECTRON_BINARY = join(
  DEV_ELECTRON_APP,
  `Contents/MacOS/${APP_NAME}`,
);
const MARKER_PATH = join(DEV_ELECTRON_DIST, ".poleski-electron.json");
const ELECTRON_VITE_CLI = join(
  REPO_ROOT,
  "node_modules/electron-vite/bin/electron-vite.js",
);

const electronViteArgs = process.argv.slice(2);

if (electronViteArgs.length === 0) {
  console.error("Usage: node scripts/run-electron-vite.mjs <dev|preview> [...args]");
  process.exit(1);
}

prepareDevElectronApp();

const child = spawn(process.execPath, [ELECTRON_VITE_CLI, ...electronViteArgs], {
  cwd: REPO_ROOT,
  env: {
    ...process.env,
    ELECTRON_EXEC_PATH: DEV_ELECTRON_BINARY,
    ELECTRON_OVERRIDE_DIST_PATH: DEV_ELECTRON_DIST,
  },
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

function prepareDevElectronApp() {
  const sourceApp = getElectronAppPath(electronBinaryPath);
  const marker = {
    appName: APP_NAME,
    bundleId: APP_BUNDLE_ID,
    sourceApp,
    version: 3,
  };

  mkdirSync(DEV_ELECTRON_DIST, { recursive: true });

  const shouldRefresh = !existsSync(DEV_ELECTRON_APP) || !sameMarker(marker);

  if (shouldRefresh) {
    if (existsSync(DEV_ELECTRON_APP)) {
      renameSync(
        DEV_ELECTRON_APP,
        join(DEV_ELECTRON_DIST, `${APP_NAME}.app.stale-${Date.now()}`),
      );
    }

    cpSync(sourceApp, DEV_ELECTRON_APP, {
      recursive: true,
      force: true,
      preserveTimestamps: true,
      verbatimSymlinks: true,
    });

    renameSync(
      join(DEV_ELECTRON_APP, "Contents/MacOS/Electron"),
      DEV_ELECTRON_BINARY,
    );
  }

  patchInfoPlist(join(DEV_ELECTRON_APP, "Contents/Info.plist"));
  writeFileSync(MARKER_PATH, `${JSON.stringify(marker, null, 2)}\n`);
}

function getElectronAppPath(binaryPath) {
  const marker = `${join("Electron.app", "Contents", "MacOS", "Electron")}`;

  if (!binaryPath.endsWith(marker)) {
    throw new Error(`Unexpected Electron binary path: ${binaryPath}`);
  }

  return binaryPath.slice(0, -"/Contents/MacOS/Electron".length);
}

function sameMarker(marker) {
  try {
    return readFileSync(MARKER_PATH, "utf8") === `${JSON.stringify(marker, null, 2)}\n`;
  } catch {
    return false;
  }
}

function patchInfoPlist(plistPath) {
  setPlistString(plistPath, "CFBundleDisplayName", APP_NAME);
  setPlistString(plistPath, "CFBundleExecutable", APP_NAME);
  setPlistString(plistPath, "CFBundleName", APP_NAME);
  setPlistString(plistPath, "CFBundleIdentifier", APP_BUNDLE_ID);
}

function setPlistString(plistPath, key, value) {
  const plistBuddy = "/usr/libexec/PlistBuddy";

  try {
    execFileSync(plistBuddy, ["-c", `Set :${key} ${value}`, plistPath]);
  } catch {
    execFileSync(plistBuddy, ["-c", `Add :${key} string ${value}`, plistPath]);
  }
}
