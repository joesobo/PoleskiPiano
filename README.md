# PoleskiPiano

Native Electron + React + TypeScript MIDI piano practice app for a 37-key C2-C5 Launchkey-style keyboard.

## Run

```sh
pnpm install
pnpm dev
```

## Verify

```sh
pnpm test
pnpm build
```

## v0 scope

- Renderer Web MIDI input for note on/off events.
- `@tonejs/piano` sampled Salamander piano audio, limited to C2-C5 and three velocity layers for a light first build.
- Stable absolute pitch-class colors inspired by Flexoki.
- Single dark practice screen with MIDI status, audio level, selected key, scale wheel, chord readout, grand staff, recent notes, and a 37-key keyboard.
- Practice Songs are local `.musicxml` files in `songs/`.
- Falling Notes practice can run in Guided Practice or Performance Practice with fixed song BPM and adjustable speed.

## Deferred

- Sheet import.
- Native main-process MIDI bridge.
