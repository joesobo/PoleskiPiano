# PoleskiPiano Context

PoleskiPiano is a lightweight native desktop piano-learning app for a small 37-key MIDI keyboard.

## Product direction

- Start with one polished practice surface, not a multi-page app.
- Default keyboard range is C2 through C5.
- Colors are stable absolute pitch-class colors. A note keeps the same color across keys and scales.
- Selected key/scale affects highlighting, not the pitch-class color mapping.
- Audio should feel like a real piano early. v0 uses sampled piano audio through `@tonejs/piano`.
- MIDI starts with renderer Web MIDI for speed and simplicity. Keep the code boundary small enough to replace with a native bridge later.

## v0 layout

- Top bar: MIDI device status, audio level, selected key/mode, dark theme.
- Middle left: selected scale/circle-style pitch map.
- Middle center: live notes/chord being played.
- Middle right: traditional grand staff with treble and bass clefs.
- Bottom: 37-key keyboard showing note labels, colors, scale membership, and pressed state.
