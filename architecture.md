# Architecture

Living file map for PoleskiPiano. Update before committing whenever files are added, removed, or repurposed.

## Root

- `.gitignore` - Ignores dependencies, build output, logs, macOS metadata, local CodeGraphy cache files, Playwright smoke artifacts, and in-repo worktrees.
- `AGENTS.md` - Repository instructions for coding agents, including workflow rules and skill configuration.
- `CONTEXT.md` - Product context, v0 decisions, layout contract, and deferred scope.
- `README.md` - Project overview, run commands, verification commands, v0 scope, and deferred features.
- `architecture.md` - Living file map for this repository.
- `electron.vite.config.ts` - Electron Vite build configuration for main, preload, and React renderer targets.
- `package-lock.json` - NPM dependency lockfile for the Electron/React/Tone/Fast XML Parser scaffold.
- `package.json` - Project metadata including the `PoleskiPiano` product name, runtime dependencies, and dev dependencies.
- `tsconfig.json` - Shared strict TypeScript configuration for Electron, renderer, and tests.
- `vitest.config.ts` - Vitest configuration excluding build output, dependencies, Git internals, and nested in-repo worktrees from test discovery.

## songs

- `songs/c-major-scale.musicxml` - Beginner C major scale Practice Song converted to MusicXML.
- `songs/can-can-theme.musicxml` - Beginner custom arrangement of the public-domain Offenbach can-can theme for fast, game-like falling-note practice.
- `songs/carol-of-the-bells-easy-piano.musicxml` - Public-domain easy piano MusicXML Practice Song imported from MuseTrainer and transposed into the C2-C5 keyboard range.
- `songs/entertainer-rag-hook.musicxml` - Beginner custom arrangement of a public-domain Scott Joplin ragtime hook for syncopated practice.
- `songs/hall-of-the-mountain-king-theme.musicxml` - Beginner custom arrangement of the public-domain Grieg theme for chromatic, game-like practice.
- `songs/happy-birthday-c-major.musicxml` - Public-domain C major MusicXML Practice Song imported from MuseTrainer and transposed into the C2-C5 keyboard range.
- `songs/korobeiniki-arcade-theme.musicxml` - Beginner custom arrangement of the public-domain Korobeiniki folk melody for arcade-style practice.
- `songs/ode-to-joy-easy-variation.musicxml` - Public-domain easy variation MusicXML Practice Song imported from MuseTrainer and transposed into the C2-C5 keyboard range.
- `songs/practice-c-arpeggio-ladder.musicxml` - Beginner C major arpeggio ladder drill for broken-chord movement and keyboard geography.
- `songs/practice-c-chord-changes.musicxml` - Beginner C major I-IV-V chord-change drill as a MusicXML Practice Song.
- `songs/practice-c-contrary-motion.musicxml` - Beginner C position contrary-motion drill for mirrored five-finger coordination.
- `songs/practice-c-five-finger.musicxml` - Beginner C position five-finger pattern as a MusicXML Practice Song.
- `songs/practice-d-broken-triads.musicxml` - Beginner D major broken-triad/arpeggio drill as a MusicXML Practice Song.
- `songs/practice-d-major-five-finger.musicxml` - Beginner D major five-finger pattern as a MusicXML Practice Song.
- `songs/practice-interval-jumps.musicxml` - Beginner interval-jump drill for thirds, fifths, and landmark-note reading.
- `songs/practice-left-hand-ostinato.musicxml` - Beginner coordination drill pairing a steady left-hand ostinato with a simple right-hand melody.
- `songs/practice-pop-progression-voice-leading.musicxml` - Beginner I-V-vi-IV chord progression drill for smooth chord changes.
- `songs/wet-hands-sketch.musicxml` - Simplified D major `Wet Hands Sketch` MusicXML Practice Song with an optional scale hint.

## docs/agents

- `docs/agents/issue-tracker.md` - Issue tracker workflow consumed by engineering skills.
- `docs/agents/triage-labels.md` - Triage role to tracker label mapping consumed by engineering skills.
- `docs/agents/domain.md` - Domain documentation lookup rules consumed by engineering skills.

## docs/plans

- `docs/plans/falling-notes-practice-song-format.md` - Living plan and decision log for the breaking Practice Song format redesign needed by falling-notes practice.

## scripts

- `scripts/run-electron-vite.mjs` - Dev/preview launcher that copies Electron into ignored `.electron-dev/PoleskiPiano.app`, patches the macOS bundle and executable name to `PoleskiPiano`, then runs Electron Vite with the patched executable so Dock hover text uses the app name in local development.

## src/main

- `src/main/appMenu.ts` - Pure native application menu template builder, including `View > Panels` menu items.
- `src/main/appMenu.test.ts` - Native menu regression tests for labeled menu rows and panel checkbox items.
- `src/main/index.ts` - Electron main process entrypoint; sets the native app name to `PoleskiPiano`, creates the native window with the app icon, permits Web MIDI plus launch-time audio start, owns the native app menu panel toggles, and wires root `songs/` list/save IPC for Practice Song authoring.
- `src/main/practiceSongFiles.ts` - Node-side Practice Song file service for listing/saving root `songs/*.musicxml`, validating IPC save payloads, normalizing filenames, and preventing path traversal.

## src/preload

- `src/preload/index.ts` - Electron preload bridge exposing app/platform metadata, native panel-toggle events, renderer-to-main panel visibility updates, and Practice Song list/save IPC wrappers.

## src/renderer

- `src/renderer/index.html` - Renderer HTML shell loaded by Vite/Electron, including the app icon link.

## src/renderer/public

- `src/renderer/public/app-icon.png` - PNG export of the app icon used by Electron for the native window and macOS dock.
- `src/renderer/public/app-icon.svg` - Clean SVG app icon source using a rounded piano-key silhouette and Flexoki note-color accents, served by the renderer favicon link.
- `src/renderer/public/favicon.svg` - SVG favicon matching the app icon for older icon consumers.

## src/renderer/src

- `src/renderer/src/App.tsx` - Main practice-surface state container; coordinates renderer-owned theme state, MIDI and on-screen input sources, automatic audio, optional scale, mutually-exclusive chord preview and MusicXML Practice Song selection, panel visibility/context menu state, current draft authoring, Guided/Performance falling-note playback state, Practice Song scoring, arrow-key target navigation, press-ordered live chord, staff, Chord Preview ghost targets, Falling Notes, and keyboard UI.
- `src/renderer/src/main.tsx` - React renderer entrypoint.
- `src/renderer/src/styles.css` - Flexoki-inspired light/dark app theming, layout, staff, and piano keyboard CSS.
- `src/renderer/src/themeStyles.test.ts` - Electron-backed browser regression test that verifies computed practice-panel background colors change from dark to light after a theme toggle.
- `src/renderer/src/panelManager.ts` - Middle-grid panel visibility reducer that applies declared panel sizes, remembered slots, and recency-based eviction.
- `src/renderer/src/panelManager.test.ts` - Panel Manager visibility, Falling Notes eviction, and remembered-slot tests.
- `src/renderer/src/styles.test.ts` - CSS regression tests for piano key stacking, theme toggle styles, dropdown sizing, panel context menu styles, and stable top-bar practice mode layout.
- `src/renderer/src/vite-env.d.ts` - Vite client type references.

## src/renderer/src/components

- `src/renderer/src/components/ChordDisplay.test.tsx` - Chord Display practice-preview tests for showing Practice Target chord names and distinguishing chord-tone note pills from extra notes.
- `src/renderer/src/components/ChordDisplay.tsx` - Live chord name plus optional Chord Preview, Practice Preview, or builder draft context, Practice Target count/name, builder save errors, colored note-pill display, and chord-tone emphasis for named Practice Target subsets.
- `src/renderer/src/components/FallingNotesPanel.test.tsx` - Falling Notes panel rendering tests for correct-hit feedback effects, keeping song title text out of the visual lane, first held chord visibility, chord-block/extra-note layering, and Chord Preview ghost blocks.
- `src/renderer/src/components/FallingNotesPanel.tsx` - Full-width 37-key Falling Notes panel aligned edge-to-edge to the on-screen keyboard, rendering MusicXML-derived timed note spans, wide named chord blocks with member-note labels, Chord Preview ghost chord blocks, held-duration height, a hit line, and subtle correct-hit feedback.
- `src/renderer/src/components/NoteLabel.test.tsx` - Note label rendering tests for inline octave display and stacked sharp/flat enharmonic aliases.
- `src/renderer/src/components/NoteLabel.tsx` - Shared visual note-label component that renders canonical note labels with normal octave digits and stacked enharmonic flat aliases.
- `src/renderer/src/components/PianoKeyboard.tsx` - Playable C2-C5 37-key keyboard UI with labels, scale tinting, chord preview target markers, pointer input, and pressed states.
- `src/renderer/src/components/ScaleWheel.tsx` - Playable selected or no-key pitch-class circle with active-note highlighting and octave-3 pointer input.
- `src/renderer/src/components/StaffNotation.test.tsx` - Staff note-head, stacking, and hover-target rendering tests.
- `src/renderer/src/components/StaffNotation.tsx` - Playable SVG grand staff with treble/bass clefs, stacked ghosted chord preview notes, compact colored active-note groups, hover targets, and ledger lines.
- `src/renderer/src/components/TopBar.test.ts` - Top bar chord preview visibility, chord preview option state, practice song option state, Guided/Performance control rendering, and practice-control icon tests.
- `src/renderer/src/components/TopBar.tsx` - Compact MIDI/audio/theme signal cluster, always-visible Scale/Chord Preview/Song selector row, selection-only Practice Song selector with a `New Song` option, pending-title composer in the temporary second row, Guided/Performance mode, BPM, speed, score, and temporary second-row practice/builder icon controls.

## src/renderer/src/music

- `src/renderer/src/music/chords.ts` - Press-order-preserving pitch-class chord analysis for live major/minor/seventh/suspended/diminished/augmented labels, named-chord detection, and chord quality classification.
- `src/renderer/src/music/chords.test.ts` - Chord analysis tests.
- `src/renderer/src/music/activeNotes.ts` - Active input source state machine for MIDI polyphony, monophonic on-screen input, source replacement, and held-note onset timing.
- `src/renderer/src/music/activeNotes.test.ts` - Active input source replacement and timing stability tests.
- `src/renderer/src/music/chordPreview.ts` - Major/minor triad preview options, third-octave root-position preview shapes, and selected-scale membership helpers.
- `src/renderer/src/music/chordPreview.test.ts` - Chord preview option, shape, and selected-scale membership tests.
- `src/renderer/src/music/colors.ts` - Flexoki accent palette plus stable note and root-colored chord mapping.
- `src/renderer/src/music/fallingNotes.ts` - Falling Notes playback helpers for first-note-visible lead-in timing, guided early-hit windows, guided completion/tail behavior, speed clamping, playhead target lookup, Performance Practice early-hit scoring, hit/miss scoring, and score summaries.
- `src/renderer/src/music/fallingNotes.test.ts` - Falling Notes timing, Guided Practice early-hit/completion, speed clamp, and black-and-white Performance Practice scoring tests.
- `src/renderer/src/music/notes.ts` - MIDI/note conversion, sharp/flat note-name parsing, visual note-label display parts, incoming keyboard transposition, C2-C5 keyboard model, pitch-class helpers, and velocity normalization.
- `src/renderer/src/music/notes.test.ts` - Note conversion, flat alias parsing, display-label part, and 37-key range tests.
- `src/renderer/src/music/practiceSongBuilder.ts` - Current lightweight Practice Song draft model for note toggling, target navigation, title/file validation, slug generation, and generated MusicXML save requests; planned to give way to Notation Builder.
- `src/renderer/src/music/practiceSongBuilder.test.ts` - Practice Song draft editing, MusicXML save validation, slug, and serialization tests.
- `src/renderer/src/music/practiceSongLibrary.ts` - Vite raw-file loader that discovers root `songs/*.musicxml` and turns them into Practice Song selector options.
- `src/renderer/src/music/practiceSongs.ts` - MusicXML Practice Song parser, generated-MusicXML writer, target timeline builder, Chord Group extraction for named chord subsets, optional scale parsing, normalized song path handling, disabled invalid-song option construction, and exact MIDI set matching.
- `src/renderer/src/music/practiceSongs.test.ts` - MusicXML parsing, generated song output, normalized song paths, invalid selector option, tie/chord/backup handling, Chord Group subset detection, and exact-match tests.
- `src/renderer/src/music/practiceTiming.ts` - Shared fixed timing-window constants for Falling Notes early-hit matching.
- `src/renderer/src/music/randomScaleChordPractice.ts` - In-memory generated Practice Song option that builds random diatonic major/minor triad drills from the selected scale, defaults to C major, and exposes seed helpers for rerandomizing on play.
- `src/renderer/src/music/randomScaleChordPractice.test.ts` - Random scale chord Practice Song generation, default scale, chord naming, seed variation, and parseability tests.
- `src/renderer/src/music/scales.ts` - Major/minor scale pitch-class helpers.
- `src/renderer/src/music/scales.test.ts` - Scale pitch-class tests.
- `src/renderer/src/music/songFixtures.test.ts` - Regression test that every root `songs/*.musicxml` file parses as a valid Practice Song with its expected default BPM and key chord targets.
- `src/renderer/src/music/staff.ts` - Press-order-preserving, grouped, simultaneous-note-aware, and input-hit-tested placement model for the SVG grand staff.
- `src/renderer/src/music/staff.test.ts` - Staff placement, input hit-testing, and chord-stacking tests.

## src/renderer/src/services

- `src/renderer/src/services/midi.ts` - Renderer Web MIDI connection, input status, and note on/off parsing.
- `src/renderer/src/services/midi.test.ts` - MIDI parsing timestamp tests for stable staff grouping.
- `src/renderer/src/services/pianoAudio.ts` - Tone.js sampled piano engine using `@tonejs/piano`.
- `src/renderer/src/services/practiceSongFiles.ts` - Renderer Practice Song file client that requires the local Electron preload IPC bridge.
- `src/renderer/src/services/practiceSongFiles.test.ts` - Practice Song file client tests for Electron bridge usage and unavailable bridge errors.

## src/renderer/src/types

- `src/renderer/src/types/electron-api.d.ts` - Type declarations for the preload-exposed `window.poleskiPiano` bridge, native panel-toggle callbacks, panel visibility updates, and Practice Song list/save methods.
- `src/renderer/src/types/web-midi.d.ts` - Minimal Web MIDI type declarations for Chromium/Electron renderer code.

## src/shared

- `src/shared/panels.ts` - Shared panel ids, labels, sizes, remembered middle-grid slots, and default visibility used by native menu and renderer panel manager.
