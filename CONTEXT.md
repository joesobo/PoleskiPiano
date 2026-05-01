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
- Chord preview applies to the chord display, grand staff, and piano keyboard. The pitch circle remains a scale-structure view for now.
- Initial chord preview choices are the 12 major triads and 12 minor triads. Seventh, suspended, diminished, augmented, inversions, and octave variants are deferred.
- Chord preview remains independent from the selected scale. Chord name text in the preview selector uses the chord root's pitch-class color; when a scale is selected, options outside that scale are dimmed, not hidden or disabled.
- A preview chord is considered inside a selected scale only when all of the chord's notes belong to that scale.
- Beginner-facing UI should avoid unexplained theory terms such as diatonic, borrowed, and chromatic.
- Default keyboard range is C2 through C5.
- On-screen input uses the same C2-C5 keyboard range. It does not introduce scrolling, range extension, or separate playable ranges in v0.
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

## v0 layout

- Top bar: MIDI device status, audio level, combined scale selector, chord preview selector, and dark/light theme toggle.
- Middle left: selected scale/circle-style pitch map.
- Middle center: live notes/chord being played.
- Middle right: traditional grand staff with treble and bass clefs.
- Bottom: 37-key keyboard showing note labels, colors, scale membership, and pressed state.

## Current boundary

- There is no history or timeline in the v0 practice surface. The app represents what is being played now.

## Flagged ambiguities

- "Key" was used for both **Piano Key** and **Scale**. Resolved: use **Piano Key** for physical/on-screen keys, and **Scale** for C major/minor style structure.
