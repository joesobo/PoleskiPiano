# Architecture

Living file map for PoleskiPiano. Update before committing whenever files are added, removed, or repurposed.

## Root

- `.gitignore` - Ignores dependencies, build output, logs, macOS metadata, local CodeGraphy cache files, Playwright smoke artifacts, and in-repo worktrees.
- `AGENTS.md` - Repository instructions for coding agents, including workflow rules and skill configuration.
- `CONTEXT.md` - Product context, v0 decisions, layout contract, and deferred scope.
- `README.md` - Project overview, run commands, verification commands, v0 scope, and deferred features.
- `architecture.md` - Living file map for this repository.
- `electron.vite.config.ts` - Electron Vite build configuration for main, preload, and React renderer targets, including the dev-server Practice Song list/save HTTP bridge used when the renderer is opened in a browser.
- `package-lock.json` - NPM dependency lockfile for the Electron/React/Tone scaffold.
- `package.json` - Project metadata including the `PoleskiPiano` product name, scripts including MIDI song import, runtime dependencies, and dev dependencies.
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
- `scripts/run-electron-vite.mjs` - Dev/preview launcher that copies Electron into ignored `.electron-dev/PoleskiPiano.app`, patches the macOS bundle and executable name to `PoleskiPiano`, then runs Electron Vite with the patched executable so Dock hover text uses the app name in local development.

## src/main

- `src/main/index.ts` - Electron main process entrypoint; sets the native app name to `PoleskiPiano`, creates the native window with the app icon, permits Web MIDI plus launch-time audio start, owns the native app menu including View appearance switching, updates the appearance menu label from renderer theme state, and wires root `songs/` list/save IPC for Practice Song Builder.
- `src/main/practiceSongFiles.ts` - Node-side Practice Song file service for listing/saving root `songs/*.json`, validating IPC/dev-server save payloads, normalizing filenames, and preventing path traversal.

## src/preload

- `src/preload/index.ts` - Electron preload bridge exposing app/platform metadata, native theme-toggle menu events, renderer-to-main theme mode updates, and Practice Song list/save IPC wrappers.

## src/renderer

- `src/renderer/index.html` - Renderer HTML shell loaded by Vite/Electron, including the app icon link.

## src/renderer/public

- `src/renderer/public/app-icon.png` - PNG export of the app icon used by Electron for the native window and macOS dock.
- `src/renderer/public/app-icon.svg` - Clean SVG app icon source using a rounded piano-key silhouette and Flexoki note-color accents, served by the renderer favicon link.
- `src/renderer/public/favicon.svg` - SVG favicon matching the app icon for older icon consumers.

## src/renderer/src

- `src/renderer/src/App.tsx` - Main practice-surface state container; coordinates MIDI and on-screen input sources, automatic audio, optional scale, mutually-exclusive chord preview and Practice Song selection, Practice Song Builder drafts, MIDI-only step advancement, arrow-key step navigation, press-ordered live chord, staff, and keyboard UI.
- `src/renderer/src/main.tsx` - React renderer entrypoint.
- `src/renderer/src/styles.css` - Flexoki-inspired light/dark app theming, layout, staff, and piano keyboard CSS.
- `src/renderer/src/styles.test.ts` - CSS regression tests for piano key stacking, theme toggle styles, dropdown sizing, and stable top-bar practice mode layout.
- `src/renderer/src/vite-env.d.ts` - Vite client type references.

## src/renderer/src/components

- `src/renderer/src/components/ChordDisplay.tsx` - Live chord name plus optional Chord Preview, Practice Preview, or builder draft context, song step count, builder save errors, and colored note-pill display.
- `src/renderer/src/components/PianoKeyboard.tsx` - Playable C2-C5 37-key keyboard UI with labels, scale tinting, chord preview target markers, pointer input, and pressed states.
- `src/renderer/src/components/ScaleWheel.tsx` - Playable selected or no-key pitch-class circle with active-note highlighting and octave-3 pointer input.
- `src/renderer/src/components/StaffNotation.test.tsx` - Staff note-head, stacking, and hover-target rendering tests.
- `src/renderer/src/components/StaffNotation.tsx` - Playable SVG grand staff with treble/bass clefs, stacked ghosted chord preview notes, compact colored active-note groups, hover targets, and ledger lines.
- `src/renderer/src/components/TopBar.test.ts` - Top bar chord preview visibility, chord preview option state, practice song option state, and practice-control icon tests.
- `src/renderer/src/components/TopBar.tsx` - Compact MIDI/audio signal cluster, always-visible Scale/Chord Preview/Song selector row, selection-only Practice Song selector with a `New Song` option, pending-title composer in the temporary second row, and temporary second-row practice/builder icon controls.

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
- `src/renderer/src/music/practiceSongBuilder.ts` - Practice Song Builder draft model, note toggling, step navigation, title/scale/file validation, slug generation, and low-to-high step serialization.
- `src/renderer/src/music/practiceSongBuilder.test.ts` - Practice Song Builder draft editing, save validation, slug, and serialization tests.
- `src/renderer/src/music/practiceSongLibrary.ts` - Vite raw-file loader that discovers root `songs/*.json` and turns them into Practice Song selector options.
- `src/renderer/src/music/practiceSongs.ts` - Practice Song JSON validation, Practice Step grammar parsing, optional scale parsing, normalized song path handling, disabled invalid-song option construction, and exact MIDI set matching.
- `src/renderer/src/music/practiceSongs.test.ts` - Practice Step parsing, Practice Song validation, normalized song paths, invalid selector option, and exact-match tests.
- `src/renderer/src/music/scales.ts` - Major/minor scale pitch-class helpers.
- `src/renderer/src/music/scales.test.ts` - Scale pitch-class tests.
- `src/renderer/src/music/songFixtures.test.ts` - Regression test that every root `songs/*.json` file parses as a valid Practice Song.
- `src/renderer/src/music/staff.ts` - Press-order-preserving, grouped, simultaneous-note-aware, and input-hit-tested placement model for the SVG grand staff.
- `src/renderer/src/music/staff.test.ts` - Staff placement, input hit-testing, and chord-stacking tests.

## src/renderer/src/services

- `src/renderer/src/services/midi.ts` - Renderer Web MIDI connection, input status, and note on/off parsing.
- `src/renderer/src/services/midi.test.ts` - MIDI parsing timestamp tests for stable staff grouping.
- `src/renderer/src/services/pianoAudio.ts` - Tone.js sampled piano engine using `@tonejs/piano`, plus synth fallback.
- `src/renderer/src/services/practiceSongFiles.ts` - Renderer Practice Song file client that uses Electron preload IPC when available and falls back to the dev-server HTTP bridge in browser dev mode.
- `src/renderer/src/services/practiceSongFiles.test.ts` - Practice Song file client tests for Electron bridge preference and browser-dev HTTP fallback.

## src/renderer/src/types

- `src/renderer/src/types/electron-api.d.ts` - Type declarations for the preload-exposed `window.poleskiPiano` bridge, native theme-toggle callback, and Practice Song list/save methods.
- `src/renderer/src/types/web-midi.d.ts` - Minimal Web MIDI type declarations for Chromium/Electron renderer code.
