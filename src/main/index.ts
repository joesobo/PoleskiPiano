import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  shell,
  session,
} from "electron";
import { join } from "node:path";
import {
  DEFAULT_PANEL_VISIBILITY,
  PANEL_DEFINITIONS,
  type PanelId,
  type PanelVisibility,
} from "../shared/panels";
import {
  createApplicationMenuTemplate,
  type ThemeMode,
} from "./appMenu";
import {
  listPracticeSongFiles,
  savePracticeSongFile,
} from "./practiceSongFiles";

const APP_NAME = "PoleskiPiano";

app.setName(APP_NAME);
app.commandLine.appendSwitch("enable-features", "WebMidi");
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

const isMac = process.platform === "darwin";
const currentPanelVisibility: PanelVisibility = {
  ...DEFAULT_PANEL_VISIBILITY,
};

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

function configureApplicationMenu(): void {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate(
      createApplicationMenuTemplate({
        isMac,
        panelVisibility: currentPanelVisibility,
        onToggleAppearance: sendThemeToggle,
        onTogglePanel: sendPanelToggle,
      }),
    ),
  );
}

function configureThemeMenuUpdates(): void {
  ipcMain.on("theme:mode-changed", (_event, themeMode: ThemeMode) => {
    updateAppearanceMenuLabel(themeMode);
  });
}

function configurePanelMenuUpdates(): void {
  ipcMain.on(
    "panels:visibility-changed",
    (_event, panelVisibility: PanelVisibility) => {
      updatePanelMenuCheckedState(panelVisibility);
    },
  );
}

function configurePracticeSongFiles(): void {
  ipcMain.handle("practice-songs:list", async () => listPracticeSongFiles());
  ipcMain.handle(
    "practice-songs:save",
    async (_event, request: unknown) => savePracticeSongFile(request),
  );
}

function sendThemeToggle(): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send("theme:toggle");
  }
}

function sendPanelToggle(panelId: PanelId): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send("panel:toggle", panelId);
  }
}

function updateAppearanceMenuLabel(themeMode: ThemeMode): void {
  const menuItem = Menu.getApplicationMenu()?.getMenuItemById("appearance-toggle");

  if (menuItem) {
    menuItem.label =
      themeMode === "dark" ? "Use Light Appearance" : "Use Dark Appearance";
  }
}

function updatePanelMenuCheckedState(panelVisibility: PanelVisibility): void {
  for (const definition of PANEL_DEFINITIONS) {
    currentPanelVisibility[definition.id] = Boolean(
      panelVisibility[definition.id],
    );

    const menuItem = Menu.getApplicationMenu()?.getMenuItemById(
      `panel:${definition.id}`,
    );

    if (menuItem) {
      menuItem.checked = currentPanelVisibility[definition.id];
    }
  }
}

function getAppIconPath(): string {
  return process.env.ELECTRON_RENDERER_URL
    ? join(process.cwd(), "src/renderer/public/app-icon.png")
    : join(__dirname, "../renderer/app-icon.png");
}

function createWindow(): void {
  const appIconPath = getAppIconPath();
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 980,
    minHeight: 660,
    title: APP_NAME,
    icon: appIconPath,
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
  if (isMac) {
    app.dock?.setIcon(getAppIconPath());
  }

  configureApplicationMenu();
  configureThemeMenuUpdates();
  configurePanelMenuUpdates();
  configurePracticeSongFiles();
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
