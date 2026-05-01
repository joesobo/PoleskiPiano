import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  shell,
  session,
  type MenuItemConstructorOptions,
} from "electron";
import { join } from "node:path";

app.commandLine.appendSwitch("enable-features", "WebMidi");
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

const isMac = process.platform === "darwin";
type ThemeMode = "dark" | "light";

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
  const appMenu: MenuItemConstructorOptions[] = isMac
    ? [
        {
          label: app.name,
          submenu: [
            { role: "about" },
            { type: "separator" },
            { role: "services" },
            { type: "separator" },
            { role: "hide" },
            { role: "hideOthers" },
            { role: "unhide" },
            { type: "separator" },
            { role: "quit" },
          ],
        },
      ]
    : [];
  const fileSubmenu: MenuItemConstructorOptions[] = [
    isMac ? { role: "close" } : { role: "quit" },
  ];
  const platformEditSubmenu: MenuItemConstructorOptions[] = isMac
    ? [
        { role: "pasteAndMatchStyle" },
        { role: "delete" },
        { role: "selectAll" },
      ]
    : [{ role: "delete" }, { type: "separator" }, { role: "selectAll" }];
  const editSubmenu: MenuItemConstructorOptions[] = [
    { role: "undo" },
    { role: "redo" },
    { type: "separator" },
    { role: "cut" },
    { role: "copy" },
    { role: "paste" },
    ...platformEditSubmenu,
  ];
  const viewSubmenu: MenuItemConstructorOptions[] = [
    {
      id: "appearance-toggle",
      label: "Use Light Appearance",
      accelerator: "CmdOrCtrl+Shift+L",
      click: () => {
        for (const window of BrowserWindow.getAllWindows()) {
          window.webContents.send("theme:toggle");
        }
      },
    },
    { type: "separator" },
    { role: "reload" },
    { role: "toggleDevTools" },
    { type: "separator" },
    { role: "resetZoom" },
    { role: "zoomIn" },
    { role: "zoomOut" },
  ];
  const windowSubmenu: MenuItemConstructorOptions[] = [
    isMac ? { role: "minimize" } : { role: "close" },
  ];
  const template: MenuItemConstructorOptions[] = [
    ...appMenu,
    {
      label: "File",
      submenu: fileSubmenu,
    },
    {
      label: "Edit",
      submenu: editSubmenu,
    },
    {
      label: "View",
      submenu: viewSubmenu,
    },
    {
      role: "window",
      submenu: windowSubmenu,
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function configureThemeMenuUpdates(): void {
  ipcMain.on("theme:mode-changed", (_event, themeMode: ThemeMode) => {
    updateAppearanceMenuLabel(themeMode);
  });
}

function updateAppearanceMenuLabel(themeMode: ThemeMode): void {
  const menuItem = Menu.getApplicationMenu()?.getMenuItemById("appearance-toggle");

  if (menuItem) {
    menuItem.label =
      themeMode === "dark" ? "Use Light Appearance" : "Use Dark Appearance";
  }
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
  configureApplicationMenu();
  configureThemeMenuUpdates();
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
