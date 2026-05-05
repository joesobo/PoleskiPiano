# PoleskiPiano Context

PoleskiPiano is a lightweight native desktop piano-learning app for a small 37-key MIDI keyboard.

## Product direction

- Start with one polished practice surface, not a multi-page app.
- Primary learner is a new beginner or returning player who learns visually and wants to play favorite songs.
- The first learning loop is a strong foundation in notes, chords, and keyboard geography; songs are a later application of that foundation.
- Keyboard geography means the visual/physical layout of notes and chords across octaves. Finger placement is deferred.
- Absolute note identity is the primary visual foundation. Scale relationships are secondary and should not overpower stable note identity.
- Chord learning starts as passive recognition feedback: the app names and colors what is currently being played, without drills or scoring.
- Chord preview is a lightweight reference overlay for a selected chord. It should reuse the live display surfaces and appear as a ghosted target the learner can play over.
- On-screen input behaves like MIDI input: a playable UI surface creates the same active note, audio, highlights, and chord analysis as the physical keyboard.
- Chord detection analyzes the currently active input source. MIDI input can produce polyphonic chords; on-screen input contributes one monophonic note in v0.
- On-screen input uses the same active-note visuals as MIDI input. It exists to let the learner click a notation or scale position and see the corresponding note name, staff position, pitch color, and piano key.
- Playable on-screen input surfaces are the bottom piano row, the middle-left scale circle, and the middle-right grand staff.
- The middle-center chord display is a readout, not a playable input surface.
- Scale circle input plays the selected pitch class in octave 3 by default. There is no octave picker in v0.
- Scale circle input allows every pitch class. The selected scale does not prevent playing notes outside the scale.
- Scale circle drag switches to another pitch class when the pointer enters that pitch-class target. Empty space between targets keeps the last active on-screen note until another target is entered or the pointer is released.
- Grand staff input is pitch-position based: clicking a line or space plays the note represented by that vertical staff position, independent of horizontal position.
- Grand staff input is natural-note only in v0. Accidentals are deferred until sharp/flat notation is designed.
- Grand staff input is limited to natural notes in the visible keyboard range C2-C5. Clicks outside playable staff positions do nothing.
- Grand staff hover shows a faint note target at the playable staff position under the pointer using the note's pitch color. Pressing turns that target into the normal active note.
- Grand staff hover is local-only feedback. Other panels update only when on-screen input is pressed or dragged while active.
- Grand staff drag continuously snaps to the nearest playable natural note position inside the playable staff band. Dragging outside the playable band keeps the last active on-screen note until release or cancel.
- On-screen input supports press-hold-drag-release semantics. Dragging while held switches the on-screen input to the note under the pointer.
- On-screen input is monophonic in v0. One pointer produces one active note at a time.
- During drag, moving to a different playable note stops the prior on-screen note and starts the new note immediately. Moving within the same note does not retrigger audio.
- On-screen input stops on pointer up, pointer cancel, or when the pointer leaves the active window so notes do not get stuck.
- On-screen input uses pointer events generally, not mouse-only handlers, so mouse, trackpad, pen, and touch share the same model.
- On-screen input should use pointer capture while held so release and cancel handling remains reliable.
- On-screen input is coordinated by one shared app-level input controller. Playable surfaces report note start, switch, and stop; the shared controller owns active input source replacement, audio, and cross-panel updates.
- On-screen input uses fixed velocity 0.5 in v0. MIDI input keeps real MIDI velocity.
- Physical MIDI keyboard input remains polyphonic: holding C3 and then pressing D3 on the MIDI keyboard displays and sounds C3 + D3.
- Switching between physical MIDI input and on-screen input replaces notes from the previous input source. If on-screen C3 is held and MIDI D3 is pressed, the active display and sound switch to D3.
- Switching input sources stops currently sounding notes from the replaced source before starting the new source, so replacement is audible as well as visual.
- Replaced input sources do not automatically resume. If MIDI D3 is held, on-screen C3 replaces it, and on-screen C3 is released, the app goes silent until a new input event arrives.
- Live playing visually wins over chord preview. Preview notes stay ghosted underneath active notes, and unmatched live notes are shown normally rather than marked wrong.
- When chord preview is selected, the preview chord name remains visible alongside the live chord name. The preview notes are ghosted, but the preview identity is not hidden.
- In the center chord panel, the live chord remains dominant. The preview chord label is lightly displayed above it.
- Matching preview notes become normal active notes. There are no success, error, scoring, or completion states in v0.
- Chord preview is visual only. Selecting a preview chord does not play audio.
- Clicking a chord preview target behaves as normal on-screen input for that note. It does not mark success, auto-play a chord, or change the selected preview.
- Chord preview defaults to None and is opt-in.
- Chord preview is selected from the top bar beside Scale.
- The selector label is "Chord Preview".
- Chord preview shows one concrete root-position chord shape with the chord root in octave 3. Inversions and octave controls are deferred.
- Chord preview uses normal pitch-based grand staff placement, with chord notes stacked in one notation slot.
- Live notes played within the 250ms simultaneous-note window stack in one notation slot. The window allows realistic hand-played MIDI chord timing, not only identical event timestamps. Notes added later while still holding earlier notes remain separate left-to-right groups.
- The simultaneous-note window is based on the renderer's MIDI message receipt time so grouping reflects what the app actually receives, not controller-specific event timestamps.
- Held notes keep their original press time even if repeated note-on messages arrive, so stacked chord notation remains stable while keys are held.
- Chord preview notes use the same pitch-class colors as live notes, but lighter or more transparent. On the piano keyboard, chord preview uses small colored target circles while selected scale owns full-key tinting.
- Chord preview notes remain visible even when they are outside the selected scale.
- Chord preview uses existing note labels only; it does not add extra labels to ghosted notes.
- Chord preview applies to the chord display, grand staff, Falling Notes View, and piano keyboard. The pitch circle remains a scale-structure view for now.
- In Falling Notes View, Chord Preview appears as a frozen ghost chord block aligned to the same key lanes as real falling notes.
- Initial chord preview choices are the 12 major triads and 12 minor triads. Seventh, suspended, diminished, augmented, inversions, and octave variants are deferred.
- Chord preview remains independent from the selected scale. Chord name text in the preview selector uses the chord root's pitch-class color; when a scale is selected, options outside that scale are dimmed, not hidden or disabled.
- A preview chord is considered inside a selected scale only when all of the chord's notes belong to that scale.
- MIDI connection is represented in the top bar by a connected/unconnected status light, not the MIDI device name.
- MIDI connection status and audio activity should sit together as a compact signal cluster on the far left of the top bar.
- Theme switching is a native app command under the View menu, not a visible control in the practice surface. The command uses Appearance wording.
- Practice Preview reuses the same ghost-note visual language as Chord Preview, but it is sourced from the current Practice Target.
- When a Practice Song is selected, Practice Preview owns the ghost target surface and the Chord Preview value is reset to None.
- The top bar keeps Scale, Chord Preview, and Song selectors visible together in the top row. Song sits at the far right.
- Song and Chord Preview are mutually exclusive selections: choosing a Practice Song clears Chord Preview, and choosing a non-None Chord Preview clears the selected Practice Song.
- Practice controls and authoring controls appear in a temporary second top-bar row only when needed.
- Creating a new Practice Song starts from a plain `New Song` choice in the Song selector, then shows the title entry and create/cancel controls in the temporary second top-bar row. The Song selector menu is selection-only, not a text-entry surface.
- Practice Preview shows the selected Practice Song title and current target count as lightweight context, such as `Song Name 2/12`.
- Practice Preview shows the Practice Song title as normal text with the current target count beside it.
- Practice Preview shows only the current Practice Target's note or notes below the title as ghosted targets, matching the Chord Preview visual treatment.
- Beginner-facing UI should avoid unexplained theory terms such as diatonic, borrowed, and chromatic.
- Default keyboard range is C2 through C5.
- On-screen input uses the same C2-C5 keyboard range. It does not introduce scrolling, range extension, or separate playable ranges in v0.
- A Practice Song is readable notation plus timed practice targets loaded from a local song file.
- MusicXML is the planned canonical Practice Song source for falling-notes practice.
- Practice Songs should preserve enough notation structure for the learner to read the music while the app derives falling-note timing from the same source.
- Existing JSON `steps` songs were converted to MusicXML as a breaking change rather than supported through a legacy compatibility path.
- MIDI remains important as live input, but MIDI is not the planned canonical saved song format for falling-notes practice.
- Practice Song files are planned to use the `.musicxml` extension. `.xml` aliases and compressed `.mxl` files are out of scope for the first MusicXML implementation.
- Practice Song files live in the root `songs/` folder as `.musicxml` files.
- Falling-note targets should be derived from MusicXML note duration, rests, ties, chords, tempo, and measure structure.
- The first MusicXML implementation should support one Piano Part with up to two staves. Multi-part and multi-instrument scores are out of scope.
- The first MusicXML parser/renderer slice should support a beginner-piano subset: `score-partwise`, one part, measures, divisions, key signature, time signature, clefs, staves, notes, pitches, rests, durations, note types, dots, chords, ties, staff, voice, and tempo from `direction/sound tempo`.
- Note-length notation should support stems and beams as display metadata when present, and derive basic stems/beams when absent.
- Lyrics, articulations, dynamics, repeats, tuplets, pedal markings, ornaments, and multiple parts are out of scope for the first MusicXML implementation.
- Falling Notes View should use the full 3x1 middle-grid space when the Scale Wheel, Chord Display, and Staff Notation panels are hidden.
- The bottom Piano Keyboard remains visible in Falling Notes View.
- Falling Notes should not be a fourth 1x1 panel in the middle grid.
- Falling Notes should align horizontally to the full visible 37-key Piano Keyboard, including black-key offsets. Song-range zoom is deferred.
- Falling Notes should always show compact light-colored note labels when the note block has enough room.
- Chord falling-note groups render as wide chord blocks spanning only the chord member Piano Keys. The chord block carries the chord name, such as `Cmaj`, and small labels for the notes that make up the chord.
- If a named chord is part of a larger simultaneous target, such as `Cmaj + D3`, the chord block still covers only the chord tones and the extra note renders as a normal falling note layered above it.
- Falling note labels should be visually recessed into the block by deriving the label color from the note color instead of using a separate bright text color.
- Note labels should show enharmonic flat aliases for sharp notes on a second line, such as `A#2` over `B♭2`, while keeping internal note ids in the canonical sharp form.
- Falling Notes should use lighter key-tint versions of pitch-class colors, closer to the UI keyboard highlight color than saturated note-pill colors.
- Falling Notes v1 should use pitch-class colors only to reinforce visual note association. Left/right hand colors are deferred.
- Falling Notes View should not repeat the selected song title inside the panel because song identity already lives in the top bar.
- Falling Notes View should not add side padding around the visual lane because the falling-note lanes need to align edge-to-edge with the bottom 37-key Piano Keyboard.
- Middle-grid visibility should be managed by a Panel Manager. Panels declare sizes, and toggling a panel on can toggle off whatever visible panels are needed to make space.
- Scale Wheel, Chord Display, and Staff Notation are `1x1` middle panels. Falling Notes View is a `3x1` middle panel.
- Panel Manager eviction is recency-based: the requested panel becomes most recent and stays visible, while the oldest visible panels are toggled off until the requested panel fits.
- Panels remember their middle-grid positions. Chord Display should keep returning to the middle slot when visible.
- A panel's remembered middle-grid position is a claim. When toggled on, the requested panel takes its remembered slot and evicts the occupant if needed.
- Panel visibility can be changed from a right-click panel context menu and from native `View > Panels` checkbox menu items.
- Guided Practice waits at each target until the learner plays the required note or chord.
- Guided Practice accepts a small early hit window before the target reaches the hit line, so improved playing can feel closer to continuous Performance Practice.
- The shared early-hit window is `150ms`, intentionally inside the requested `100ms` to `250ms` range so a learner cannot hold the key long before the note arrives.
- Guided Practice advances on correct note or chord onset. Hold-duration feedback can be shown, but hold duration does not block advancement in v1.
- In Guided Practice, the entire Falling Notes timeline pauses when the start of the next falling note reaches the hit line.
- A Guided Practice pause resumes only after the learner plays every note in the current Practice Target. Chord targets require all required notes.
- Guided Practice chord targets allow easy-mode accumulation while paused: the learner can add chord notes one by one, and the timeline resumes when all required notes are currently held together.
- Wrong extra notes pressed as part of the current target attempt block Guided Practice resume until released.
- Older notes that are still held from a previous target do not block the next target. This supports connected-note practice, such as holding C while playing D, without requiring release timing in v1.
- Performance Practice keeps the song clock running at tempo and scores whether each required note is hit while its falling note overlaps the hit line.
- Performance Practice accepts the same small early hit window as Guided Practice.
- In Performance Practice, the visible falling-note duration is the hit window. If the note overlaps the hit line for `0.5s`, the learner has `0.5s` to press the correct Piano Key.
- Performance Practice score does not grade early/late precision inside the active hit window.
- Falling note length is a visual hold hint and hit-window duration, not a separate release-scored metric in v1.
- Performance Practice score is target-level and black-and-white in v1. Chord targets require every required note during the active hit window; partial chord credit is deferred.
- Performance Practice score is shown as `hits / total` plus percent, such as `18/24 · 75%`. Guided Practice does not show a score.
- Wrong keys are feedback-only in v1 Performance Practice. They do not directly change score or immediately mark the current target missed.
- Falling Notes are visual note spans with start time, duration, end time, pitch, label, and pitch-class color. Ties merge into one longer visual span; overlapping held notes remain separate spans.
- Practice Targets are onset groups used for Guided Practice pauses and chord requirements. Falling Note spans define visual hold cues and each note's active hit window.
- If one note is held while another starts later, the learner can score both by pressing each note during its own active span. Holding the first note for its full visual duration is encouraged visually but not required for score in v1.
- Practice Song BPM comes from MusicXML tempo and is fixed/display-only in the app.
- Falling Notes playback speed is a learner-controlled percentage that defaults to `100%` and scales the song clock without changing the song's saved BPM.
- Falling Notes playback speed can be adjusted from `25%` to `200%`.
- The fixed BPM display should read as compact metadata, not as a clickable button.
- Falling Notes UI should label the two song behaviors as `Guided Practice` and `Performance Practice`; avoid `Practice Mode` and `Play Mode` in the app language.
- Guided/Performance mode, fixed BPM display, speed percentage control, and playback controls belong in the temporary second top-bar row when a Practice Song is selected.
- Falling Notes View should focus on the piano-roll visual lane rather than duplicating playback controls inside the panel.
- Falling Notes v1 should use a short visual lead-in instead of a heavy countdown. Notes should already be entering from the top of the panel when playback starts, with roughly a measure or less before the first target reaches the hit line.
- Correct target hits should trigger a subtle visual confirmation effect near the hit line.
- Metronome sound is deferred.
- Falling-note timing feedback should feel like forgiving game-style practice, closer to Rock Band or Yousician than strict classical assessment.
- Wrong-key feedback should register immediately when a played note is outside the active target, but it should not consume the correct target in the first implementation.
- The current Practice Song Builder should be replaced by a small Notation Builder for MusicXML authoring.
- The first Notation Builder should support choosing a note duration, toggling notes from the keyboard/staff, adding rests, moving measure-by-measure, and saving valid beginner MusicXML.
- Notation Builder should generate MusicXML behind the scenes and should not expose raw XML editing.
- Notation Builder should remain intentionally basic first and grow later.
- A Practice Target is one timed note onset, chord onset, or note set derived from MusicXML.
- While playing the current guided Practice Song flow, a Practice Target is matched by exact active note set. Note order and release order do not matter.
- A Practice Target does not advance when expected notes are missing or when extra notes are active.
- Practice Target advancement is triggered by physical MIDI keyboard input only. On-screen input still plays audio and updates the practice surface, but it does not complete Practice Targets.
- When a Practice Song is selected but paused, MIDI and on-screen input behave normally for audio, highlighting, chord display, and staff display. Auto-advance is off until playback is started.
- Selecting a Practice Song resets to the first Practice Target and starts paused.
- Switching between Practice Songs resets to the new song's first Practice Target and starts paused.
- Switching the Practice Song selector back to None clears Practice Preview while leaving the Chord Preview selector visible.
- Selecting a Practice Song with `scale` sets the Scale selector to that scale so the passive scale tint matches the song.
- A Practice Song's `scale` is an initial hint, not a lock. The learner can manually change Scale while practicing, and selecting another Practice Song applies that song's scale hint again.
- A Practice Song with an invalid optional `scale` is invalid. It remains visible as a disabled selector option with a red marker and tooltip error.
- When playback reaches the final Practice Target in the first Falling Notes implementation, the Practice Song should let the final falling note tail pass through the hit line before stopping instead of disappearing immediately or looping.
- Restart returns to the first Practice Target without changing playback state: playing stays playing, paused stays paused.
- Invalid Practice Song files remain visible in the Practice Song selector as disabled options. Disabled song options are visually dimmed, show a small red marker, and expose the parse or validation error in a hover tooltip.
- The top bar always shows the Practice Song selector. When a valid Practice Song is selected, Guided/Performance mode, fixed BPM, speed percentage, compact back, play/pause, next, restart, score, and edit controls appear in the temporary second row.
- Practice Song back and next controls use adjacent-target icons, not jump-to-start or jump-to-end icons.
- ArrowLeft and ArrowRight navigate previous and next Practice Targets when a valid Practice Song is selected.
- Practice Song controls are hidden when Practice Song is None or when a song file is invalid and disabled.
- Practice Song examples should include simple technique drills plus playable song imports or sketches.
- Built-in fun examples should prefer public-domain melodies or custom beginner arrangements with game/cartoon-adjacent energy instead of bundling copyrighted game or television themes.
- Built-in technique drills should cover common beginner practice goals: five-finger movement, evenness, slow metronome work, broken chords/arpeggios, hand independence, interval jumps, and simple chord progressions.
- The Song selector should include a generated `Random Scale Chords` Practice Song option. It should derive chords from the current Scale selector, default to C major when Scale is None, randomize its chord order each time playback starts, stay compatible with Falling Notes, Chord Display, Staff Notation, and Piano Keyboard preview surfaces, and remain an in-memory generated song rather than a saved fixture.
- A new Practice Song can still be started from the `New Song` option in the Song selector.
- Typing a new song title creates a pending new-song selection but does not create a file by itself.
- A pending new-song selection shows the create/edit control but does not show practice playback, target navigation, or restart controls.
- Song authoring should save MusicXML through an Electron main-process bridge. The renderer does not write to the filesystem directly.
- After saving a Practice Song, the in-app Practice Song list refreshes from disk so new and edited songs are available without restarting the app.
- Saving a Practice Song exits authoring, selects the saved song, and returns to normal paused Practice Song mode.
- Save errors are shown in the middle-center panel near the builder title and target count. Save validation should stay non-modal except for discard confirmation.
- Colors are stable absolute pitch-class colors. A note keeps the same color across piano keys and selected scales.
- Selected scale affects highlighting, not the pitch-class color mapping.
- Selected scale is background structure only. It lightly distinguishes notes that belong to the scale from notes outside it.
- Audio should feel like a real piano early. v0 uses sampled piano audio through `@tonejs/piano`.
- MIDI starts with renderer Web MIDI for speed and simplicity. Keep the code boundary small enough to replace with a native bridge later.

## Language

**Piano Key**:
A physical key on the 37-key MIDI keyboard or its on-screen keyboard representation.
_Avoid_: key, music key

**Scale**:
A selected tonic and mode, such as C major or A minor, used to show note-structure highlighting.
_Avoid_: key, music key

**Keyboard Geography**:
The visual and physical layout of notes and chords across octaves.
_Avoid_: finger position

**Chord Preview**:
A ghosted reference for a selected chord across the chord display, grand staff, and piano keyboard.
_Avoid_: ghost mode, chord drill

**On-screen Input**:
Playing notes directly through the app's visual surfaces instead of the physical MIDI keyboard.
_Avoid_: click mode, virtual keyboard mode

**Practice Song**:
Readable notation plus timed practice targets loaded from a local song file.
_Avoid_: song lesson, exercise

**Practice Target**:
One timed note onset, chord onset, or note set derived from MusicXML for guided or scored practice.
_Avoid_: Practice Step

**Chord Group**:
A named chord subset inside a Practice Target, such as the C3/E3/G3 notes inside `Cmaj + D3`.
_Avoid_: chord target when the target also has extra notes

**Piano Part**:
The single MusicXML part PoleskiPiano reads for a Practice Song, with up to two staves for piano notation.
_Avoid_: left-hand part, right-hand part

**Falling Notes View**:
A full-width middle practice surface that shows timed notes descending toward the Piano Keyboard.
_Avoid_: fourth panel

**Panel Manager**:
The middle-grid layout controller that turns panels on or off according to each panel's declared size.
_Avoid_: falling-notes mode

**Guided Practice**:
A Practice Song behavior where the song waits at each target until the learner plays it correctly.
_Avoid_: wait mode

**Performance Practice**:
A Practice Song behavior where the song clock keeps running and learner input is scored against timing targets.
_Avoid_: continuous mode

**Notation Builder**:
A small authoring mode for creating beginner MusicXML Practice Songs by editing notes, durations, rests, and measures.
_Avoid_: full notation editor, XML editor

**Practice Song Draft**:
An in-progress Practice Song being authored before it is saved as a local song file.
_Avoid_: recording, take, performance

## v0 layout

- Top bar: compact MIDI connection status and audio level cluster on the left; Scale, Chord Preview, and Song selectors in the top row; temporary practice/builder action controls in a second row when needed.
- Middle left: selected scale/circle-style pitch map.
- Middle center: live notes/chord being played.
- Middle right: traditional grand staff with treble and bass clefs.
- Planned Falling Notes View: full-width replacement for the three middle panels when Scale Wheel, Chord Display, and Staff Notation are hidden.
- Bottom: 37-key keyboard showing note labels, colors, scale membership, and pressed state.

## Current boundary

- There is no history or timeline in the v0 practice surface. The app represents what is being played now.

## Flagged ambiguities

- "Key" was used for both **Piano Key** and **Scale**. Resolved: use **Piano Key** for physical/on-screen keys, and **Scale** for C major/minor style structure.
