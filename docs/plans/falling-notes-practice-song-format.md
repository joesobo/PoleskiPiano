# Falling Notes Practice Song Format Plan

## Goal

Add a falling-notes practice mode that can guide the learner through timed songs while preserving the ability to read standard notation at the same time.

## Ground Rules

- Use a breaking Practice Song format change instead of preserving old `steps` compatibility.
- Convert every existing `songs/*.json` file to the new format as part of the implementation.
- Fix every parser, builder, importer, fixture, and UI break caused by the format change.
- Keep writing decisions into this plan as they are made.

## Accepted Decisions

### 1. Replace `steps` as the source of truth

Current `steps` are exact note sets only. They cannot represent duration, rests, tempo, or held-over notes where one note continues while another begins.

Decision: replace `steps` with a timed song model. Existing songs should be migrated, not supported through a legacy adapter.

### 2. Use MusicXML as the canonical saved song format

The app needs falling notes and readable notation at the same time. Standard MIDI Files are strong for time-stamped playback, but they do not preserve the learner-facing notation model well enough. A custom JSON timeline would be easier to render as falling notes, but it would make PoleskiPiano invent and maintain a private notation-ish format.

Decision: use MusicXML as the canonical Practice Song source. Generate the falling-note timeline from MusicXML timing, duration, rests, ties, chords, tempo, and measure structure.

Rejected: a new app-specific JSON song format as the primary saved format.

### 3. Store Practice Songs as plain `.musicxml` files only

Plain MusicXML keeps songs readable, diffable, and hand-editable while the format is still evolving.

Decision: converted and newly authored Practice Songs should use the `.musicxml` extension.

Rejected: `.xml` aliases and compressed `.mxl` files for the first implementation.

### 4. Keep Practice Songs in root `songs/`

The learner-facing library concept should remain `songs/`; only the file format changes.

Decision: convert the existing root `songs/*.json` files into root `songs/*.musicxml` files.

Rejected: moving canonical Practice Songs into a separate `scores/`, `musicxml/`, or notation-specific folder.

### 5. Support one Piano Part with up to two staves first

Most beginner piano notation is one piano part split across treble and bass staves. Treating hands as separate app-level parts would make simple piano sheet music harder to model than it needs to be.

Decision: v1 supports one MusicXML Piano Part with up to two staves. Treble and bass notes derive one falling-note timeline. Staff and voice remain notation metadata.

Rejected: multi-instrument scores, multiple MusicXML parts, or separate app-level left-hand/right-hand song parts in the first implementation.

### 6. Parse a beginner-piano subset of MusicXML first

The app needs enough MusicXML to display readable notation and generate falling-note timing, not every possible score feature.

Decision: the first parser/renderer slice should support `score-partwise`, one part, `measure`, `attributes/divisions`, `key`, `time`, `clef`, `staves`, `note`, `pitch`, `rest`, `duration`, `type`, `dot`, `chord`, `tie`, `staff`, `voice`, `backup`, `forward`, and tempo from `direction/sound tempo`.

Decision: note-length notation should support stems and beams as display metadata when present, and derive basic stems/beams when absent.

Rejected for the first slice: lyrics, articulations, dynamics, repeats, tuplets, pedal markings, ornaments, and multiple parts.

### 7. Show Falling Notes as a full-width middle panel

The current middle grid is three 1x1 panels: Scale Wheel, Chord Display, and Staff Notation. Falling Notes needs the full 3x1 middle space because it represents time vertically and must leave enough width for readable note lanes and notation context.

Decision: the Falling Notes View should replace the three middle panels when those panels are hidden. The bottom Piano Keyboard remains visible.

Decision: do not render Falling Notes as a fourth middle-grid panel.

### 8. Use a Panel Manager for middle-grid visibility

Falling Notes should not be a hard-coded special mode. It is one panel in a small layout system.

Decision: middle-grid panels declare their size. Scale Wheel, Chord Display, and Staff Notation are each `1x1`. Falling Notes View is `3x1`.

Decision: toggling a panel on asks the Panel Manager to make room for that panel. The manager turns off whatever visible panels are needed to fit the requested panel.

Decision: toggling Falling Notes on should hide the current middle panels as needed because Falling Notes requires the full `3x1` space. Toggling any `1x1` panel back on while Falling Notes is visible should hide Falling Notes to make room.

Decision: eviction is recency-based. The requested panel becomes most recent and stays visible. The Panel Manager turns off the oldest visible panels until the requested panel fits.

Decision: panels remember their middle-grid position. For example, Chord Display should keep returning to the middle slot when it is visible.

Decision: a remembered slot is a claim, not a loose preference. When toggled on, the requested panel takes its remembered slot and evicts the occupant if needed.

### 9. Use Guided Practice and Performance Practice for the two song behaviors

The two falling-note behaviors should be named for the learner experience, not implementation mechanics.

Decision: `Guided Practice` waits at each target until the learner plays the required note or chord.

Decision: Guided Practice accepts a small early-hit window before the target reaches the hit line. This lets the same song gradually feel less stop-start as the learner improves.

Decision: `Performance Practice` keeps the song clock running at tempo and scores whether the learner hits each required note while that falling note overlaps the hit line.

Rejected names: wait mode, continuous mode.

### 10. Use forgiving game-like timing feedback first

The timing feel should be closer to Rock Band or Yousician practice than strict classical performance assessment.

Decision: a falling note's visible duration is also its scoring window in Performance Practice. If a falling note overlaps the hit line for `0.5s`, the learner has that `0.5s` window to press the correct key.

Decision: timing precision inside the scoring window does not affect score. The learner either hits the note while it is active at the hit line or misses it.

Decision: Performance Practice accepts the same small early-hit window as Guided Practice. This keeps forgiving play consistent without adding early/late scoring.

Decision: the shared early-hit window is `150ms`, which keeps forgiveness inside the requested `100ms` to `250ms` range without allowing a learner to hold a note far ahead of time and coast into the hit.

Decision: hold duration is not separately scored in v1. The falling note's length tells the learner how long to hold the key when trying to play the song, and the same length defines the window where an initial press can score as a hit.

Decision: Performance Practice scoring is target-level and black-and-white in v1. For a chord target, every required note must be hit during the active note window for the target to score as a hit. Partial chord credit is deferred.

Decision: Performance Practice score should show simple hit progress as `hits / total` plus percent, such as `18/24 · 75%`. Guided Practice does not show a score.

Decision: v1 stops at the end of the Practice Song instead of looping. Looping is a follow-on playback control.

Decision: Falling Notes should be derived as visual note spans, not only onset targets. A Falling Note has a start time, duration, end time, pitch, label, and pitch-class color. Ties merge into one longer visual span. Overlapping held notes remain separate spans.

Decision: Practice Targets remain onset groups for pausing and chord requirements. Falling Note spans define when each note can be hit and visually tell the learner how long to hold.

Decision: if C is held while D starts later, the learner can score both notes by pressing C during C's active window and D during D's active window, even if they do not hold C for the full visual span. The long C block is a musical hold cue, not a scored release requirement.

Decision: wrong keys should register immediately as visual feedback, but they do not directly affect Performance Practice score in v1. If the correct target is never hit during its active window, it is missed naturally.

Rejected: early/late/on-time scoring for the first Performance Practice implementation.

### 11. Replace Practice Song Builder with a small Notation Builder

The current Practice Song Builder is a step toggler. It cannot author rhythm, rests, durations, measures, or held-over notes, so it does not fit the MusicXML direction.

Decision: replace the current Practice Song Builder with a small `Notation Builder` that saves `.musicxml`.

Decision: the first Notation Builder should support choosing a note duration, toggling notes from the keyboard/staff, adding rests, moving measure-by-measure, and saving valid beginner MusicXML.

Decision: the Notation Builder should generate MusicXML behind the scenes. It should not expose raw XML editing.

Decision: keep the first Notation Builder intentionally basic and build on it later.

Rejected: building a full notation editor in the first implementation.

## External Format Notes

- Standard MIDI Files are a strong reference for time-stamped playback data: note-on/note-off events, ticks, tempo, tracks, and channels.
- MusicXML is a strong reference for notation data: note duration, rests, symbolic note type, ties, chords, voices, and staff placement.
- MusicXML `backup` and `forward` are required to coordinate multiple voices and multiple staves inside one part, so the first parser slice includes them even though they are not learner-facing controls.
- PoleskiPiano should parse MusicXML into runtime views for falling notes, practice scoring, staff rendering, and keyboard targets rather than saving a parallel song model.

## Implementation Progress

- Added a MusicXML-backed Practice Song parser and target model.
- Converted root `songs/*.json` fixtures to root `songs/*.musicxml`.
- Switched the app loader and file-save bridge to `.musicxml` files.
- Removed the MIDI converter from the app surface for now; Practice Songs are local `.musicxml` files.
- Added shared fixed practice-timing constants for future scoring work.
- Added a first Panel Manager and Falling Notes panel that can replace the three middle `1x1` panels.
- Added the first falling-note playback helper layer: one-measure lead-in, fixed song BPM, speed percentage, Guided Practice pausing, Performance Practice hit/miss scoring, and score summaries.
- Added a first 37-key-aligned Falling Notes visual pass with pitch-colored note spans, compact labels, duration-height blocks, a hit line above the Piano Keyboard, and subtle correct-hit feedback.
- Widened learner speed controls to `25%` through `200%`.
- Fixed Guided Practice so already-held early notes can complete the target when the hit line arrives, including the final target.
- Fixed final Guided Practice completion so it no longer gets stuck at the last note.
- Updated final Guided Practice completion so the last note continues falling through its visible tail after a correct hit instead of disappearing immediately.
- Added early-hit scoring for Performance Practice.
- Fixed Guided Practice target matching so notes held over from earlier targets do not block the next target, while newly pressed wrong extras still block the current attempt.
- Removed converted MIDI-derived song imports from the bundled Practice Song library.
- Added public-domain MuseTrainer MusicXML songs for `Ode to Joy`, `Happy Birthday`, and `Carol of the Bells`, transposed into the C2-C5 keyboard range and saved as plain `.musicxml`.
- Removed the bundled `study` reductions from the active library.
- Added beginner-friendly public-domain/custom arrangements with game/cartoon-adjacent energy: `Korobeiniki Arcade Theme`, `Mountain King Theme`, `Can-Can Theme`, and `Entertainer Rag Hook`.
- Added custom practice drills based on common beginner practice guidance: five-finger contrary motion, arpeggio ladders, left-hand ostinato coordination, interval jumps, and I-V-vi-IV voice-leading.
- Added a generated in-memory `Random Scale Chords` song option that pulls diatonic major/minor triads from the current Scale selector, defaults to C major, randomizes again each time playback starts, and works through the normal Practice Song/Falling Notes path.
- Added fixture coverage that locks the intended default BPM for every bundled `.musicxml` song.
- Removed the duplicate song title text from the Falling Notes panel, removed the panel's side padding so lanes align edge-to-edge with the 37-key keyboard, made BPM display as plain read-only text, and made falling-note labels use a recessed color derived from the note color.
- Fixed malformed self-closing MusicXML `<sound>` tags in bundled songs and rebuilt `Practice: C Chord Changes` as held chord targets so pressing Play has visible falling chord blocks immediately.
- Added chord-name metadata to Practice Targets and visible chord-name indicators in Chord Display and Falling Notes.
- Added Chord Group metadata so a named chord can be identified inside a larger simultaneous Practice Target, such as `Cmaj + D3`.
- Updated Falling Notes chord rendering so a chord appears as one wide falling chord block with the chord name and member-note labels, while extra simultaneous notes render as normal note blocks layered above it.
- Added frozen ghost chord blocks for Chord Preview in the Falling Notes panel.
- Added shared note-label rendering that keeps canonical sharp note ids internally but displays sharp/flat aliases on stacked lines in the visible UI.

## Falling Notes Panel Design Pass

Reference image direction: notes descend in vertical lanes toward the visible Piano Keyboard, each falling note aligns horizontally to the exact on-screen key it should trigger, note color follows the existing stable pitch-class color, and note height communicates how long the learner should hold the key.

External example notes:

- Synthesia teaches the core waterfall affordance: falling blocks touch the on-screen keyboard at the time the learner should play, BPM/speed controls are visible, labels can be shown on notes, and keyboard zoom can focus the visible range.
- Flowkey-style Wait Mode and Tomplay-style Wait Mode establish the guided behavior: the score/playhead waits until the learner plays the correct notes.
- Flowkey's Just Play and Synthesia's continuous playback establish the performance behavior: the song keeps moving even if the learner misses notes.
- Piano Marvel and rhythm-focused apps establish the scoring boundary: scoring belongs in performance-style play. PoleskiPiano v1 deliberately keeps score simpler than strict rhythm grading.
- Speed controls, looping, hand isolation, and tempo/metronome controls are common follow-on controls, but the first PoleskiPiano slice should stay smaller.

Current working assumptions to grill:

- Resolved: use the existing terms `Guided Practice` and `Performance Practice` instead of introducing `Practice Mode` and `Play Mode` as new product terms.
- Resolved: the Falling Notes panel should use the same full 37-key horizontal geometry as the bottom Piano Keyboard, including black-key offsets, so falling notes visually land on the exact visible key. Song-range zoom is deferred.
- Resolved: falling-note labels should always be visible in v1 when the block has enough space, using compact light-colored text. If a note block is too short for readable text, preserve layout over forcing the label.
- Resolved: falling-note block color should be a lighter key-tint version of the pitch-class color, closer to the UI keyboard highlight color than the saturated note-pill color.
- Resolved: v1 Falling Notes use note/pitch-class colors only. Hand colors are deferred because the goal is visual note association.
- The hit line is the top edge of the Piano Keyboard, not a separate floating target line.
- Resolved: BPM comes from the song's MusicXML tempo and is fixed/display-only in the app. Playback speed is a learner-controlled percentage that defaults to `100%`, ranges from `25%` to `200%`, and scales how fast the song moves.
- Resolved: Guided/Performance mode, fixed BPM display, speed percentage control, and playback controls live in the temporary second top-bar row when a Practice Song is selected. The Falling Notes panel focuses on the piano-roll visual lane.
- Resolved: v1 uses a short visual lead-in instead of a heavy countdown. Falling notes should already be entering from the top of the panel when playback starts, and the first target should reach the hit line after roughly a measure or less of travel.
- Resolved: Guided Practice should let the playhead advance at tempo until the next target reaches the hit line, then pause until the required note/chord is played.
- Resolved: Guided Practice should allow slightly early correct input before the playhead fully pauses at the target.
- Resolved: early input is limited to `150ms` before the target reaches the hit line. This is intentionally smaller than a note-length window so the learner cannot hold a correct key a full second early.
- Resolved: Guided Practice advances on correct note/chord onset. Hold duration can show feedback while the note tail passes, but it does not block advancement in v1.
- Resolved: in Guided Practice, the entire falling-note timeline pauses as soon as the start of the next falling note reaches the hit line. It stays paused until the learner plays the correct Practice Target. If the target is a chord, every required note must be hit before the timeline resumes.
- Resolved: Guided Practice chord targets allow easy-mode accumulation while paused. The learner can press chord notes one by one, and the timeline resumes when all required notes are currently held together. Wrong extra notes pressed during the current attempt block resume until released, but older notes held over from earlier targets are ignored so connected-note practice works.
- Resolved: Performance Practice should never pause for the learner; it records whether each note was hit while its falling block overlaps the hit line or inside the small early-hit window. Timing precision inside that active window does not affect score.
- Resolved: Guided Practice should show feedback but not a score.
- Resolved: Performance Practice should show a score based on hit/miss accuracy while each falling note is active at the hit line, not early/late timing accuracy.
- Resolved: hold duration is a visual hold hint and a hit-window length, not a separate release-scored metric in v1.
- Resolved: Performance Practice score is black-and-white at the Practice Target level. Chord targets require every required note during the active window; partial chord credit is deferred.
- Resolved: Performance Practice score is displayed as `hits / total` plus percent. Guided Practice has no score.
- Resolved: wrong keys are feedback-only in v1 Performance Practice. They do not directly change score or immediately mark the current target missed.
- Resolved: Falling Notes are visual note spans with start and duration. Practice Targets are onset groups. Visual spans can overlap; scoring checks whether each required note is pressed during its active visual span, not whether it is held until release.
- Resolved: note blocks should span from note-on to note-off according to the MusicXML-derived duration after tempo conversion.
- Resolved: the Falling Notes panel should not duplicate the selected song title because the top bar already owns song identity.
- Resolved: the Falling Notes visual stage should run edge-to-edge horizontally so its lane geometry matches the bottom Piano Keyboard instead of being inset by panel padding.
- Resolved: the fixed BPM readout should look like read-only metadata, not a button.
- Resolved: a generated `Random Scale Chords` option belongs in the Song selector, not in a separate chord-drill surface. It should use the selected scale, default to C major when Scale is None, regenerate its chord order each time playback starts, generate a normal in-memory MusicXML-backed Practice Song, and therefore work with Falling Notes and all existing preview panels.
- Resolved: chord Practice Targets should carry a chord name, such as `Cmaj`, alongside the note labels. The note labels teach the component notes, while the chord name teaches the shape identity.
- Resolved: if a Practice Target contains a named chord plus extra notes, the named subset becomes a Chord Group instead of forcing the whole target to be one chord. For example, `C3 + D3 + E3 + G3` should teach `Cmaj` from C/E/G while keeping D3 visually separate.
- Resolved: Falling Notes should render a Chord Group as a fat falling chord block spanning the chord member key lanes, with the chord name and member-note labels inside the block. Extra simultaneous notes are stacked above as regular falling notes so they remain visibly outside the chord.
- Resolved: Chord Preview should also appear in Falling Notes as a frozen ghost chord block, keeping the panel useful when no Practice Song is selected.
- Resolved: MusicXML `<harmony>` symbols should not create Falling Notes chord blocks by themselves. A chord block should come from the actual note combination the learner is asked to play.
- Resolved: visible note labels should show enharmonic flat aliases for sharp notes on separate stacked lines, with normal inline octave digits.

## Practice Library Notes

- MuseTrainer is useful as a public-domain MusicXML source for import candidates: https://musetrainer.github.io/library/
- For game/TV-like energy, prefer public-domain melodies and custom beginner arrangements rather than bundling copyrighted game or television themes.
- Beginner practice pieces should cover the patterns teachers repeatedly recommend: five-finger movement, slow metronome work, evenness, broken chords/arpeggios, hand independence, interval recognition, and common chord progressions.
- Practice reference notes used for this pass:
  - Yousician beginner exercises emphasize five-finger scales, finger independence, broken chords, and hand independence: https://yousician.com/blog/piano-exercises
  - Pianote's beginner routine uses five-note scales in multiple positions and arpeggios over left-hand fifths: https://www.pianote.com/blog/piano-practice-routine-for-beginners/
  - True Metronome's piano guidance emphasizes slow metronome work, evenness, small BPM increases, and hands-separate practice before combining hands: https://truemetronome.app/blog/metronome-for-piano/

## Open Questions

1. Resolved: Falling Notes align to all 37 visible Piano Keys exactly. A zoomed "song range only" view is deferred.
2. Resolved: labels on falling notes are always visible in compact light-colored text when the note block has enough space. Configurable labels are deferred.
3. Resolved: Guided Practice only requires the correct onset to advance. Hold duration feedback is allowed but should not block advancement in v1.
4. Resolved: Performance Practice does not score release timing or early/late timing. A note scores as hit when the correct Piano Key is pressed while the falling note overlaps the hit line or inside the small early-hit window. The note length indicates how long the learner should try to hold the key.
5. Resolved: show fixed song BPM from MusicXML and add a user-adjustable speed percentage control that defaults to `100%`.
6. Resolved: visible one-measure lead-in comes first. Metronome sound is deferred.
7. Resolved: pitch-class color remains the only v1 Falling Notes color. Left/right hand color is deferred.
