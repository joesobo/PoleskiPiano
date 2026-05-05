import { describe, expect, it, vi } from "vitest";
import {
  listPracticeSongFiles,
  savePracticeSongFile,
  type PracticeSongFileApi,
} from "./practiceSongFiles";

describe("Practice Song file service", () => {
  it("uses the Electron bridge when it is available", async () => {
    const api: PracticeSongFileApi = {
      listPracticeSongs: vi.fn(async () => ({ "songs/a.musicxml": "<score-partwise/>" })),
      savePracticeSong: vi.fn(async () => ({
        path: "songs/a.musicxml",
        files: { "songs/a.musicxml": "<score-partwise/>" },
      })),
    };

    await expect(listPracticeSongFiles(api)).resolves.toEqual({
      "songs/a.musicxml": "<score-partwise/>",
    });
    await expect(
      savePracticeSongFile(
        {
          path: "songs/a.musicxml",
          overwrite: true,
          contents: "<score-partwise/>",
        },
        api,
      ),
    ).resolves.toEqual({
      path: "songs/a.musicxml",
      files: { "songs/a.musicxml": "<score-partwise/>" },
    });
  });

  it("requires the local Electron bridge", async () => {
    await expect(listPracticeSongFiles(null)).rejects.toThrow(
      "Practice Song file bridge unavailable",
    );
    await expect(
      savePracticeSongFile(
        {
          path: "songs/browser.musicxml",
          overwrite: false,
          contents: "<score-partwise/>",
        },
        null,
      ),
    ).rejects.toThrow("Practice Song file bridge unavailable");
  });
});
