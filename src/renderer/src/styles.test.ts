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
});

describe("app theme styles", () => {
  it("defines light theme overrides and a top-bar theme toggle", () => {
    expect(styles).toMatch(/\.app-shell\[data-theme="light"\]\s*\{/);
    expect(styles).toMatch(/\.theme-toggle\s*\{/);
    expect(styles).toMatch(/\.theme-toggle\[aria-pressed="true"\]/);
  });
});
