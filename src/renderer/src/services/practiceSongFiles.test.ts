import { describe, expect, it, vi } from "vitest";
import {
  listPracticeSongFiles,
  savePracticeSongFile,
  type PracticeSongFileApi,
} from "./practiceSongFiles";

describe("Practice Song file service", () => {
  it("uses the Electron bridge when it is available", async () => {
    const api: PracticeSongFileApi = {
      listPracticeSongs: vi.fn(async () => ({ "songs/a.json": "{}" })),
      savePracticeSong: vi.fn(async () => ({
        path: "songs/a.json",
        files: { "songs/a.json": "{}" },
      })),
    };

    await expect(listPracticeSongFiles(api)).resolves.toEqual({
      "songs/a.json": "{}",
    });
    await expect(
      savePracticeSongFile(
        {
          path: "songs/a.json",
          overwrite: true,
          song: { title: "A", steps: ["C3"] },
        },
        api,
      ),
    ).resolves.toEqual({
      path: "songs/a.json",
      files: { "songs/a.json": "{}" },
    });
  });

  it("falls back to the dev HTTP bridge when Electron APIs are unavailable", async () => {
    const fetcher = vi.fn(async (input: string | URL | Request) => {
      const url = input.toString();

      return new Response(
        JSON.stringify(
          url.endsWith("/save")
            ? { path: "songs/browser.json", files: { "songs/browser.json": "{}" } }
            : { "songs/browser.json": "{}" },
        ),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    });

    await expect(listPracticeSongFiles(null, fetcher)).resolves.toEqual({
      "songs/browser.json": "{}",
    });
    await expect(
      savePracticeSongFile(
        {
          path: "songs/browser.json",
          overwrite: false,
          song: { title: "Browser", steps: ["C3"] },
        },
        null,
        fetcher,
      ),
    ).resolves.toEqual({
      path: "songs/browser.json",
      files: { "songs/browser.json": "{}" },
    });
  });
});
