#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const PITCH_CLASSES = [
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
const DEFAULT_LOW_MIDI = 36;
const DEFAULT_HIGH_MIDI = 72;

export function parseMidiNoteOnEvents(buffer) {
  const reader = createReader(buffer);
  const headerChunkType = reader.readAscii(4);

  if (headerChunkType !== "MThd") {
    throw new Error("Invalid MIDI file: missing MThd header");
  }

  const headerLength = reader.readUint32();
  const format = reader.readUint16();
  const trackCount = reader.readUint16();
  const division = reader.readUint16();

  if ((division & 0x8000) !== 0) {
    throw new Error("SMPTE-time MIDI files are not supported");
  }

  reader.skip(headerLength - 6);

  const events = [];

  for (let trackIndex = 0; trackIndex < trackCount; trackIndex += 1) {
    const chunkType = reader.readAscii(4);

    if (chunkType !== "MTrk") {
      throw new Error(`Invalid MIDI file: expected MTrk, got ${chunkType}`);
    }

    const trackLength = reader.readUint32();
    const trackEnd = reader.offset + trackLength;
    let tick = 0;
    let runningStatus = null;

    while (reader.offset < trackEnd) {
      tick += reader.readVariableLengthQuantity();

      let status = reader.readUint8();

      if (status < 0x80) {
        if (runningStatus === null) {
          throw new Error("Invalid MIDI file: running status without status byte");
        }

        reader.offset -= 1;
        status = runningStatus;
      } else if (status < 0xf0) {
        runningStatus = status;
      }

      if (status === 0xff) {
        reader.readUint8();
        reader.skip(reader.readVariableLengthQuantity());
        continue;
      }

      if (status === 0xf0 || status === 0xf7) {
        reader.skip(reader.readVariableLengthQuantity());
        continue;
      }

      const command = status & 0xf0;
      const channel = status & 0x0f;
      const dataLength = command === 0xc0 || command === 0xd0 ? 1 : 2;
      const data1 = reader.readUint8();
      const data2 = dataLength === 2 ? reader.readUint8() : 0;

      if (command === 0x90 && data2 > 0) {
        events.push({
          tick,
          midi: data1,
          velocity: data2,
          channel,
          track: trackIndex,
        });
      }
    }

    reader.offset = trackEnd;
  }

  return {
    format,
    ticksPerQuarter: division,
    events,
  };
}

export function midiEventsToPracticeSteps(events, options = {}) {
  const transpose = options.transpose ?? 0;
  const groupTicks = options.groupTicks ?? 0;
  const dropOutOfRange = options.dropOutOfRange ?? false;
  const filteredEvents = filterMidiEvents(events, options);
  const orderedEvents = [...filteredEvents].sort(
    (left, right) => left.tick - right.tick || left.midi - right.midi,
  );
  const groups = [];

  for (const event of orderedEvents) {
    const currentGroup = groups.at(-1);

    if (currentGroup && event.tick - currentGroup.tick <= groupTicks) {
      currentGroup.events.push(event);
    } else {
      groups.push({ tick: event.tick, events: [event] });
    }
  }

  const warnings = [];
  const steps = [];

  for (const group of groups) {
    const midiNotes = [];

    for (const event of group.events) {
      const midi = event.midi + transpose;

      if (midi < DEFAULT_LOW_MIDI || midi > DEFAULT_HIGH_MIDI) {
        warnings.push(
          `${midiToNoteName(midi)} at tick ${event.tick} is outside C2-C5 after transpose ${transpose}`,
        );

        if (dropOutOfRange) {
          continue;
        }
      }

      midiNotes.push(midi);
    }

    const uniqueMidiNotes = [...new Set(midiNotes)].sort((left, right) => left - right);

    if (uniqueMidiNotes.length > 0) {
      steps.push(uniqueMidiNotes.map(midiToNoteName).join(" + "));
    }
  }

  return {
    steps,
    warnings,
  };
}

export function filterMidiEvents(events, options = {}) {
  const tracks = parseNumberFilter(options.tracks);
  const channels = parseNumberFilter(options.channels);

  return events.filter((event) => {
    if (tracks && !tracks.has(event.track)) {
      return false;
    }

    if (channels && !channels.has(event.channel)) {
      return false;
    }

    return true;
  });
}

export function createPracticeSongJson({ title, scale, steps }) {
  return JSON.stringify(
    {
      title,
      ...(scale ? { scale } : {}),
      steps,
    },
    null,
    2,
  );
}

export function midiToNoteName(midi) {
  const pitchClass = PITCH_CLASSES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;

  return `${pitchClass}${octave}`;
}

function createReader(buffer) {
  return {
    buffer,
    offset: 0,
    readAscii(length) {
      const value = this.buffer.toString("ascii", this.offset, this.offset + length);
      this.offset += length;
      return value;
    },
    readUint8() {
      const value = this.buffer.readUInt8(this.offset);
      this.offset += 1;
      return value;
    },
    readUint16() {
      const value = this.buffer.readUInt16BE(this.offset);
      this.offset += 2;
      return value;
    },
    readUint32() {
      const value = this.buffer.readUInt32BE(this.offset);
      this.offset += 4;
      return value;
    },
    readVariableLengthQuantity() {
      let value = 0;

      for (let byteIndex = 0; byteIndex < 4; byteIndex += 1) {
        const byte = this.readUint8();
        value = (value << 7) | (byte & 0x7f);

        if ((byte & 0x80) === 0) {
          return value;
        }
      }

      throw new Error("Invalid MIDI file: variable-length quantity is too long");
    },
    skip(length) {
      this.offset += length;
    },
  };
}

function parseArgs(argv) {
  const args = [...argv];
  const options = {
    input: null,
    title: null,
    scale: null,
    out: null,
    transpose: 0,
    groupTicks: 0,
    tracks: null,
    channels: null,
    dropOutOfRange: false,
  };

  while (args.length > 0) {
    const arg = args.shift();

    if (!arg) {
      continue;
    }

    if (!arg.startsWith("--") && options.input === null) {
      options.input = arg;
      continue;
    }

    if (arg === "--title") {
      options.title = requireValue(args, arg);
    } else if (arg === "--scale") {
      options.scale = requireValue(args, arg);
    } else if (arg === "--out") {
      options.out = requireValue(args, arg);
    } else if (arg === "--transpose") {
      options.transpose = Number(requireValue(args, arg));
    } else if (arg === "--group-ticks") {
      options.groupTicks = Number(requireValue(args, arg));
    } else if (arg === "--track" || arg === "--tracks") {
      options.tracks = requireValue(args, arg);
    } else if (arg === "--channel" || arg === "--channels") {
      options.channels = requireValue(args, arg);
    } else if (arg === "--drop-out-of-range") {
      options.dropOutOfRange = true;
    } else if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!options.input) {
    throw new Error("Missing MIDI input path");
  }

  if (!Number.isFinite(options.transpose)) {
    throw new Error("--transpose must be a number");
  }

  if (!Number.isFinite(options.groupTicks) || options.groupTicks < 0) {
    throw new Error("--group-ticks must be a non-negative number");
  }

  options.title ??= titleFromFilename(options.input);
  options.out ??= join("songs", `${slugify(options.title)}.json`);

  return options;
}

function parseNumberFilter(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const numbers = String(value)
    .split(",")
    .map((part) => Number(part.trim()));

  if (numbers.some((number) => !Number.isInteger(number) || number < 0)) {
    throw new Error(`Invalid numeric filter: ${value}`);
  }

  return new Set(numbers);
}

function requireValue(args, flag) {
  const value = args.shift();

  if (!value) {
    throw new Error(`${flag} requires a value`);
  }

  return value;
}

function titleFromFilename(path) {
  return basename(path)
    .replace(/\.(mid|midi)$/i, "")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function printUsage() {
  console.log(`Usage:
  pnpm song:from-midi path/to/song.mid --title "Song Name" --scale "D major"

Options:
  --out path                Output JSON path. Default: songs/<title>.json
  --transpose semitones     Move all MIDI notes before writing steps.
  --group-ticks ticks       Group near-simultaneous note-ons. Default: 0.
  --track n[,m]             Include only zero-based MIDI track indexes.
  --channel n[,m]           Include only zero-based MIDI channels.
  --drop-out-of-range       Omit notes outside the app keyboard range C2-C5.
`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const midi = parseMidiNoteOnEvents(await readFile(options.input));
  const { steps, warnings } = midiEventsToPracticeSteps(midi.events, options);

  if (warnings.length > 0 && !options.dropOutOfRange) {
    console.error("Not writing song because some notes are outside C2-C5.");
    console.error("Try --transpose, or use --drop-out-of-range for a rough draft.");
    console.error(warnings.slice(0, 20).join("\n"));

    if (warnings.length > 20) {
      console.error(`...and ${warnings.length - 20} more`);
    }

    process.exitCode = 1;
    return;
  }

  await writeFile(
    options.out,
    `${createPracticeSongJson({
      title: options.title,
      scale: options.scale,
      steps,
    })}\n`,
  );

  console.log(`Wrote ${steps.length} steps to ${options.out}`);

  if (warnings.length > 0) {
    console.warn(`Dropped ${warnings.length} out-of-range notes.`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
