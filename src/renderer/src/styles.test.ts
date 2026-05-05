import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const styles = readFileSync(join(__dirname, "styles.css"), "utf8");

describe("piano key layering", () => {
  it("keeps active white keys below black keys", () => {
    expect(styles).toMatch(/\.white-keys\s*\{[^}]*z-index:\s*1/s);
    expect(styles).toMatch(/\.black-keys\s*\{[^}]*z-index:\s*2/s);
    expect(styles).not.toMatch(/\.piano-key\.is-active\s*\{[^}]*z-index/s);
  });

  it("shows chord preview targets as markers instead of full-key overlays", () => {
    expect(styles).toMatch(/\.key-preview-marker\s*\{/);
    expect(styles).not.toMatch(
      /\.piano-key\.is-previewed:not\(\.is-active\)::after\s*\{/,
    );
  });
});

describe("on-screen input styles", () => {
  it("keeps playable surfaces pointer-friendly and exposes staff hover feedback", () => {
    expect(styles).toMatch(/\.piano-panel\s*\{[^}]*touch-action:\s*none/s);
    expect(styles).toMatch(/\.scale-wheel\s*\{[^}]*touch-action:\s*none/s);
    expect(styles).toMatch(/\.staff-panel svg\s*\{[^}]*touch-action:\s*none/s);
    expect(styles).toMatch(/\.staff-panel svg\s*\{[^}]*cursor:\s*pointer/s);
    expect(styles).toMatch(/\.staff-note-group-hover\s*\{/);
    expect(styles).toMatch(/\.piano-key-black\s*\{[^}]*pointer-events:\s*auto/s);
  });
});

describe("app theme styles", () => {
  it("defines light theme overrides without a renderer top-bar theme toggle", () => {
    expect(styles).toMatch(/\.app-shell\[data-theme="light"\]\s*\{/);
    expect(styles).not.toMatch(/\.theme-toggle/);
  });
});

describe("chord preview option styles", () => {
  it("uses app-rendered dropdown names so scale and chord options can be colored", () => {
    expect(styles).toMatch(/\.top-select-menu\s*\{/);
    expect(styles).toMatch(/\.scale-option-name,\s*\n\.chord-preview-option-name\s*\{/);
    expect(styles).toMatch(/\.chord-preview-option-name\s*\{/);
    expect(styles).toMatch(/color:\s*var\(--note-color,\s*var\(--control-fg\)\)/);
    expect(styles).toMatch(/\.is-in-scale-option\s*\{[^}]*font-weight:\s*800/s);
    expect(styles).toMatch(
      /\.is-out-scale-option\s*\{[^}]*opacity:\s*0\.38/s,
    );
  });
});

describe("practice song styles", () => {
  it("styles disabled invalid songs and compact practice controls", () => {
    expect(styles).toMatch(/\.practice-song-select\s*\{/);
    expect(styles).toMatch(/\.is-invalid-song-option\s*\{[^}]*opacity:\s*0\.44/s);
    expect(styles).toMatch(/\.song-invalid-marker\s*\{[^}]*background:\s*var\(--red\)/s);
    expect(styles).toMatch(/\.practice-song-controls\s*\{/);
    expect(styles).toMatch(/\.practice-mode-control,\s*\n\.practice-speed-control\s*\{/);
    expect(styles).toMatch(/\.practice-tempo-readout\s*\{/);
    expect(styles).not.toMatch(/\.practice-tempo-readout,\s*\n\.practice-score-readout/s);
    expect(styles).toMatch(/\.practice-preview-title-row\s*\{/);
    expect(styles).toMatch(/\.practice-preview-count\s*\{/);
    expect(styles).toMatch(/\.practice-preview-target-name\s*\{/);
    expect(styles).toMatch(/\.note-label\s*\{/);
    expect(styles).toMatch(/\.note-label-line\s*\{/);
    expect(styles).not.toMatch(/\.note-label sup\s*\{/);
    expect(styles).toMatch(/\.note-pill-preview\.is-chord-tone\s*\{/);
    expect(styles).toMatch(/\.signal-status\s*\{/);
  });

  it("keeps the song title input usable and puts action controls in a temporary second row", () => {
    expect(styles).toMatch(/\.app-shell\s*\{[^}]*grid-template-rows:\s*auto minmax\(0,\s*1fr\) 212px/s);
    expect(styles).toMatch(/\.top-bar-content\s*\{[^}]*grid-template-rows:\s*auto auto/s);
    expect(styles).toMatch(/\.top-select-row\s*\{/);
    expect(styles).toMatch(/\.practice-song-select\s*\{[^}]*inline-size:\s*220px/s);
    expect(styles).toMatch(/\.practice-song-menu\s*\{[^}]*inline-size:\s*260px/s);
    expect(styles).toMatch(/\.practice-song-control\s*\{[^}]*margin-inline-start:\s*auto/s);
    expect(styles).toMatch(/\.top-action-row\s*\{/);
    expect(styles).toMatch(/\.new-song-composer,\s*\n\.practice-song-builder-row\s*\{/);
    expect(styles).toMatch(/\.practice-song-title-field\s*\{/);
    expect(styles).toMatch(
      /\.top-bar button,\s*\n\.top-bar select,\s*\n\.top-bar input\s*\{[^}]*-webkit-app-region:\s*no-drag/s,
    );
  });
});

describe("panel manager styles", () => {
  it("adds stable frames, a full-width falling notes panel, and a panel context menu", () => {
    expect(styles).toMatch(/\.panel-frame\s*\{/);
    expect(styles).toMatch(/\.falling-notes-panel\s*\{/);
    expect(styles).toMatch(/\.falling-notes-panel\s*\{[^}]*padding:\s*0/s);
    expect(styles).toMatch(/\.falling-notes-stage\s*\{/);
    expect(styles).toMatch(/\.falling-notes-white-lanes\s*\{/);
    expect(styles).toMatch(/\.falling-note-hit-line\s*\{/);
    expect(styles).toMatch(/\.falling-note-block\.is-preview,\s*\n\.falling-chord-block\.is-preview\s*\{/);
    expect(styles).toMatch(/\.falling-chord-block\s*\{/);
    expect(styles).toMatch(/\.falling-chord-block-name\s*\{/);
    expect(styles).toMatch(/\.falling-chord-tone-label\s*\{/);
    expect(styles).toMatch(/\.falling-note-feedback\s*\{/);
    expect(styles).not.toMatch(/\.falling-notes-title\s*\{/);
    expect(styles).toMatch(/@keyframes falling-note-correct\s*\{/);
    expect(styles).toMatch(/\.panel-context-menu\s*\{/);
    expect(styles).toMatch(/\.panel-context-option\s*\{/);
  });
});
