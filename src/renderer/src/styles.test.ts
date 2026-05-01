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
  it("defines light theme overrides and a top-bar theme toggle", () => {
    expect(styles).toMatch(/\.app-shell\[data-theme="light"\]\s*\{/);
    expect(styles).toMatch(/\.theme-toggle\s*\{/);
    expect(styles).toMatch(/\.theme-toggle\[aria-pressed="true"\]/);
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
