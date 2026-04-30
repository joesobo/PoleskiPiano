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

## v0 scope

- Renderer Web MIDI input for note on/off events.
- `@tonejs/piano` sampled Salamander piano audio, limited to C2-C5 and three velocity layers for a light first build.
- Synth fallback if sampled piano loading fails.
- Stable absolute pitch-class colors inspired by Flexoki.
- Single dark practice screen with MIDI status, audio level, selected key, scale wheel, chord readout, grand staff, recent notes, and a 37-key keyboard.

## Deferred

- Sheet import.
- Falling-note practice mode.
- Local bundled piano sample pack.
- Native main-process MIDI bridge.
