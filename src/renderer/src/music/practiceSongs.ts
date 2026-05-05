import { XMLBuilder, XMLParser } from "fast-xml-parser";
import { analyzeChord, type ChordQuality } from "./chords";
import {
  DEFAULT_HIGH_MIDI,
  DEFAULT_LOW_MIDI,
  midiToNoteName,
  midiToPitchClass,
  noteNameToMidi,
  pitchClassToSemitone,
  type PitchClass,
} from "./notes";
import { SCALE_MODES, type ScaleMode, type SelectedScale } from "./scales";

export interface PracticeTargetNote {
  midi: number;
  label: string;
  pitchClass: PitchClass;
}

export interface PracticeSongNote extends PracticeTargetNote {
  startBeat: number;
  durationBeats: number;
  measureNumber: string;
  staff: number | null;
  voice: string | null;
  type: string | null;
  dots: number;
  tieStart: boolean;
  tieStop: boolean;
}

export interface PracticeTarget {
  id: string;
  label: string;
  chordName: string | null;
  chordGroups: PracticeTargetChordGroup[];
  startBeat: number;
  durationBeats: number;
  measureNumber: string;
  midiNotes: number[];
  notes: PracticeTargetNote[];
}

export interface PracticeTargetChordGroup {
  name: string;
  root: PitchClass;
  midiNotes: number[];
  notes: PracticeTargetNote[];
}

export interface PracticeSongMeasure {
  number: string;
  startBeat: number;
  durationBeats: number;
}

export interface PracticeSong {
  id: string;
  title: string;
  scale: SelectedScale | null;
  tempoBpm: number;
  timeSignature: string | null;
  notes: PracticeSongNote[];
  targets: PracticeTarget[];
  measures: PracticeSongMeasure[];
}

export type PracticeSongOption =
  | {
      status: "valid";
      id: string;
      title: string;
      path: string;
      song: PracticeSong;
      rawMusicXml?: string;
    }
  | {
      status: "invalid";
      id: string;
      title: string;
      path: string;
      error: string;
    };

export interface MusicXmlDraftNote {
  midi: number;
  durationBeats?: number;
  type?: string;
  dots?: number;
}

export interface MusicXmlDraftTarget {
  notes: MusicXmlDraftNote[];
  durationBeats?: number;
}

const DEFAULT_TEMPO_BPM = 72;
const DEFAULT_DIVISIONS = 4;
const DEFAULT_TIME_SIGNATURE = { beats: 4, beatType: 4 };
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseAttributeValue: false,
  parseTagValue: true,
  trimValues: true,
});
const orderedXmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseAttributeValue: false,
  parseTagValue: true,
  preserveOrder: true,
  trimValues: true,
});
const xmlBuilder = new XMLBuilder({
  attributeNamePrefix: "@_",
  format: true,
  ignoreAttributes: false,
  suppressBooleanAttributes: false,
});

const MAJOR_KEY_BY_FIFTHS = new Map<number, PitchClass>([
  [-7, "C#"],
  [-6, "F#"],
  [-5, "B"],
  [-4, "E"],
  [-3, "A"],
  [-2, "D"],
  [-1, "G"],
  [0, "C"],
  [1, "G"],
  [2, "D"],
  [3, "A"],
  [4, "E"],
  [5, "B"],
  [6, "F#"],
  [7, "C#"],
]);
const MINOR_KEY_BY_FIFTHS = new Map<number, PitchClass>([
  [-7, "A#"],
  [-6, "D#"],
  [-5, "G#"],
  [-4, "C#"],
  [-3, "F"],
  [-2, "A#"],
  [-1, "D"],
  [0, "A"],
  [1, "E"],
  [2, "B"],
  [3, "F#"],
  [4, "C#"],
  [5, "G#"],
  [6, "D#"],
  [7, "A#"],
]);
const FIFTHS_BY_SCALE = new Map<string, number>([
  ["C major", 0],
  ["G major", 1],
  ["D major", 2],
  ["A major", 3],
  ["E major", 4],
  ["B major", 5],
  ["F# major", 6],
  ["C# major", 7],
  ["F major", -1],
  ["Bb major", -2],
  ["Eb major", -3],
  ["Ab major", -4],
  ["Db major", -5],
  ["Gb major", -6],
  ["Cb major", -7],
  ["A minor", 0],
  ["E minor", 1],
  ["B minor", 2],
  ["F# minor", 3],
  ["C# minor", 4],
  ["G# minor", 5],
  ["D# minor", 6],
  ["A# minor", 7],
  ["D minor", -1],
  ["G minor", -2],
  ["C minor", -3],
  ["F minor", -4],
  ["Bb minor", -5],
  ["Eb minor", -6],
  ["Ab minor", -7],
]);

type XmlRecord = Record<string, unknown>;
type OrderedXmlEntry = Record<string, unknown>;

interface RawPracticeSongNote extends PracticeSongNote {
  endBeat: number;
}

export function createPracticeSongOptions(
  files: Record<string, string>,
): PracticeSongOption[] {
  return Object.entries(files)
    .map(([path, rawFile]) =>
      createPracticeSongOption(normalizePracticeSongPath(path), rawFile),
    )
    .sort((left, right) => left.title.localeCompare(right.title));
}

export function normalizePracticeSongPath(path: string): string {
  const filename = path.split(/[\\/]/).at(-1) ?? path;

  return `songs/${filename}`;
}

export function parsePracticeSong(
  rawMusicXml: string,
  id: string,
  fallbackTitle: string,
): PracticeSong {
  const parsed = xmlParser.parse(rawMusicXml) as unknown;
  const ordered = orderedXmlParser.parse(rawMusicXml) as unknown;
  const score = getRequiredRecord(parsed, "score-partwise", "Practice Song");
  const part = getSinglePart(score);
  const orderedPart = getOrderedPart(ordered);
  const title = getPracticeSongTitle(score, part, fallbackTitle);
  const measures = toArray(part.measure);
  const orderedMeasures = orderedPart
    .flatMap((entry) => getOrderedChild(entry, "part"))
    .filter((entry) => "measure" in entry);

  if (measures.length === 0) {
    throw new Error("Practice Song must include at least one measure");
  }

  if (orderedMeasures.length !== measures.length) {
    throw new Error("Practice Song measure data is invalid");
  }

  let divisions = DEFAULT_DIVISIONS;
  let measureStartBeat = 0;
  let scale: SelectedScale | null = null;
  let tempoBpm = DEFAULT_TEMPO_BPM;
  let timeSignature: string | null = null;
  const notes: RawPracticeSongNote[] = [];
  const songMeasures: PracticeSongMeasure[] = [];

  measures.forEach((measure, measureIndex) => {
    if (!isRecord(measure)) {
      throw new Error(`Practice Song measure ${measureIndex + 1} is invalid`);
    }

    const orderedMeasure = orderedMeasures[measureIndex];
    const measureEntries = getOrderedChild(orderedMeasure, "measure");
    const measureNumber =
      getString(getAttributes(orderedMeasure)["@_number"]) ??
      String(measureIndex + 1);
    const attributes = firstRecord(measure.attributes);

    if (attributes?.divisions !== undefined) {
      divisions = getPositiveNumber(attributes.divisions, "MusicXML divisions");
    }

    if (attributes?.key !== undefined && scale === null) {
      scale = parseKeySignature(firstRecord(attributes.key));
    }

    if (attributes?.time !== undefined && timeSignature === null) {
      timeSignature = parseTimeSignature(firstRecord(attributes.time));
    }

    const measureTempo = readTempoBpm(measure);

    if (measureTempo !== null) {
      tempoBpm = measureTempo;
    }

    let cursorDivisions = 0;
    let lastNoteStartDivisions = 0;
    let maxDivisions = 0;

    for (const entry of measureEntries) {
      if ("attributes" in entry || "direction" in entry) {
        continue;
      }

      if ("backup" in entry) {
        cursorDivisions = Math.max(
          0,
          cursorDivisions -
            readOrderedDuration(entry, "backup", "MusicXML backup"),
        );
        continue;
      }

      if ("forward" in entry) {
        cursorDivisions += readOrderedDuration(
          entry,
          "forward",
          "MusicXML forward",
        );
        maxDivisions = Math.max(maxDivisions, cursorDivisions);
        continue;
      }

      if (!("note" in entry)) {
        continue;
      }

      const noteEntries = getOrderedChild(entry, "note");
      const durationDivisions =
        readOrderedOptionalNumber(noteEntries, "duration") ?? 0;
      const isChord = hasOrderedChild(noteEntries, "chord");
      const startDivisions = isChord ? lastNoteStartDivisions : cursorDivisions;
      const rest = hasOrderedChild(noteEntries, "rest");

      if (!rest) {
        const rawNote = buildPracticeSongNote({
          noteEntries,
          startBeat: measureStartBeat + startDivisions / divisions,
          durationBeats: durationDivisions / divisions,
          measureNumber,
        });

        notes.push(rawNote);
      }

      if (!isChord) {
        lastNoteStartDivisions = startDivisions;
        cursorDivisions += durationDivisions;
      }

      maxDivisions = Math.max(
        maxDivisions,
        startDivisions + durationDivisions,
        cursorDivisions,
      );
    }

    const fallbackMeasureBeats = parseMeasureBeats(timeSignature);
    const measureDurationBeats =
      Math.max(maxDivisions / divisions, fallbackMeasureBeats) ||
      fallbackMeasureBeats;

    songMeasures.push({
      number: measureNumber,
      startBeat: measureStartBeat,
      durationBeats: measureDurationBeats,
    });
    measureStartBeat += measureDurationBeats;
  });

  const mergedNotes = mergeTiedNotes(notes);

  return {
    id,
    title,
    scale,
    tempoBpm,
    timeSignature,
    notes: mergedNotes,
    targets: buildPracticeTargets(mergedNotes),
    measures: songMeasures,
  };
}

export function activeMidiNotesMatchPracticeTarget(
  activeMidiNotes: Iterable<number>,
  target: PracticeTarget,
): boolean {
  const active = new Set(activeMidiNotes);
  const expected = new Set(target.midiNotes);

  if (active.size !== expected.size) {
    return false;
  }

  for (const midi of expected) {
    if (!active.has(midi)) {
      return false;
    }
  }

  return true;
}

export function createPracticeSongMusicXml({
  title,
  scale,
  targets,
}: {
  title: string;
  scale: SelectedScale | null;
  targets: MusicXmlDraftTarget[];
}): string {
  const measures = buildMusicXmlMeasures(targets);
  const scaleValue = serializePracticeScale(scale);
  const fifths = scaleValue ? FIFTHS_BY_SCALE.get(scaleValue) ?? 0 : 0;
  const mode = scale?.mode ?? "major";
  const score = {
    "?xml": {
      "@_version": "1.0",
      "@_encoding": "UTF-8",
    },
    "score-partwise": {
      "@_version": "4.0",
      "work": {
        "work-title": title,
      },
      "part-list": {
        "score-part": {
          "@_id": "P1",
          "part-name": "Piano",
        },
      },
      "part": {
        "@_id": "P1",
        "measure": measures.map((measure, index) => ({
          "@_number": String(index + 1),
          ...(index === 0
            ? {
                attributes: {
                  divisions: DEFAULT_DIVISIONS,
                  key: {
                    fifths,
                    mode,
                  },
                  time: DEFAULT_TIME_SIGNATURE,
                  staves: 2,
                  clef: [
                    {
                      "@_number": 1,
                      sign: "G",
                      line: 2,
                    },
                    {
                      "@_number": 2,
                      sign: "F",
                      line: 4,
                    },
                  ],
                },
                direction: {
                  sound: {
                    "@_tempo": DEFAULT_TEMPO_BPM,
                  },
                },
              }
            : {}),
          note: measure.flatMap((target) =>
            target.notes.map((note, noteIndex) =>
              buildMusicXmlNote(target, note, noteIndex > 0),
            ),
          ),
        })),
      },
    },
  };

  return `${xmlBuilder.build(score)}\n`;
}

function createPracticeSongOption(
  path: string,
  rawFile: string,
): PracticeSongOption {
  const fallbackTitle = titleFromPath(path);

  try {
    const song = parsePracticeSong(rawFile, path, fallbackTitle);

    return {
      status: "valid",
      id: path,
      title: song.title,
      path,
      song,
    };
  } catch (error) {
    return {
      status: "invalid",
      id: path,
      title: getInvalidSongTitle(rawFile) ?? fallbackTitle,
      path,
      error: error instanceof Error ? error.message : "Invalid Practice Song",
    };
  }
}

function getSinglePart(score: XmlRecord): XmlRecord {
  const parts = toArray(score.part).filter(isRecord);

  if (parts.length !== 1) {
    throw new Error("Practice Song must include exactly one Piano Part");
  }

  return parts[0];
}

function getOrderedPart(parsed: unknown): OrderedXmlEntry[] {
  if (!Array.isArray(parsed)) {
    throw new Error("Practice Song must be a MusicXML score-partwise document");
  }

  const scoreEntry = parsed.find((entry) => isRecord(entry) && "score-partwise" in entry);
  const scoreChildren = scoreEntry
    ? getOrderedChild(scoreEntry as OrderedXmlEntry, "score-partwise")
    : [];
  const parts = scoreChildren.filter((entry) => "part" in entry);

  if (parts.length !== 1) {
    throw new Error("Practice Song must include exactly one Piano Part");
  }

  return parts;
}

function getPracticeSongTitle(
  score: XmlRecord,
  part: XmlRecord,
  fallbackTitle: string,
): string {
  const title =
    getString(score["movement-title"]) ??
    getString(firstRecord(score.work)?.["work-title"]) ??
    getString(firstRecord(firstRecord(score["part-list"])?.["score-part"])?.["part-name"]) ??
    getString(part["@_id"]) ??
    fallbackTitle;

  return title.trim().length > 0 ? title.trim() : fallbackTitle;
}

function buildPracticeSongNote({
  noteEntries,
  startBeat,
  durationBeats,
  measureNumber,
}: {
  noteEntries: OrderedXmlEntry[];
  startBeat: number;
  durationBeats: number;
  measureNumber: string;
}): RawPracticeSongNote {
  const pitchEntries = getFirstOrderedChild(noteEntries, "pitch");
  const step = getOrderedText(pitchEntries, "step");
  const octave = readOrderedOptionalNumber(pitchEntries, "octave");
  const alter = readOrderedOptionalNumber(pitchEntries, "alter") ?? 0;

  if (!step || octave === null) {
    throw new Error(`Practice Song note in measure ${measureNumber} is missing pitch`);
  }

  const midi = musicXmlPitchToMidi(step, alter, octave);
  assertMidiInPracticeRange(midi, midiToNoteName(midi));

  const tieTypes = getOrderedChildren(noteEntries, "tie")
    .map((entry) => getString(getAttributes(entry)["@_type"]))
    .filter((type): type is string => type !== null);
  const type = getOrderedText(noteEntries, "type");
  const staff = readOrderedOptionalNumber(noteEntries, "staff");
  const voice = getOrderedText(noteEntries, "voice");
  const dots = getOrderedChildren(noteEntries, "dot").length;

  return {
    midi,
    label: midiToNoteName(midi),
    pitchClass: midiToPitchClass(midi),
    startBeat,
    durationBeats,
    endBeat: startBeat + durationBeats,
    measureNumber,
    staff,
    voice,
    type,
    dots,
    tieStart: tieTypes.includes("start"),
    tieStop: tieTypes.includes("stop"),
  };
}

function mergeTiedNotes(notes: RawPracticeSongNote[]): PracticeSongNote[] {
  const merged: RawPracticeSongNote[] = [];
  const activeTies = new Map<string, RawPracticeSongNote>();

  for (const note of notes) {
    const tieKey = `${note.midi}:${note.staff ?? ""}:${note.voice ?? ""}`;
    const activeTie = activeTies.get(tieKey);

    if (note.tieStop && activeTie) {
      activeTie.durationBeats = note.endBeat - activeTie.startBeat;
      activeTie.endBeat = note.endBeat;

      if (!note.tieStart) {
        activeTies.delete(tieKey);
      }

      continue;
    }

    merged.push(note);

    if (note.tieStart) {
      activeTies.set(tieKey, note);
    }
  }

  return merged.map(({ endBeat: _endBeat, ...note }) => note);
}

function buildPracticeTargets(notes: PracticeSongNote[]): PracticeTarget[] {
  const targetMap = new Map<string, PracticeSongNote[]>();

  for (const note of notes) {
    const key = note.startBeat.toFixed(4);
    const targetNotes = targetMap.get(key);

    if (targetNotes) {
      targetNotes.push(note);
    } else {
      targetMap.set(key, [note]);
    }
  }

  return [...targetMap.entries()]
    .sort(([left], [right]) => Number(left) - Number(right))
    .map(([startBeatKey, targetNotes], index) => {
      const orderedNotes = [...targetNotes].sort((left, right) => left.midi - right.midi);
      const durationBeats = Math.max(
        ...orderedNotes.map((note) => note.durationBeats),
      );
      const notes = orderedNotes.map(({ midi, label, pitchClass }) => ({
        midi,
        label,
        pitchClass,
      }));
      const chordGroups = buildPracticeTargetChordGroups(orderedNotes);

      return {
        id: `target-${index + 1}`,
        label: notes.map((note) => note.label).join(" + "),
        chordName: chordGroups[0]?.name ?? null,
        chordGroups,
        startBeat: Number(startBeatKey),
        durationBeats,
        measureNumber: orderedNotes[0]?.measureNumber ?? String(index + 1),
        midiNotes: notes.map((note) => note.midi),
        notes,
      };
    });
}

interface PracticeTargetChordGroupCandidate extends PracticeTargetChordGroup {
  score: number;
}

function buildPracticeTargetChordGroups(
  notes: PracticeSongNote[],
): PracticeTargetChordGroup[] {
  if (notes.length < 2) {
    return [];
  }

  const uniquePitchClasses = uniqueTargetPitchClasses(notes);
  const candidates: PracticeTargetChordGroupCandidate[] = [];

  for (const size of [4, 3]) {
    for (const pitchClasses of combinations(uniquePitchClasses, size)) {
      const analysis = analyzeChord(
        pitchClasses.map((pitchClass) => 60 + pitchClassToSemitone(pitchClass)),
      );

      if (!analysis.isNamedChord || !analysis.root) {
        continue;
      }

      const pitchClassSet = new Set(pitchClasses);
      const chordNotes = notes
        .filter((note) => pitchClassSet.has(note.pitchClass))
        .map(({ midi, label, pitchClass }) => ({
          midi,
          label,
          pitchClass,
        }));
      const lowestChordNote = chordNotes[0];
      const rootIsLowest = lowestChordNote?.pitchClass === analysis.root;

      candidates.push({
        name: analysis.label,
        root: analysis.root,
        midiNotes: chordNotes.map((note) => note.midi),
        notes: chordNotes,
        score:
          size * 100 +
          getChordQualityScore(analysis.quality) +
          chordNotes.length * 10 +
          (rootIsLowest ? 5 : 0),
      });
    }
  }

  return candidates
    .sort((left, right) => right.score - left.score)
    .slice(0, 1)
    .map(({ score: _score, ...candidate }) => candidate);
}

function getChordQualityScore(quality: ChordQuality | undefined): number {
  switch (quality) {
    case "major":
    case "minor":
      return 30;
    case "majorSeventh":
    case "minorSeventh":
    case "dominantSeventh":
      return 24;
    case "diminished":
    case "augmented":
      return 18;
    case "suspendedSecond":
    case "suspendedFourth":
      return 6;
    default:
      return 0;
  }
}

function uniqueTargetPitchClasses(notes: PracticeSongNote[]): PitchClass[] {
  const pitchClasses: PitchClass[] = [];
  const seen = new Set<PitchClass>();

  for (const note of notes) {
    if (!seen.has(note.pitchClass)) {
      seen.add(note.pitchClass);
      pitchClasses.push(note.pitchClass);
    }
  }

  return pitchClasses;
}

function combinations<T>(values: T[], size: number): T[][] {
  if (size <= 0) {
    return [[]];
  }

  if (values.length < size) {
    return [];
  }

  return values.flatMap((value, index) =>
    combinations(values.slice(index + 1), size - 1).map((tail) => [
      value,
      ...tail,
    ]),
  );
}

function parseKeySignature(key: XmlRecord | null): SelectedScale | null {
  if (!key) {
    return null;
  }

  const fifths = getOptionalNumber(key.fifths);
  const mode = getString(key.mode)?.toLowerCase() ?? "major";

  if (fifths === null || (mode !== "major" && mode !== "minor")) {
    return null;
  }

  const tonic =
    mode === "minor"
      ? MINOR_KEY_BY_FIFTHS.get(fifths)
      : MAJOR_KEY_BY_FIFTHS.get(fifths);

  return tonic ? { tonic, mode } : null;
}

function parseTimeSignature(time: XmlRecord | null): string | null {
  if (!time) {
    return null;
  }

  const beats = getOptionalNumber(time.beats);
  const beatType = getOptionalNumber(time["beat-type"]);

  return beats !== null && beatType !== null ? `${beats}/${beatType}` : null;
}

function parseMeasureBeats(timeSignature: string | null): number {
  if (!timeSignature) {
    return DEFAULT_TIME_SIGNATURE.beats;
  }

  const [beats, beatType] = timeSignature.split("/").map(Number);

  if (!Number.isFinite(beats) || !Number.isFinite(beatType) || beatType <= 0) {
    return DEFAULT_TIME_SIGNATURE.beats;
  }

  return beats * (4 / beatType);
}

function readTempoBpm(measure: XmlRecord): number | null {
  for (const direction of toArray(measure.direction).filter(isRecord)) {
    const sound = firstRecord(direction.sound);
    const tempo = getOptionalNumber(sound?.["@_tempo"]);

    if (tempo !== null && tempo > 0) {
      return tempo;
    }
  }

  return null;
}

function musicXmlPitchToMidi(step: string, alter: number, octave: number): number {
  const pitchClass = pitchClassFromMusicXml(step, alter);

  return noteNameToMidi(`${pitchClass}${octave}`);
}

function pitchClassFromMusicXml(step: string, alter: number): PitchClass {
  const baseSemitoneByStep: Record<string, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  };
  const pitchClasses: PitchClass[] = [
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
  ];
  const base = baseSemitoneByStep[step.toUpperCase()];

  if (base === undefined) {
    throw new Error(`Invalid MusicXML pitch step: ${step}`);
  }

  return pitchClasses[((base + alter) % 12 + 12) % 12];
}

function buildMusicXmlMeasures(
  targets: MusicXmlDraftTarget[],
): MusicXmlDraftTarget[][] {
  const measures: MusicXmlDraftTarget[][] = [[]];
  let beatInMeasure = 0;

  for (const target of targets) {
    const durationBeats = getTargetDurationBeats(target);

    if (
      measures.at(-1) &&
      measures.at(-1)!.length > 0 &&
      beatInMeasure + durationBeats > DEFAULT_TIME_SIGNATURE.beats
    ) {
      measures.push([]);
      beatInMeasure = 0;
    }

    measures.at(-1)!.push(target);
    beatInMeasure += durationBeats;
  }

  return measures.filter((measure) => measure.length > 0);
}

function buildMusicXmlNote(
  target: MusicXmlDraftTarget,
  note: MusicXmlDraftNote,
  isChord: boolean,
): XmlRecord {
  const durationBeats = note.durationBeats ?? getTargetDurationBeats(target);
  const pitch = musicXmlPitchFromMidi(note.midi);

  return {
    ...(isChord ? { chord: "" } : {}),
    pitch,
    duration: durationBeats * DEFAULT_DIVISIONS,
    type: note.type ?? noteTypeFromDuration(durationBeats),
    ...(note.dots ? { dot: Array.from({ length: note.dots }, () => "") } : {}),
    staff: midiToStaff(note.midi),
  };
}

function getTargetDurationBeats(target: MusicXmlDraftTarget): number {
  return target.durationBeats ?? target.notes[0]?.durationBeats ?? 1;
}

function musicXmlPitchFromMidi(midi: number): XmlRecord {
  const label = midiToNoteName(midi);
  const match = /^([A-G])(#?)(-?\d+)$/.exec(label);

  if (!match) {
    throw new Error(`Invalid MIDI note: ${midi}`);
  }

  return {
    step: match[1],
    ...(match[2] === "#" ? { alter: 1 } : {}),
    octave: Number(match[3]),
  };
}

function noteTypeFromDuration(durationBeats: number): string {
  if (durationBeats >= 4) {
    return "whole";
  }

  if (durationBeats >= 2) {
    return "half";
  }

  if (durationBeats >= 1) {
    return "quarter";
  }

  if (durationBeats >= 0.5) {
    return "eighth";
  }

  return "16th";
}

function midiToStaff(midi: number): number {
  return midi < noteNameToMidi("C4") ? 2 : 1;
}

function serializePracticeScale(scale: SelectedScale | null): string | null {
  return scale ? `${scale.tonic} ${scale.mode}` : null;
}

export function parseOptionalPracticeScale(
  rawScale: unknown,
): SelectedScale | null {
  if (rawScale === undefined || rawScale === null || rawScale === "") {
    return null;
  }

  if (typeof rawScale !== "string") {
    throw new Error("Practice Song scale must be a string");
  }

  const match = /^([A-G]#?)\s+(major|minor)$/i.exec(rawScale.trim());

  if (!match) {
    throw new Error(`Invalid Practice Song scale: ${rawScale}`);
  }

  const tonic = normalizePitchClass(match[1]);
  const mode = match[2].toLowerCase() as ScaleMode;

  if (!SCALE_MODES.includes(mode)) {
    throw new Error(`Invalid Practice Song scale mode: ${match[2]}`);
  }

  return { tonic, mode };
}

function normalizePitchClass(rawPitchClass: string): PitchClass {
  const normalized = rawPitchClass[0].toUpperCase() + rawPitchClass.slice(1);

  if (!["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].includes(normalized)) {
    throw new Error(`Unsupported pitch class: ${rawPitchClass}`);
  }

  return normalized as PitchClass;
}

function getRequiredRecord(
  value: unknown,
  key: string,
  label: string,
): XmlRecord {
  if (!isRecord(value) || !isRecord(value[key])) {
    throw new Error(`${label} must be a MusicXML score-partwise document`);
  }

  return value[key] as XmlRecord;
}

function getOrderedChild(entry: OrderedXmlEntry, key: string): OrderedXmlEntry[] {
  const value = entry[key];

  return Array.isArray(value) ? (value.filter(isRecord) as OrderedXmlEntry[]) : [];
}

function getFirstOrderedChild(
  entries: OrderedXmlEntry[],
  key: string,
): OrderedXmlEntry[] {
  return getOrderedChildren(entries, key)
    .flatMap((entry) => getOrderedChild(entry, key));
}

function getOrderedChildren(
  entries: OrderedXmlEntry[],
  key: string,
): OrderedXmlEntry[] {
  return entries.filter((entry) => key in entry);
}

function hasOrderedChild(entries: OrderedXmlEntry[], key: string): boolean {
  return entries.some((entry) => key in entry);
}

function getOrderedText(entries: OrderedXmlEntry[], key: string): string | null {
  const value = readOrderedValue(entries, key);

  return value === null ? null : String(value);
}

function readOrderedOptionalNumber(
  entries: OrderedXmlEntry[],
  key: string,
): number | null {
  const value = readOrderedValue(entries, key);

  return getOptionalNumber(value);
}

function readOrderedDuration(
  entry: OrderedXmlEntry,
  key: string,
  label: string,
): number {
  const duration = readOrderedOptionalNumber(getOrderedChild(entry, key), "duration");

  if (duration === null || duration < 0) {
    throw new Error(`${label} duration is invalid`);
  }

  return duration;
}

function readOrderedValue(entries: OrderedXmlEntry[], key: string): unknown {
  const child = entries.find((entry) => key in entry);

  if (!child) {
    return null;
  }

  const value = child[key];

  if (!Array.isArray(value)) {
    return null;
  }

  const text = value.find((entry) => isRecord(entry) && "#text" in entry);

  return isRecord(text) ? text["#text"] : "";
}

function getAttributes(entry: OrderedXmlEntry): XmlRecord {
  return isRecord(entry[":@"]) ? (entry[":@"] as XmlRecord) : {};
}

function firstRecord(value: unknown): XmlRecord | null {
  if (isRecord(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.find(isRecord) ?? null;
  }

  return null;
}

function toArray(value: unknown): unknown[] {
  if (value === undefined || value === null) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function getPositiveNumber(value: unknown, label: string): number {
  const number = getOptionalNumber(value);

  if (number === null || number <= 0) {
    throw new Error(`${label} must be a positive number`);
  }

  return number;
}

function getOptionalNumber(value: unknown): number | null {
  const number = typeof value === "number" ? value : Number(value);

  return Number.isFinite(number) ? number : null;
}

function getString(value: unknown): string | null {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : null;
}

function assertMidiInPracticeRange(midi: number, label: string): void {
  if (midi < DEFAULT_LOW_MIDI || midi > DEFAULT_HIGH_MIDI) {
    throw new Error(`Practice Song note ${label} is outside the C2-C5 range`);
  }
}

function titleFromPath(path: string): string {
  const filename = path.split("/").at(-1)?.replace(/\.musicxml$/i, "") ?? path;
  const words = filename.split(/[-_\s]+/).filter(Boolean);

  return words.length > 0
    ? words
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(" ")
    : "Untitled Practice Song";
}

function getInvalidSongTitle(rawFile: string): string | null {
  try {
    const parsed = xmlParser.parse(rawFile) as unknown;
    const score = getRequiredRecord(parsed, "score-partwise", "Practice Song");

    return (
      getString(score["movement-title"]) ??
      getString(firstRecord(score.work)?.["work-title"])
    );
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is XmlRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
