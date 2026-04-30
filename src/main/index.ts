import { app, BrowserWindow, shell, session } from "electron";
import { join } from "node:path";

app.commandLine.appendSwitch("enable-features", "WebMidi");
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

const isMac = process.platform === "darwin";

function configureMidiPermissions(): void {
  const allowedMidiPermissions = new Set(["midi", "midiSysex"]);

  session.defaultSession.setPermissionCheckHandler((_webContents, permission) =>
    allowedMidiPermissions.has(permission),
  );

  session.defaultSession.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      callback(allowedMidiPermissions.has(permission));
    },
  );
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 980,
    minHeight: 660,
    title: "PoleskiPiano",
    backgroundColor: "#100f0f",
    titleBarStyle: isMac ? "hiddenInset" : "default",
    trafficLightPosition: { x: 14, y: 14 },
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  configureMidiPermissions();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (!isMac) {
    app.quit();
  }
});
