import { spawn, type ChildProcess } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";

import { afterEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const electronPath = require("electron") as string;
const spawnedElectronProcesses: ChildProcess[] = [];
const tempDirs: string[] = [];

interface ThemeSnapshot {
  theme: string | undefined;
  panelBackground: string;
}

describe("theme browser styles", () => {
  it("computes a light panel background after toggling themes", async () => {
    const page = await launchThemeFixture();

    const darkTheme = await readThemeSnapshot(page);
    await page.evaluate(
      `document.querySelector("[data-theme-toggle]")?.click()`,
    );
    const lightTheme = await readThemeSnapshot(page);

    expect(darkTheme.theme).toBe("dark");
    expect(lightTheme.theme).toBe("light");
    expect(lightTheme.panelBackground).not.toBe(darkTheme.panelBackground);
    expect(getRelativeLuminance(darkTheme.panelBackground)).toBeLessThan(0.2);
    expect(getRelativeLuminance(lightTheme.panelBackground)).toBeGreaterThan(
      0.82,
    );

    page.close();
  }, 20_000);
});

afterEach(async () => {
  await Promise.all(
    spawnedElectronProcesses.splice(0).map((process) => stopProcess(process)),
  );

  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

async function launchThemeFixture(): Promise<DevToolsPage> {
  const tempDir = mkdtempSync(join(tmpdir(), "poleski-theme-"));
  tempDirs.push(tempDir);

  const htmlPath = join(tempDir, "index.html");
  const mainPath = join(tempDir, "main.cjs");
  const styles = readFileSync(join(__dirname, "styles.css"), "utf8");

  writeFileSync(
    htmlPath,
    `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>${styles}</style>
  </head>
  <body>
    <div class="app-shell" data-theme="dark">
      <header class="top-bar">
        <div class="status-group signal-status">
          <span class="status-dot status-dot-warn"></span>
          <div class="level-meter" aria-label="Audio level"><span></span></div>
          <button class="theme-toggle-button" type="button" data-theme-toggle>
            <span aria-hidden="true">theme</span>
          </button>
        </div>
      </header>
      <main class="practice-surface">
        <div class="middle-grid">
          <section class="scale-panel practice-panel" data-practice-panel></section>
        </div>
      </main>
      <section class="piano-panel"></section>
    </div>
    <script>
      document.querySelector("[data-theme-toggle]").addEventListener("click", () => {
        const shell = document.querySelector(".app-shell");
        shell.dataset.theme = shell.dataset.theme === "dark" ? "light" : "dark";
      });
    </script>
  </body>
</html>`,
  );
  writeFileSync(
    mainPath,
    `const { app, BrowserWindow } = require("electron");

app.whenReady().then(async () => {
  const window = new BrowserWindow({
    show: false,
    width: 980,
    height: 660,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  await window.loadFile(${JSON.stringify(htmlPath)});
});

app.on("window-all-closed", () => app.quit());`,
  );

  const port = await getAvailablePort();
  const electronProcess = spawn(
    electronPath,
    [`--remote-debugging-port=${port}`, "--disable-gpu", mainPath],
    {
      env: {
        ...process.env,
        ELECTRON_DISABLE_SECURITY_WARNINGS: "true",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  spawnedElectronProcesses.push(electronProcess);

  let stderr = "";
  electronProcess.stderr?.on("data", (chunk: Buffer) => {
    stderr += chunk.toString();
  });
  electronProcess.stdout?.resume();

  const webSocketUrl = await getWebSocketDebuggerUrl(port, htmlPath, () => stderr);
  const page = new DevToolsPage(new WebSocket(webSocketUrl));

  await page.evaluate(`new Promise((resolve) => {
    const waitForFixture = () => {
      if (document.querySelector(".app-shell")) {
        resolve(true);
        return;
      }

      setTimeout(waitForFixture, 20);
    };

    waitForFixture();
  })`);

  return page;
}

async function getWebSocketDebuggerUrl(
  port: number,
  htmlPath: string,
  getErrorOutput: () => string,
): Promise<string> {
  const expectedUrl = `file://${htmlPath}`;

  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const targets = (await fetch(`http://127.0.0.1:${port}/json/list`).then(
        (response) => response.json(),
      )) as Array<{ url: string; webSocketDebuggerUrl?: string }>;
      const target = targets.find(
        (item) =>
          item.url === expectedUrl && item.webSocketDebuggerUrl !== undefined,
      );

      if (target?.webSocketDebuggerUrl) {
        return target.webSocketDebuggerUrl;
      }
    } catch {
      // Wait for Electron to expose the remote-debugging endpoint.
    }

    await delay(100);
  }

  throw new Error(
    `Electron theme fixture did not expose a debugger target.\n${getErrorOutput()}`,
  );
}

async function readThemeSnapshot(page: DevToolsPage): Promise<ThemeSnapshot> {
  return page.evaluate<ThemeSnapshot>(`(() => {
    const shell = document.querySelector(".app-shell");
    const panel = document.querySelector("[data-practice-panel]");

    return {
      theme: shell?.dataset.theme,
      panelBackground: panel ? getComputedStyle(panel).backgroundColor : "",
    };
  })()`);
}

class DevToolsPage {
  private nextMessageId = 0;
  private pendingMessages = new Map<number, (message: DevToolsMessage) => void>();

  constructor(private readonly socket: WebSocket) {
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data.toString()) as DevToolsMessage;

      if (message.id && this.pendingMessages.has(message.id)) {
        this.pendingMessages.get(message.id)?.(message);
        this.pendingMessages.delete(message.id);
      }
    };
  }

  async evaluate<T>(expression: string): Promise<T> {
    await this.open();
    const message = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });

    if (message.result.exceptionDetails) {
      throw new Error(
        `Evaluation failed: ${JSON.stringify(message.result.exceptionDetails)}`,
      );
    }

    return message.result.result.value as T;
  }

  close(): void {
    this.socket.close();
  }

  private async open(): Promise<void> {
    if (this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      this.socket.onopen = () => resolve();
      this.socket.onerror = () => reject(new Error("DevTools WebSocket failed"));
    });
  }

  private async send(
    method: string,
    params: Record<string, unknown>,
  ): Promise<DevToolsMessage> {
    const id = (this.nextMessageId += 1);

    this.socket.send(JSON.stringify({ id, method, params }));

    return new Promise((resolve) => {
      this.pendingMessages.set(id, resolve);
    });
  }
}

interface DevToolsMessage {
  id?: number;
  result: {
    exceptionDetails?: unknown;
    result: {
      value: unknown;
    };
  };
}

function getRelativeLuminance(cssColor: string): number {
  const [red, green, blue] = parseCssColor(cssColor).map((value) => {
    const channel = value / 255;

    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function parseCssColor(cssColor: string): [number, number, number] {
  const srgbMatch = cssColor.match(
    /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/,
  );

  if (srgbMatch) {
    return [
      Number(srgbMatch[1]) * 255,
      Number(srgbMatch[2]) * 255,
      Number(srgbMatch[3]) * 255,
    ];
  }

  const rgbMatch = cssColor.match(
    /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/,
  );

  if (rgbMatch) {
    return [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])];
  }

  throw new Error(`Unsupported CSS color: ${cssColor}`);
}

function getAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();

    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();

      if (address && typeof address === "object") {
        server.close(() => resolve(address.port));
      } else {
        reject(new Error("Could not allocate a local port"));
      }
    });
  });
}

async function stopProcess(process: ChildProcess): Promise<void> {
  if (process.exitCode !== null || process.killed) {
    return;
  }

  process.kill();

  await Promise.race([
    new Promise<void>((resolve) => process.once("exit", () => resolve())),
    delay(1_000),
  ]);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
