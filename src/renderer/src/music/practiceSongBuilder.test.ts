import { describe, expect, it } from "vitest";
import {
  createNewPracticeSongDraft,
  createPracticeSongDraftFromSong,
  movePracticeSongDraftTarget,
  preparePracticeSongDraftForSave,
  serializePracticeSongDraftTarget,
  slugifyPracticeSongTitle,
  togglePracticeSongDraftMidi,
} from "./practiceSongBuilder";
import { createPracticeSongMusicXml, parsePracticeSong } from "./practiceSongs";

describe("Notation Builder draft editing", () => {
  it("toggles notes in the current target and keeps the target sorted low to high", () => {
    const withG = togglePracticeSongDraftMidi(
      createNewPracticeSongDraft("My Song"),
      55,
    );
    const withC = togglePracticeSongDraftMidi(withG, 48);
    const withE = togglePracticeSongDraftMidi(withC, 52);

    expect(withE.targets[0]).toEqual([48, 52, 55]);

    expect(togglePracticeSongDraftMidi(withE, 52).targets[0]).toEqual([48, 55]);
  });

  it("moves through targets and appends an empty target after the last target", () => {
    const draft = createNewPracticeSongDraft("My Song");
    const nextDraft = movePracticeSongDraftTarget(draft, "next");

    expect(nextDraft.targetIndex).toBe(1);
    expect(nextDraft.targets).toEqual([[], []]);

    expect(movePracticeSongDraftTarget(nextDraft, "previous").targetIndex).toBe(
      0,
    );
    expect(
      movePracticeSongDraftTarget(
        movePracticeSongDraftTarget(nextDraft, "previous"),
        "previous",
      ).targetIndex,
    ).toBe(0);
  });
});

describe("Notation Builder saving", () => {
  it("serializes note sets as stable exact-note target labels", () => {
    expect(serializePracticeSongDraftTarget([55, 48, 52])).toBe(
      "C3 + E3 + G3",
    );
  });

  it("saves a new draft with an optional scale and trims trailing empty targets", () => {
    const draft = movePracticeSongDraftTarget(
      togglePracticeSongDraftMidi(createNewPracticeSongDraft("My First Song"), 48),
      "next",
    );
    const result = preparePracticeSongDraftForSave(
      draft,
      { tonic: "D", mode: "major" },
      [],
    );

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.request.path).toBe("songs/my-first-song.musicxml");
    expect(result.request.overwrite).toBe(false);
    expect(result.request.targetIndex).toBe(0);

    const song = parsePracticeSong(
      result.request.contents,
      result.request.path,
      "My First Song",
    );

    expect(song.title).toBe("My First Song");
    expect(song.scale).toEqual({ tonic: "D", mode: "major" });
    expect(song.targets.map((target) => target.label)).toEqual(["C3"]);
  });

  it("keeps an existing song filename while allowing the title to change", () => {
    const song = parsePracticeSong(
      createPracticeSongMusicXml({
        title: "Old Title",
        scale: null,
        targets: [{ notes: [{ midi: 48 }] }, { notes: [{ midi: 52 }] }],
      }),
      "songs/existing-song.musicxml",
      "Existing Song",
    );
    const draft = createPracticeSongDraftFromSong(song, 1);
    const result = preparePracticeSongDraftForSave(
      { ...draft, title: "New Title", isDirty: true },
      null,
      ["songs/existing-song.musicxml"],
    );

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.request.path).toBe("songs/existing-song.musicxml");
    expect(result.request.overwrite).toBe(true);
    expect(result.request.targetIndex).toBe(1);
    expect(
      parsePracticeSong(
        result.request.contents,
        result.request.path,
        "Existing Song",
      ).title,
    ).toBe("New Title");
  });

  it("blocks empty titles, empty middle targets, empty songs, and duplicate new paths", () => {
    expect(
      preparePracticeSongDraftForSave(createNewPracticeSongDraft("   "), null, []),
    ).toEqual({ ok: false, error: "Add a song title" });

    expect(
      preparePracticeSongDraftForSave(createNewPracticeSongDraft("!!!"), null, []),
    ).toEqual({ ok: false, error: "Add at least one target" });

    const emptyMiddleTarget = {
      ...createNewPracticeSongDraft("My Song"),
      targets: [[48], [], [52]],
    };

    expect(preparePracticeSongDraftForSave(emptyMiddleTarget, null, [])).toEqual({
      ok: false,
      error: "Target 2 is empty",
    });

    const duplicatePath = {
      ...createNewPracticeSongDraft("My Song"),
      targets: [[48]],
    };

    expect(
      preparePracticeSongDraftForSave(duplicatePath, null, [
        "songs/my-song.musicxml",
      ]),
    ).toEqual({
      ok: false,
      error: "A song with this filename already exists",
    });
  });

  it("slugifies song titles for new song files", () => {
    expect(slugifyPracticeSongTitle("F# Shape Practice")).toBe(
      "f-sharp-shape-practice",
    );
  });
});
