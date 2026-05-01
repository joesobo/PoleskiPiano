# PoleskiPiano

Native Electron + React + TypeScript MIDI piano practice app for a 37-key C2-C5 Launchkey-style keyboard.

## Run

```sh
npm install
npm run dev
```

## Verify

```sh
npm test
npm run build
```

## Import Practice Songs

Convert a local MIDI file into a Practice Song JSON file:

```sh
pnpm song:from-midi path/to/song.mid --title "Song Name" --scale "D major"
```

The importer writes `songs/<song-name>.json` by default. It groups MIDI notes
that start on the same tick into one Practice Step, such as `C3 + E3 + G3`, and
stops if notes are outside the app's C2-C5 keyboard range. Use `--transpose` to
move a song into range, `--track` / `--channel` to choose usable MIDI parts, or
`--drop-out-of-range` for a rough draft.

## v0 scope

- Renderer Web MIDI input for note on/off events.
- `@tonejs/piano` sampled Salamander piano audio, limited to C2-C5 and three velocity layers for a light first build.
- Synth fallback if sampled piano loading fails.
- Stable absolute pitch-class colors inspired by Flexoki.
- Single dark practice screen with MIDI status, audio level, selected key, scale wheel, chord readout, grand staff, recent notes, and a 37-key keyboard.
- Local MIDI-to-Practice-Song JSON importer for files the learner has rights to use.

## Deferred

- Sheet import.
- Falling-note practice mode.
- Local bundled piano sample pack.
- Native main-process MIDI bridge.
