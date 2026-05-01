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
- `package.json` - Project metadata, scripts including MIDI song import, runtime dependencies, and dev dependencies.
- `tsconfig.json` - Shared strict TypeScript configuration for Electron, renderer, and tests.
- `vitest.config.ts` - Vitest configuration excluding build output, dependencies, Git internals, and nested in-repo worktrees from test discovery.

## songs

- `songs/dunhill-melody-in-c-study.json` - Beginner Practice Song study reduction from the user-provided Dunhill `First Year Pieces` PDF.
- `songs/feel-good-inc-midi.json` - C2-C5 Practice Song generated from a selected in-range MIDI hook track.
- `songs/harry-potter-midi.json` - C2-C5 Practice Song generated from user-provided MIDI with downward transposition.
- `songs/hes-a-pirate-melody-midi.json` - C2-C5 Practice Song generated from a selected melody MIDI track with downward transposition.
- `songs/hotel-california-melody-midi.json` - C2-C5 Practice Song generated from a selected in-range MIDI melody track.
- `songs/imslp-hook-tempo-di-minuetto-study.json` - Simplified public-domain IMSLP Level 1 Hook minuetto study reduction for Practice Song mode.
- `songs/imslp-kohler-childs-song-study.json` - Simplified public-domain IMSLP Level 1 Kohler child-song study reduction for Practice Song mode.
- `songs/imslp-turk-youthful-happiness-study.json` - Simplified public-domain IMSLP Level 1 Turk study reduction for Practice Song mode.
- `songs/piano-man-midi.json` - C2-C5 Practice Song generated from a selected MIDI channel with downward transposition.
- `songs/practice-c-chord-changes.json` - Beginner C major I-IV-V chord-change drill as a Practice Song.
- `songs/practice-c-five-finger.json` - Beginner C position five-finger pattern as a Practice Song.
- `songs/practice-d-broken-triads.json` - Beginner D major broken-triad/arpeggio drill as a Practice Song.
- `songs/practice-d-major-five-finger.json` - Beginner D major five-finger pattern as a Practice Song.
- `songs/scarborough-fair-study.json` - Beginner Practice Song study reduction from the user-provided Scarborough Fair PDF.
- `songs/super-mario-brothers-midi.json` - C2-C5 Practice Song generated from selected MIDI tracks with downward transposition.
- `songs/wet-hands-midi-draft.json` - Rough C2-C5 Practice Song generated from user-provided MIDI with notes above C5 dropped.
- `songs/wet-hands-sketch.json` - Simplified D major `Wet Hands Sketch` Practice Song with an optional scale hint.

## docs/agents

- `docs/agents/issue-tracker.md` - Issue tracker workflow consumed by engineering skills.
- `docs/agents/triage-labels.md` - Triage role to tracker label mapping consumed by engineering skills.
- `docs/agents/domain.md` - Domain documentation lookup rules consumed by engineering skills.

## scripts

- `scripts/midi-to-song-json.mjs` - Dependency-free Standard MIDI File importer that converts local `.mid` files into Practice Song JSON with transpose, grouping, track/channel filtering, and range-warning options.
- `scripts/midi-to-song-json.test.mjs` - Importer tests covering MIDI parsing, simultaneous-note grouping, track/channel filtering, out-of-range warnings, and Practice Song JSON output.

## src/main

- `src/main/index.ts` - Electron main process entrypoint; creates the native window, permits Web MIDI plus launch-time audio start, owns the native app menu including View appearance switching, and updates the appearance menu label from renderer theme state.

## src/preload

- `src/preload/index.ts` - Electron preload bridge exposing app/platform metadata, native theme-toggle menu events, and renderer-to-main theme mode updates.

## src/renderer

- `src/renderer/index.html` - Renderer HTML shell loaded by Vite/Electron.

## src/renderer/public

- `src/renderer/public/favicon.svg` - Small SVG app favicon served by the renderer dev server and production build.

## src/renderer/src

- `src/renderer/src/App.tsx` - Main practice-surface state container; coordinates MIDI and on-screen input sources, automatic audio, optional scale, chord preview, Practice Song state, MIDI-only step advancement, press-ordered live chord, staff, and keyboard UI.
- `src/renderer/src/main.tsx` - React renderer entrypoint.
- `src/renderer/src/styles.css` - Flexoki-inspired light/dark app theming, layout, staff, and piano keyboard CSS.
- `src/renderer/src/styles.test.ts` - CSS regression tests for piano key stacking and theme toggle styles.
- `src/renderer/src/vite-env.d.ts` - Vite client type references.

## src/renderer/src/components

- `src/renderer/src/components/ChordDisplay.tsx` - Live chord name plus optional Chord Preview or Practice Preview context, song step count, and colored note-pill display.
- `src/renderer/src/components/PianoKeyboard.tsx` - Playable C2-C5 37-key keyboard UI with labels, scale tinting, chord preview target markers, pointer input, and pressed states.
- `src/renderer/src/components/ScaleWheel.tsx` - Playable selected or no-key pitch-class circle with active-note highlighting and octave-3 pointer input.
- `src/renderer/src/components/StaffNotation.test.tsx` - Staff note-head, stacking, and hover-target rendering tests.
- `src/renderer/src/components/StaffNotation.tsx` - Playable SVG grand staff with treble/bass clefs, stacked ghosted chord preview notes, compact colored active-note groups, hover targets, and ledger lines.
- `src/renderer/src/components/TopBar.test.ts` - Top bar chord preview option state tests.
- `src/renderer/src/components/TopBar.tsx` - Compact MIDI/audio signal cluster, scale selector, Practice Song selector and icon controls, and conditional chord preview selector.

## src/renderer/src/music

- `src/renderer/src/music/chords.ts` - Press-order-preserving pitch-class chord analysis for live major/minor/seventh/suspended/diminished/augmented labels, named-chord detection, and chord quality classification.
- `src/renderer/src/music/chords.test.ts` - Chord analysis tests.
- `src/renderer/src/music/activeNotes.ts` - Active input source state machine for MIDI polyphony, monophonic on-screen input, source replacement, and held-note onset timing.
- `src/renderer/src/music/activeNotes.test.ts` - Active input source replacement and timing stability tests.
- `src/renderer/src/music/chordPreview.ts` - Major/minor triad preview options, third-octave root-position preview shapes, and selected-scale membership helpers.
- `src/renderer/src/music/chordPreview.test.ts` - Chord preview option, shape, and selected-scale membership tests.
- `src/renderer/src/music/colors.ts` - Flexoki accent palette plus stable note and root-colored chord mapping.
- `src/renderer/src/music/notes.ts` - MIDI/note conversion, incoming keyboard transposition, C2-C5 keyboard model, pitch-class helpers, and velocity normalization.
- `src/renderer/src/music/notes.test.ts` - Note conversion and 37-key range tests.
- `src/renderer/src/music/practiceSongLibrary.ts` - Vite raw-file loader that discovers root `songs/*.json` and turns them into Practice Song selector options.
- `src/renderer/src/music/practiceSongs.ts` - Practice Song JSON validation, Practice Step grammar parsing, optional scale parsing, disabled invalid-song option construction, and exact MIDI set matching.
- `src/renderer/src/music/practiceSongs.test.ts` - Practice Step parsing, Practice Song validation, invalid selector option, and exact-match tests.
- `src/renderer/src/music/scales.ts` - Major/minor scale pitch-class helpers.
- `src/renderer/src/music/scales.test.ts` - Scale pitch-class tests.
- `src/renderer/src/music/songFixtures.test.ts` - Regression test that every root `songs/*.json` file parses as a valid Practice Song.
- `src/renderer/src/music/staff.ts` - Press-order-preserving, grouped, simultaneous-note-aware, and input-hit-tested placement model for the SVG grand staff.
- `src/renderer/src/music/staff.test.ts` - Staff placement, input hit-testing, and chord-stacking tests.

## src/renderer/src/services

- `src/renderer/src/services/midi.ts` - Renderer Web MIDI connection, input status, and note on/off parsing.
- `src/renderer/src/services/midi.test.ts` - MIDI parsing timestamp tests for stable staff grouping.
- `src/renderer/src/services/pianoAudio.ts` - Tone.js sampled piano engine using `@tonejs/piano`, plus synth fallback.

## src/renderer/src/types

- `src/renderer/src/types/electron-api.d.ts` - Type declarations for the preload-exposed `window.poleskiPiano` bridge and native theme-toggle callback.
- `src/renderer/src/types/web-midi.d.ts` - Minimal Web MIDI type declarations for Chromium/Electron renderer code.
