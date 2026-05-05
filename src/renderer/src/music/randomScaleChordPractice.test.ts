import { describe, expect, it } from "vitest";
import { parsePracticeSong } from "./practiceSongs";
import {
  createRandomScaleChordPracticeSongOption,
  getNextRandomScaleChordPracticeSeed,
} from "./randomScaleChordPractice";

describe("random scale chord practice song", () => {
  it("creates a valid generated song option from the current scale", () => {
    const option = createRandomScaleChordPracticeSongOption({
      tonic: "D",
      mode: "major",
    });

    expect(option.status).toBe("valid");

    if (option.status !== "valid") {
      return;
    }

    expect(option.id).toBe("generated/random-scale-chords.musicxml");
    expect(option.title).toBe("Random D Major Chords");
    expect(option.song.scale).toEqual({ tonic: "D", mode: "major" });
    expect(option.song.targets).toHaveLength(16);
    expect(option.song.targets.every((target) => target.midiNotes.length === 3)).toBe(
      true,
    );
  });

  it("creates parseable MusicXML that falls through the normal Practice Song parser", () => {
    const option = createRandomScaleChordPracticeSongOption(null);

    expect(option.status).toBe("valid");

    if (option.status !== "valid") {
      return;
    }

    const reparsedSong = parsePracticeSong(
      option.rawMusicXml,
      option.id,
      option.title,
    );

    expect(reparsedSong.title).toBe(option.title);
    expect(reparsedSong.targets).toEqual(option.song.targets);
  });

  it("defaults to C major when no scale is selected", () => {
    const option = createRandomScaleChordPracticeSongOption(null);

    expect(option.title).toBe("Random C Major Chords");
    expect(option.song.scale).toEqual({ tonic: "C", mode: "major" });
  });

  it("changes the generated chord sequence when the play seed advances", () => {
    const firstOption = createRandomScaleChordPracticeSongOption(
      { tonic: "C", mode: "major" },
      11,
    );
    const secondOption = createRandomScaleChordPracticeSongOption(
      { tonic: "C", mode: "major" },
      getNextRandomScaleChordPracticeSeed(11),
    );

    expect(firstOption.song.targets.map((target) => target.label)).not.toEqual(
      secondOption.song.targets.map((target) => target.label),
    );
  });

  it("names generated chord targets so the learner sees the chord shape", () => {
    const option = createRandomScaleChordPracticeSongOption({
      tonic: "C",
      mode: "major",
    });

    expect(option.song.targets.every((target) => target.chordName)).toBe(true);
  });
});
