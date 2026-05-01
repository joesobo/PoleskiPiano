import {
  createPracticeSongOptions,
  type PracticeSongOption,
} from "./practiceSongs";

const practiceSongFiles = import.meta.glob<string>("../../../../songs/*.json", {
  eager: true,
  import: "default",
  query: "?raw",
});

export const PRACTICE_SONG_OPTIONS: PracticeSongOption[] =
  createPracticeSongOptions(practiceSongFiles);
