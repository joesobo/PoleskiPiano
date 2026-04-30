export const PITCH_CLASSES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

export type PitchClass = (typeof PITCH_CLASSES)[number];

export interface PianoKey {
  midi: number;
  note: string;
  pitchClass: PitchClass;
  octave: number;
  isBlack: boolean;
  whiteIndex?: number;
  blackCenter?: number;
}

export const DEFAULT_LOW_MIDI = 36;
export const DEFAULT_HIGH_MIDI = 72;

const BLACK_PITCH_CLASSES = new Set<PitchClass>([
  "C#",
  "D#",
  "F#",
  "G#",
  "A#",
]);

const PITCH_CLASS_BY_NAME = new Map<string, PitchClass>(
  PITCH_CLASSES.map((pitchClass) => [pitchClass, pitchClass]),
);

export function midiToPitchClass(midi: number): PitchClass {
  return PITCH_CLASSES[((midi % 12) + 12) % 12];
}

export function pitchClassToSemitone(pitchClass: PitchClass): number {
  return PITCH_CLASSES.indexOf(pitchClass);
}

export function midiToOctave(midi: number): number {
  return Math.floor(midi / 12) - 1;
}

export function midiToNoteName(midi: number): string {
  return `${midiToPitchClass(midi)}${midiToOctave(midi)}`;
}

export function noteNameToMidi(noteName: string): number {
  const match = /^([A-G]#?)(-?\d+)$/.exec(noteName);
  if (!match) {
    throw new Error(`Invalid note name: ${noteName}`);
  }

  const pitchClass = PITCH_CLASS_BY_NAME.get(match[1]);
  if (!pitchClass) {
    throw new Error(`Unsupported pitch class: ${match[1]}`);
  }

  return (Number(match[2]) + 1) * 12 + pitchClassToSemitone(pitchClass);
}

export function isBlackPitchClass(pitchClass: PitchClass): boolean {
  return BLACK_PITCH_CLASSES.has(pitchClass);
}

export function buildKeyboardRange(
  lowMidi = DEFAULT_LOW_MIDI,
  highMidi = DEFAULT_HIGH_MIDI,
): PianoKey[] {
  let whiteIndex = 0;
  const keys: PianoKey[] = [];

  for (let midi = lowMidi; midi <= highMidi; midi += 1) {
    const pitchClass = midiToPitchClass(midi);
    const isBlack = isBlackPitchClass(pitchClass);
    const key: PianoKey = {
      midi,
      note: midiToNoteName(midi),
      pitchClass,
      octave: midiToOctave(midi),
      isBlack,
    };

    if (isBlack) {
      key.blackCenter = whiteIndex;
    } else {
      key.whiteIndex = whiteIndex;
      whiteIndex += 1;
    }

    keys.push(key);
  }

  return keys;
}

export function getWhiteKeyCount(keys: PianoKey[]): number {
  return keys.filter((key) => !key.isBlack).length;
}

export function normalizeMidiVelocity(velocity: number): number {
  return Math.max(0, Math.min(1, velocity / 127));
}
