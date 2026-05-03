import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import {
  listPracticeSongFiles,
  savePracticeSongFile,
} from "./src/main/practiceSongFiles";

const practiceSongsEndpoint = "/__poleski-piano/practice-songs";

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
    plugins: [practiceSongDevServerPlugin(), react()],
  },
});

function practiceSongDevServerPlugin(): Plugin {
  return {
    name: "poleski-piano-practice-song-dev-server",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const url = request.url ?? "";

        try {
          if (request.method === "GET" && url === practiceSongsEndpoint) {
            sendJson(response, 200, await listPracticeSongFiles());
            return;
          }

          if (
            request.method === "POST" &&
            url === `${practiceSongsEndpoint}/save`
          ) {
            sendJson(
              response,
              200,
              await savePracticeSongFile(await readJsonRequest(request)),
            );
            return;
          }
        } catch (error) {
          sendJson(response, 400, {
            error: error instanceof Error ? error.message : "Practice Song error",
          });
          return;
        }

        next();
      });
    },
  };
}

function sendJson(
  response: ServerResponse,
  statusCode: number,
  payload: unknown,
): void {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(payload));
}

async function readJsonRequest(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
