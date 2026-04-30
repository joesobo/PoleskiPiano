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
  family: string;
}

function pitchColor(
  background: string,
  foreground: string,
  family: string,
): NoteColor {
  return {
    background,
    foreground,
    family,
  };
}

export const pitchClassColors: Record<PitchClass, NoteColor> = {
  C: pitchColor(flexoki.red400, flexoki.black, "red"),
  "C#": pitchColor(flexoki.cyan600, flexoki.paper, "cyan"),
  D: pitchColor(flexoki.orange400, flexoki.black, "orange"),
  "D#": pitchColor(flexoki.blue600, flexoki.paper, "blue"),
  E: pitchColor(flexoki.yellow400, flexoki.black, "yellow"),
  F: pitchColor(flexoki.green400, flexoki.black, "green"),
  "F#": pitchColor(flexoki.purple600, flexoki.paper, "purple"),
  G: pitchColor(flexoki.cyan400, flexoki.black, "cyan"),
  "G#": pitchColor(flexoki.red600, flexoki.paper, "red"),
  A: pitchColor(flexoki.blue400, flexoki.black, "blue"),
  "A#": pitchColor(flexoki.orange600, flexoki.paper, "orange"),
  B: pitchColor(flexoki.purple400, flexoki.black, "purple"),
};

export function noteCssVars(pitchClass: PitchClass): CSSProperties {
  const color = pitchClassColors[pitchClass];

  return colorCssVars(color);
}

function colorCssVars(color: NoteColor): CSSProperties {
  return {
    "--note-color": color.background,
    "--note-text": color.foreground,
  } as CSSProperties;
}
