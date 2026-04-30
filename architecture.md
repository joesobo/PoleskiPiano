# Architecture

Living file map for PoleskiPiano. Update before committing whenever files are added, removed, or repurposed.

## Root

- `.gitignore` - Ignores dependencies, build output, logs, macOS metadata, local CodeGraphy cache files, Playwright smoke artifacts, and in-repo worktrees.
- `AGENTS.md` - Repository instructions for coding agents, including workflow rules and skill configuration.
- `CONTEXT.md` - Product context, v0 decisions, layout contract, and deferred scope.
- `README.md` - Project overview, run commands, verification commands, v0 scope, and deferred features.
- `architecture.md` - Living file map for this repository.
- `electron.vite.config.ts` - Electron Vite build configuration for main, preload, and React renderer targets.
- `package-lock.json` - NPM dependency lockfile for the Electron/React/Tone scaffold.
- `package.json` - Project metadata, scripts, runtime dependencies, and dev dependencies.
- `tsconfig.json` - Shared strict TypeScript configuration for Electron, renderer, and tests.

## docs/agents

- `docs/agents/issue-tracker.md` - Issue tracker workflow consumed by engineering skills.
- `docs/agents/triage-labels.md` - Triage role to tracker label mapping consumed by engineering skills.
- `docs/agents/domain.md` - Domain documentation lookup rules consumed by engineering skills.

## src/main

- `src/main/index.ts` - Electron main process entrypoint; creates the native window and permits Web MIDI access.

## src/preload

- `src/preload/index.ts` - Electron preload bridge exposing app/platform metadata to the renderer.

## src/renderer

- `src/renderer/index.html` - Renderer HTML shell loaded by Vite/Electron.

## src/renderer/public

- `src/renderer/public/favicon.svg` - Small SVG app favicon served by the renderer dev server and production build.

## src/renderer/src

- `src/renderer/src/App.tsx` - Main practice-surface state container; wires MIDI, audio, scale, chord, staff, timeline, and keyboard UI.
- `src/renderer/src/main.tsx` - React renderer entrypoint.
- `src/renderer/src/styles.css` - Dark Flexoki-inspired app styling, layout, staff, timeline, and piano keyboard CSS.
- `src/renderer/src/vite-env.d.ts` - Vite client type references.

## src/renderer/src/components

- `src/renderer/src/components/ChordDisplay.tsx` - Live chord name and colored pitch-class pill display.
- `src/renderer/src/components/PianoKeyboard.tsx` - C2-C5 37-key keyboard UI with labels, scale tinting, and pressed states.
- `src/renderer/src/components/RecentTimeline.tsx` - Small recent-note velocity timeline.
- `src/renderer/src/components/ScaleWheel.tsx` - Selected scale pitch-class circle with active-note highlighting.
- `src/renderer/src/components/StaffNotation.tsx` - SVG grand staff with treble/bass clefs, colored active notes, and ledger lines.
- `src/renderer/src/components/TopBar.tsx` - MIDI status, sampled-audio status/control, audio level meter, and key/mode selectors.

## src/renderer/src/music

- `src/renderer/src/music/chords.ts` - Basic pitch-class chord analysis for live major/minor/seventh/suspended/diminished/augmented labels.
- `src/renderer/src/music/chords.test.ts` - Chord analysis tests.
- `src/renderer/src/music/colors.ts` - Flexoki-inspired base palette and stable absolute pitch-class color mapping.
- `src/renderer/src/music/notes.ts` - MIDI/note conversion, C2-C5 keyboard model, pitch-class helpers, and velocity normalization.
- `src/renderer/src/music/notes.test.ts` - Note conversion and 37-key range tests.
- `src/renderer/src/music/scales.ts` - Major/minor scale pitch-class helpers.
- `src/renderer/src/music/scales.test.ts` - Scale pitch-class tests.
- `src/renderer/src/music/staff.ts` - Active-note placement model for the SVG grand staff.
- `src/renderer/src/music/staff.test.ts` - Staff placement smoke tests.

## src/renderer/src/services

- `src/renderer/src/services/midi.ts` - Renderer Web MIDI connection, input status, and note on/off parsing.
- `src/renderer/src/services/pianoAudio.ts` - Tone.js sampled piano engine using `@tonejs/piano`, plus synth fallback.

## src/renderer/src/types

- `src/renderer/src/types/electron-api.d.ts` - Type declarations for the preload-exposed `window.poleskiPiano` bridge.
- `src/renderer/src/types/web-midi.d.ts` - Minimal Web MIDI type declarations for Chromium/Electron renderer code.
