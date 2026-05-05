import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { NoteLabel } from "./NoteLabel";

describe("NoteLabel", () => {
  it("renders octaves inline instead of superscript", () => {
    const html = renderToStaticMarkup(createElement(NoteLabel, { label: "C3" }));

    expect(html).toContain("C3");
    expect(html).not.toContain("<sup>");
  });

  it("stacks flat aliases on a separate line for sharp note labels", () => {
    const html = renderToStaticMarkup(
      createElement(NoteLabel, { label: "A#2" }),
    );

    expect(html).toContain("A#");
    expect(html).toContain("B♭");
    expect(html).toContain("note-label-line");
    expect(html).not.toContain("note-label-separator");
    expect(html).not.toContain("<sup>");
  });
});
