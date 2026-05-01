import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { describe, expect, it } from "vitest";
import { parsePracticeSong } from "./practiceSongs";

describe("Practice Song fixtures", () => {
  it("parses every song JSON file", () => {
    const songDir = join(process.cwd(), "songs");
    const failures: string[] = [];

    for (const fileName of readdirSync(songDir).filter((file) =>
      file.endsWith(".json"),
    )) {
      const path = join(songDir, fileName);
      const rawSong = JSON.parse(readFileSync(path, "utf8"));

      try {
        parsePracticeSong(rawSong, basename(fileName, ".json"), fileName);
      } catch (error) {
        failures.push(
          `${fileName}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    expect(failures).toEqual([]);
  });
});
