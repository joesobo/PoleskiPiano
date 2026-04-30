import type { CSSProperties } from "react";
import type { PitchClass } from "./notes";

export const flexoki = {
  black: "#100f0f",
  paper: "#fffcf0",
  base50: "#f2f0e5",
  base100: "#e6e4d9",
  base150: "#dad8ce",
  base200: "#cecdc3",
  base300: "#b7b5ac",
  base400: "#9f9d96",
  base500: "#878580",
  base600: "#6f6e69",
  base700: "#575653",
  base800: "#403e3c",
  base850: "#343331",
  base900: "#282726",
  base950: "#1c1b1a",
  red400: "#d14d41",
  red600: "#af3029",
  orange400: "#da702c",
  orange600: "#bc5215",
  yellow400: "#d0a215",
  yellow600: "#ad8301",
  green400: "#879a39",
  green600: "#66800b",
  cyan400: "#3aa99f",
  cyan600: "#24837b",
  blue400: "#4385be",
  blue600: "#205ea6",
  purple400: "#8b7ec8",
  purple600: "#5e409d",
  magenta400: "#ce5d97",
  magenta600: "#a02f6f",
} as const;

export interface NoteColor {
  background: string;
  foreground: string;
}

export const pitchClassColors: Record<PitchClass, NoteColor> = {
  C: { background: flexoki.paper, foreground: flexoki.black },
  "C#": { background: flexoki.red400, foreground: flexoki.black },
  D: { background: flexoki.orange400, foreground: flexoki.black },
  "D#": { background: flexoki.magenta600, foreground: flexoki.paper },
  E: { background: flexoki.yellow400, foreground: flexoki.black },
  F: { background: flexoki.green400, foreground: flexoki.black },
  "F#": { background: flexoki.green600, foreground: flexoki.paper },
  G: { background: flexoki.cyan400, foreground: flexoki.black },
  "G#": { background: flexoki.blue600, foreground: flexoki.paper },
  A: { background: flexoki.purple400, foreground: flexoki.black },
  "A#": { background: flexoki.magenta400, foreground: flexoki.black },
  B: { background: flexoki.base100, foreground: flexoki.black },
};

export function noteCssVars(pitchClass: PitchClass): CSSProperties {
  const color = pitchClassColors[pitchClass];

  return {
    "--note-color": color.background,
    "--note-text": color.foreground,
  } as CSSProperties;
}
