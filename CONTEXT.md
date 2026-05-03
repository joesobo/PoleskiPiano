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
- MIDI connection is represented in the top bar by a connected/unconnected status light, not the MIDI device name.
- MIDI connection status and audio activity should sit together as a compact signal cluster on the far left of the top bar.
- Theme switching is a native app command under the View menu, not a visible control in the practice surface. The command uses Appearance wording.
- Practice Preview reuses the same ghost-note visual language as Chord Preview, but it is sourced from the current Practice Step.
- When a Practice Song is selected, Practice Preview owns the ghost target surface and the Chord Preview value is reset to None.
- The top bar keeps Scale, Chord Preview, and Song selectors visible together in the top row. Song sits at the far right.
- Song and Chord Preview are mutually exclusive selections: choosing a Practice Song clears Chord Preview, and choosing a non-None Chord Preview clears the selected Practice Song.
- Practice controls and Practice Song Builder controls appear in a temporary second top-bar row only when needed.
- Creating a new Practice Song starts from a plain `New Song` choice in the Song selector, then shows the title entry and create/cancel controls in the temporary second top-bar row. The Song selector menu is selection-only, not a text-entry surface.
- Practice Preview shows the selected Practice Song title and current step count as lightweight context, such as `Song Name 2/12`.
- Practice Preview shows the Practice Song title as normal text with the current step count beside it.
- Practice Preview shows only the current Practice Step's note or notes below the title as ghosted targets, matching the Chord Preview visual treatment.
- Beginner-facing UI should avoid unexplained theory terms such as diatonic, borrowed, and chromatic.
- Default keyboard range is C2 through C5.
- On-screen input uses the same C2-C5 keyboard range. It does not introduce scrolling, range extension, or separate playable ranges in v0.
- A Practice Song is an ordered list of Practice Steps for rudimentary song practice.
- A Practice Step is one expected note, chord, or note set the learner should play before moving forward.
- Practice Songs are local JSON objects with `title` and ordered `steps`. The selector uses `title`; missing titles fall back to filename.
- Practice Songs can optionally include `scale`, such as `D major`, to describe the song's passive scale structure.
- Practice Song files live in the root `songs/` folder.
- Practice Songs can be generated from local MIDI files the learner has rights to use. The importer groups MIDI notes that start together into one Practice Step.
- The MIDI importer should fail visibly on out-of-range notes by default instead of silently creating unusable Practice Songs. Transpose and rough-draft drop options are explicit.
- Practice Step strings support exact notes with octave such as `C3`, pitch classes without octave such as `F#`, major/minor chord aliases such as `CMajor` and `DMinor`, and simultaneous sets joined by `+`.
- Pitch classes without octave in Practice Steps default to octave 3.
- A Practice Step can mix explicit notes and chord aliases, such as `G2 + DMajor`. Chord aliases expand to their current third-octave chord preview shape.
- Practice Step parsing is case-insensitive. Flats, rests, rhythm, measures, lyrics, and durations are deferred.
- While playing a Practice Song, a Practice Step is matched by exact active note set. Note order and release order do not matter.
- A Practice Step does not advance when expected notes are missing or when extra notes are active.
- Practice Step advancement is triggered by physical MIDI keyboard input only. On-screen input still plays audio and updates the practice surface, but it does not complete Practice Steps.
- When a Practice Song is selected but paused, MIDI and on-screen input behave normally for audio, highlighting, chord display, and staff display. Auto-advance is off until playback is started.
- Selecting a Practice Song resets to the first Practice Step and starts paused.
- Switching between Practice Songs resets to the new song's first Practice Step and starts paused.
- Switching the Practice Song selector back to None clears Practice Preview while leaving the Chord Preview selector visible.
- Selecting a Practice Song with `scale` sets the Scale selector to that scale so the passive scale tint matches the song.
- A Practice Song's `scale` is an initial hint, not a lock. The learner can manually change Scale while practicing, and selecting another Practice Song applies that song's scale hint again.
- A Practice Song with an invalid optional `scale` is invalid. It remains visible as a disabled selector option with a red marker and tooltip error.
- When playback reaches the final Practice Step and the learner matches it, the Practice Song loops back to the first Practice Step and stays playing.
- Restart returns to the first Practice Step without changing playback state: playing stays playing, paused stays paused.
- Invalid Practice Song files remain visible in the Practice Song selector as disabled options. Disabled song options are visually dimmed, show a small red marker, and expose the parse or validation error in a hover tooltip.
- The top bar always shows the Practice Song selector. When a valid Practice Song is selected, compact back, play/pause, next, restart, and edit controls appear in the temporary second row.
- Practice Song back and next controls use adjacent-step icons, not jump-to-start or jump-to-end icons.
- ArrowLeft and ArrowRight navigate previous and next Practice Steps when a valid Practice Song is selected.
- Practice Song controls are hidden when Practice Song is None or when a song file is invalid and disabled.
- Practice Song examples should include simple technique drills plus playable song imports or sketches.
- A Practice Song Builder is a step-by-step authoring mode for creating or editing Practice Song JSON by hand from notation-reading practice.
- A Practice Song Draft is an in-progress Practice Song being authored in the Practice Song Builder.
- Practice Song Builder captures note sets only. It does not record audio, timing, rhythm, measures, durations, or a performance history.
- Practice Song Builder is entered from a compact edit-style icon near the Practice Song controls.
- While Practice Song Builder is inactive, the control uses edit/create wording. While it is active, the control uses save wording.
- Practice Song Builder should not use record wording or a record-dot icon because it is not audio or timed performance capture.
- A new Practice Song Draft can be started from the `New Song` option in the Practice Song selector.
- Typing a new song title creates a pending new-song selection but does not create a draft file by itself.
- Pressing Enter in the new song title field or pressing the edit/create control starts Practice Song Builder for the pending new-song title.
- A pending new-song selection shows the create/edit control but does not show practice playback, step navigation, or restart controls.
- Selecting an existing Practice Song and entering Practice Song Builder loads that song as an editable draft.
- Editing an existing Practice Song starts Practice Song Builder on the currently selected Practice Step.
- Creating a new Practice Song starts Practice Song Builder on the first draft step.
- Entering Practice Song Builder pauses Practice Song playback.
- While Practice Song Builder is active, the back and next controls navigate draft steps for editing instead of practice playback.
- ArrowLeft and ArrowRight navigate previous and next draft steps while Practice Song Builder is active.
- In Practice Song Builder, next moves to the next existing draft step, or appends and selects a new empty draft step when already on the last step.
- In Practice Song Builder, back never moves before the first draft step.
- Practice Song Builder v0 has no dedicated delete-step control. Clearing all notes makes a draft step empty, and save validation handles empty steps.
- Practice Step keyboard shortcuts do not run while focus is inside text inputs, textareas, or dropdown/listbox controls.
- While Practice Song Builder is active, practice play/pause is hidden because played notes edit the draft step instead of completing Practice Steps.
- While Practice Song Builder is active, a compact cancel control exits builder mode and discards unsaved draft changes.
- Canceling Practice Song Builder exits immediately when the draft is unchanged, but asks for confirmation before discarding unsaved draft changes.
- While Practice Song Builder is active, the current draft step is shown through the same ghosted Practice Preview surfaces used by normal Practice Song mode.
- Live input remains visually dominant over the draft-step preview while authoring.
- MIDI input, piano-row input, scale-circle input, and grand-staff input can all edit the current draft step.
- Playing or clicking a note that is already in the current draft step toggles that note back off.
- Practice Song Builder saves each draft step as a low-to-high pitch set. Entry order does not change the saved step order.
- Practice Song Builder allows the current draft step to be empty while editing.
- Saving a Practice Song Draft removes trailing empty steps, blocks empty steps in the middle, and blocks saving when every step is empty.
- Saving a Practice Song Draft requires a non-empty trimmed title.
- Saving a new Practice Song Draft is blocked if the generated title slug is empty.
- Practice Song Builder saves the current Scale selector value as the Practice Song's optional `scale` hint. If Scale is None, no `scale` field is saved.
- Editing an existing Practice Song replaces that song's saved `scale` hint with the current Scale selector value on save.
- New Practice Song Drafts save to `songs/<title-slug>.json`, where the slug is generated from the entered title.
- Saving a new Practice Song Draft is blocked if the generated song filename already exists.
- Editing an existing Practice Song can change the saved JSON `title`, but keeps the existing song filename.
- Exiting Practice Song Builder after edits saves the Practice Song Draft to a local JSON file in the root `songs/` folder.
- Practice Song Builder saves song files through an Electron main-process bridge. The renderer does not write to the filesystem directly.
- After saving a Practice Song Draft, the in-app Practice Song list refreshes from disk so new and edited songs are available without restarting the app.
- Saving a Practice Song Draft exits Practice Song Builder, selects the saved song, and returns to normal paused Practice Song mode.
- Practice Song Builder save errors are shown in the middle-center panel near the builder title and step count. Save validation should stay non-modal except for discard confirmation.
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
An ordered set of simple practice targets loaded from a local song file.
_Avoid_: song lesson, exercise

**Practice Step**:
One expected note, chord, or note set inside a Practice Song.
_Avoid_: line, measure, bar

**Practice Song Builder**:
A step-by-step authoring mode for creating or editing Practice Song JSON from learner-entered note targets.
_Avoid_: recording, audio recording, performance capture

**Practice Song Draft**:
An in-progress Practice Song being authored before it is saved as a local song file.
_Avoid_: recording, take, performance

## v0 layout

- Top bar: compact MIDI connection status and audio level cluster on the left; Scale, Chord Preview, and Song selectors in the top row; temporary practice/builder action controls in a second row when needed.
- Middle left: selected scale/circle-style pitch map.
- Middle center: live notes/chord being played.
- Middle right: traditional grand staff with treble and bass clefs.
- Bottom: 37-key keyboard showing note labels, colors, scale membership, and pressed state.

## Current boundary

- There is no history or timeline in the v0 practice surface. The app represents what is being played now.

## Flagged ambiguities

- "Key" was used for both **Piano Key** and **Scale**. Resolved: use **Piano Key** for physical/on-screen keys, and **Scale** for C major/minor style structure.
