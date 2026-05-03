import { describe, expect, it } from "vitest";
import {
  createNewPracticeSongDraft,
  createPracticeSongDraftFromSong,
  movePracticeSongDraftStep,
  preparePracticeSongDraftForSave,
  serializePracticeSongDraftStep,
  slugifyPracticeSongTitle,
  togglePracticeSongDraftMidi,
} from "./practiceSongBuilder";
import { parsePracticeSong } from "./practiceSongs";

describe("Practice Song Builder draft editing", () => {
  it("toggles notes in the current step and keeps the step sorted low to high", () => {
    const withG = togglePracticeSongDraftMidi(
      createNewPracticeSongDraft("My Song"),
      55,
    );
    const withC = togglePracticeSongDraftMidi(withG, 48);
    const withE = togglePracticeSongDraftMidi(withC, 52);

    expect(withE.steps[0]).toEqual([48, 52, 55]);

    expect(togglePracticeSongDraftMidi(withE, 52).steps[0]).toEqual([48, 55]);
  });

  it("moves through steps and appends an empty step after the last step", () => {
    const draft = createNewPracticeSongDraft("My Song");
    const nextDraft = movePracticeSongDraftStep(draft, "next");

    expect(nextDraft.stepIndex).toBe(1);
    expect(nextDraft.steps).toEqual([[], []]);

    expect(movePracticeSongDraftStep(nextDraft, "previous").stepIndex).toBe(0);
    expect(
      movePracticeSongDraftStep(
        movePracticeSongDraftStep(nextDraft, "previous"),
        "previous",
      ).stepIndex,
    ).toBe(0);
  });
});

describe("Practice Song Builder saving", () => {
  it("serializes note sets as stable exact-note steps", () => {
    expect(serializePracticeSongDraftStep([55, 48, 52])).toBe("C3 + E3 + G3");
  });

  it("saves a new draft with an optional scale and trims trailing empty steps", () => {
    const draft = movePracticeSongDraftStep(
      togglePracticeSongDraftMidi(createNewPracticeSongDraft("My First Song"), 48),
      "next",
    );
    const result = preparePracticeSongDraftForSave(
      draft,
      { tonic: "D", mode: "major" },
      [],
    );

    expect(result).toEqual({
      ok: true,
      request: {
        path: "songs/my-first-song.json",
        overwrite: false,
        stepIndex: 0,
        song: {
          title: "My First Song",
          scale: "D major",
          steps: ["C3"],
        },
      },
    });
  });

  it("keeps an existing song filename while allowing the title to change", () => {
    const song = parsePracticeSong(
      { title: "Old Title", steps: ["C3", "E3"] },
      "songs/existing-song.json",
      "Existing Song",
    );
    const draft = createPracticeSongDraftFromSong(song, 1);
    const result = preparePracticeSongDraftForSave(
      { ...draft, title: "New Title", isDirty: true },
      null,
      ["songs/existing-song.json"],
    );

    expect(result).toEqual({
      ok: true,
      request: {
        path: "songs/existing-song.json",
        overwrite: true,
        stepIndex: 1,
        song: {
          title: "New Title",
          steps: ["C3", "E3"],
        },
      },
    });
  });

  it("blocks empty titles, empty middle steps, empty songs, and duplicate new paths", () => {
    expect(
      preparePracticeSongDraftForSave(createNewPracticeSongDraft("   "), null, []),
    ).toEqual({ ok: false, error: "Add a song title" });

    expect(
      preparePracticeSongDraftForSave(createNewPracticeSongDraft("!!!"), null, []),
    ).toEqual({ ok: false, error: "Add at least one step" });

    const emptyMiddleStep = {
      ...createNewPracticeSongDraft("My Song"),
      steps: [[48], [], [52]],
    };

    expect(preparePracticeSongDraftForSave(emptyMiddleStep, null, [])).toEqual({
      ok: false,
      error: "Step 2 is empty",
    });

    const duplicatePath = {
      ...createNewPracticeSongDraft("My Song"),
      steps: [[48]],
    };

    expect(
      preparePracticeSongDraftForSave(duplicatePath, null, [
        "songs/my-song.json",
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
