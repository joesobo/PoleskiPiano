import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { describe, expect, it } from "vitest";
import { parsePracticeSong } from "./practiceSongs";

const EXPECTED_TEMPO_BY_FILE: Record<string, number> = {
  "c-major-scale.musicxml": 72,
  "can-can-theme.musicxml": 132,
  "carol-of-the-bells-easy-piano.musicxml": 120,
  "entertainer-rag-hook.musicxml": 96,
  "hall-of-the-mountain-king-theme.musicxml": 104,
  "happy-birthday-c-major.musicxml": 100,
  "korobeiniki-arcade-theme.musicxml": 112,
  "ode-to-joy-easy-variation.musicxml": 96,
  "practice-c-arpeggio-ladder.musicxml": 80,
  "practice-c-chord-changes.musicxml": 72,
  "practice-c-contrary-motion.musicxml": 72,
  "practice-c-five-finger.musicxml": 72,
  "practice-d-broken-triads.musicxml": 80,
  "practice-d-major-five-finger.musicxml": 72,
  "practice-interval-jumps.musicxml": 88,
  "practice-left-hand-ostinato.musicxml": 84,
  "practice-pop-progression-voice-leading.musicxml": 76,
  "wet-hands-sketch.musicxml": 76,
};

describe("Practice Song fixtures", () => {
  it("parses every song MusicXML file with its expected default tempo", () => {
    const songDir = join(process.cwd(), "songs");
    const failures: string[] = [];
    const tempoFailures: string[] = [];
    const malformedSoundFiles: string[] = [];
    const songFiles = readdirSync(songDir)
      .filter((file) => file.endsWith(".musicxml"))
      .sort();
    const missingTempoExpectations = songFiles.filter(
      (fileName) => EXPECTED_TEMPO_BY_FILE[fileName] === undefined,
    );
    const staleTempoExpectations = Object.keys(EXPECTED_TEMPO_BY_FILE).filter(
      (fileName) => !songFiles.includes(fileName),
    );

    for (const fileName of songFiles) {
      const path = join(songDir, fileName);
      const rawSong = readFileSync(path, "utf8");

      if (/<sound\b[^>]*\/>\s*<\/sound>/.test(rawSong)) {
        malformedSoundFiles.push(fileName);
      }

      try {
        const song = parsePracticeSong(
          rawSong,
          basename(fileName, ".musicxml"),
          fileName,
        );
        const expectedTempo = EXPECTED_TEMPO_BY_FILE[fileName];

        if (expectedTempo !== undefined && song.tempoBpm !== expectedTempo) {
          tempoFailures.push(
            `${fileName}: expected ${expectedTempo} BPM, parsed ${song.tempoBpm} BPM`,
          );
        }
      } catch (error) {
        failures.push(
          `${fileName}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    expect(missingTempoExpectations).toEqual([]);
    expect(staleTempoExpectations).toEqual([]);
    expect(malformedSoundFiles).toEqual([]);
    expect(failures).toEqual([]);
    expect(tempoFailures).toEqual([]);
  });

  it("keeps Practice: C Chord Changes as visible held chord targets", () => {
    const songDir = join(process.cwd(), "songs");
    const rawSong = readFileSync(
      join(songDir, "practice-c-chord-changes.musicxml"),
      "utf8",
    );
    const song = parsePracticeSong(
      rawSong,
      "songs/practice-c-chord-changes.musicxml",
      "Practice: C Chord Changes",
    );

    expect(song.targets.slice(0, 4).map((target) => target.label)).toEqual([
      "C3 + E3 + G3",
      "F3 + A3 + C4",
      "G3 + B3 + D4",
      "C3 + E3 + G3",
    ]);
    expect(song.targets.slice(0, 4).map((target) => target.chordName)).toEqual([
      "Cmaj",
      "Fmaj",
      "Gmaj",
      "Cmaj",
    ]);
    expect(song.targets.slice(0, 4).every((target) => target.durationBeats >= 2)).toBe(
      true,
    );
  });

  it("keeps Happy Birthday accompaniment voicings as normal notes when they are not inferred chords", () => {
    const songDir = join(process.cwd(), "songs");
    const rawSong = readFileSync(
      join(songDir, "happy-birthday-c-major.musicxml"),
      "utf8",
    );
    const song = parsePracticeSong(
      rawSong,
      "songs/happy-birthday-c-major.musicxml",
      "Happy Birthday",
    );
    const g7Target = song.targets.find(
      (target) =>
        target.midiNotes.length === 3 &&
        target.midiNotes.includes(43) &&
        target.midiNotes.includes(46) &&
        target.midiNotes.includes(48),
    );

    expect(g7Target?.label).toBe("G2 + A#2 + C3");
    expect(g7Target?.chordName).toBeNull();
    expect(g7Target?.chordGroups).toEqual([]);
  });
});
