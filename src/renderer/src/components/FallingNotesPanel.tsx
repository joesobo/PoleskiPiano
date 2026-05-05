import { noteCssVars } from "../music/colors";
import {
  type PitchClass,
  getWhiteKeyCount,
  type PianoKey,
} from "../music/notes";
import type {
  PracticeSong,
  PracticeTarget,
  PracticeTargetChordGroup,
  PracticeTargetNote,
} from "../music/practiceSongs";
import { NoteLabel } from "./NoteLabel";

export interface FallingNoteFeedbackEvent {
  id: string;
  midi: number;
  label: string;
  pitchClass: PitchClass;
}

interface FallingNotesPanelProps {
  song: PracticeSong | null;
  previewTarget: PracticeTarget | null;
  keys: PianoKey[];
  playheadBeat: number;
  leadInBeats: number;
  waitingTargetId: string | null;
  feedbackEvents: FallingNoteFeedbackEvent[];
}

interface FallingNoteLayout {
  left: number;
  width: number;
  top: number;
  height: number;
}

interface VisibleFallingNote {
  key: string;
  note: PracticeTargetNote;
  layout: FallingNoteLayout;
  isWaiting: boolean;
  isPreview: boolean;
}

interface FallingChordToneLabel {
  key: string;
  label: string;
  pitchClass: PitchClass;
  left: number;
}

interface FallingChordBlockLayout extends FallingNoteLayout {
  toneLabels: FallingChordToneLabel[];
}

interface VisibleFallingChordBlock {
  key: string;
  group: PracticeTargetChordGroup;
  layout: FallingChordBlockLayout;
  isPreview: boolean;
}

export function FallingNotesPanel({
  song,
  previewTarget,
  keys,
  playheadBeat,
  leadInBeats,
  waitingTargetId,
  feedbackEvents,
}: FallingNotesPanelProps): React.ReactElement {
  const whiteCount = getWhiteKeyCount(keys);
  const keyMap = new Map(keys.map((key) => [key.midi, key]));
  const waitingTarget = song?.targets.find(
    (target) => target.id === waitingTargetId,
  );
  const songChordMemberKeys = new Set(
    song?.targets.flatMap((target) =>
      target.chordGroups.flatMap((group) =>
        group.midiNotes.map((midi) => getTargetNoteKey(target.startBeat, midi)),
      ),
    ) ?? [],
  );
  const visibleSongNotes =
    song?.notes
      .flatMap((note): VisibleFallingNote[] => {
        if (songChordMemberKeys.has(getTargetNoteKey(note.startBeat, note.midi))) {
          return [];
        }

        const layout = getFallingNoteLayout(
          keyMap.get(note.midi),
          whiteCount,
          note.startBeat,
          note.durationBeats,
          playheadBeat,
          leadInBeats,
        );

        if (!layout) {
          return [];
        }

        return [{
          key: `${note.midi}:${note.startBeat}:${note.durationBeats}:${note.voice ?? ""}`,
          note,
          layout,
          isWaiting:
            waitingTarget?.startBeat === note.startBeat &&
            waitingTarget.midiNotes.includes(note.midi),
          isPreview: false,
        }];
      }) ?? [];
  const previewChordMemberKeys = new Set(
    previewTarget?.chordGroups.flatMap((group) => group.midiNotes) ?? [],
  );
  const visiblePreviewNotes =
    previewTarget?.notes
      .filter((note) => !previewChordMemberKeys.has(note.midi))
      .flatMap((note): VisibleFallingNote[] => {
        const layout = getFallingPreviewNoteLayout(
          keyMap.get(note.midi),
          whiteCount,
        );

        if (!layout) {
          return [];
        }

        return [{
          key: `preview:${note.midi}`,
          note,
          layout,
          isWaiting: false,
          isPreview: true,
        }];
      }) ?? [];
  const visibleNotes = [...visibleSongNotes, ...visiblePreviewNotes];
  const visibleSongChordBlocks =
    song?.targets
      .flatMap((target) =>
        target.chordGroups.map((group, groupIndex) => ({
          key: `${target.id}:chord:${groupIndex}`,
          group,
          layout: getFallingChordBlockLayout(
            group,
            keyMap,
            whiteCount,
            getFallingVerticalLayout(
              target.startBeat,
              target.durationBeats,
              playheadBeat,
              leadInBeats,
            ),
          ),
          isPreview: false,
        })),
      )
      .filter(
        (visibleChordBlock): visibleChordBlock is VisibleFallingChordBlock =>
          visibleChordBlock.layout !== null,
      ) ?? [];
  const visiblePreviewChordBlocks =
    previewTarget?.chordGroups
      .map((group, groupIndex) => ({
        key: `preview:chord:${groupIndex}`,
        group,
        layout: getFallingChordBlockLayout(
          group,
          keyMap,
          whiteCount,
          { top: 18, height: 58 },
        ),
        isPreview: true,
      }))
      .filter(
        (visibleChordBlock): visibleChordBlock is VisibleFallingChordBlock =>
          visibleChordBlock.layout !== null,
      ) ?? [];
  const visibleChordBlocks = [
    ...visibleSongChordBlocks,
    ...visiblePreviewChordBlocks,
  ];

  return (
    <section className="falling-notes-panel practice-panel">
      <div className="falling-notes-stage" aria-label="Falling Notes">
        <div
          className="falling-notes-white-lanes"
          aria-hidden="true"
          style={{
            gridTemplateColumns: `repeat(${whiteCount}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: whiteCount }, (_, index) => (
            <span className="falling-notes-white-lane" key={index} />
          ))}
        </div>
        {visibleChordBlocks.map(({ key, group, layout, isPreview }) => (
          <span
            className={[
              "falling-chord-block",
              isPreview ? "is-preview" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={key}
            style={{
              ...noteCssVars(group.root),
              insetInlineStart: `${layout.left}%`,
              inlineSize: `${layout.width}%`,
              insetBlockStart: `${layout.top}%`,
              blockSize: `${layout.height}%`,
            }}
          >
            <span className="falling-chord-block-name">{group.name}</span>
            <span className="falling-chord-tone-labels" aria-hidden="true">
              {layout.toneLabels.map((toneLabel) => (
                <span
                  className="falling-chord-tone-label"
                  key={toneLabel.key}
                  style={{
                    ...noteCssVars(toneLabel.pitchClass),
                    insetInlineStart: `${toneLabel.left}%`,
                  }}
                >
                  <NoteLabel label={toneLabel.label} />
                </span>
              ))}
            </span>
          </span>
        ))}
        {visibleNotes.map(({ key, note, layout, isWaiting, isPreview }) => (
          <span
            className={[
              "falling-note-block",
              isWaiting ? "is-waiting" : "",
              isPreview ? "is-preview" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={key}
            style={{
              ...noteCssVars(note.pitchClass),
              insetInlineStart: `${layout.left}%`,
              inlineSize: `${layout.width}%`,
              insetBlockStart: `${layout.top}%`,
              blockSize: `${layout.height}%`,
            }}
          >
            <span className="falling-note-label">
              <NoteLabel label={note.label} />
            </span>
          </span>
        ))}
        {feedbackEvents.map((event) => {
          const layout = getFallingKeyLayout(keyMap.get(event.midi), whiteCount);

          if (!layout) {
            return null;
          }

          return (
            <span
              className="falling-note-feedback"
              key={event.id}
              style={{
                ...noteCssVars(event.pitchClass),
                insetInlineStart: `${layout.left}%`,
                inlineSize: `${layout.width}%`,
              }}
            >
              <span className="falling-note-feedback-ring" />
              <span className="falling-note-feedback-label">
                <NoteLabel label={event.label} />
              </span>
            </span>
          );
        })}
        <span className="falling-note-hit-line" aria-hidden="true" />
      </div>
    </section>
  );
}

function getFallingChordBlockLayout(
  group: PracticeTargetChordGroup,
  keyMap: ReadonlyMap<number, PianoKey>,
  whiteCount: number,
  verticalLayout: Pick<FallingNoteLayout, "top" | "height"> | null,
): FallingChordBlockLayout | null {
  if (!verticalLayout) {
    return null;
  }

  const noteLayouts = group.notes
    .map((note) => {
      const layout = getFallingKeyLayout(keyMap.get(note.midi), whiteCount);

      return layout ? { note, layout } : null;
    })
    .filter(
      (
        noteLayout,
      ): noteLayout is {
        note: PracticeTargetNote;
        layout: Pick<FallingNoteLayout, "left" | "width">;
      } => noteLayout !== null,
    );

  if (noteLayouts.length === 0) {
    return null;
  }

  const left = Math.min(...noteLayouts.map(({ layout }) => layout.left));
  const right = Math.max(
    ...noteLayouts.map(({ layout }) => layout.left + layout.width),
  );
  const width = Math.max(right - left, noteLayouts[0].layout.width);

  return {
    left,
    width,
    top: verticalLayout.top,
    height: verticalLayout.height,
    toneLabels: noteLayouts.map(({ note, layout }) => ({
      key: `${note.midi}:${note.label}`,
      label: note.label,
      pitchClass: note.pitchClass,
      left: ((layout.left + layout.width / 2 - left) / width) * 100,
    })),
  };
}

function getFallingNoteLayout(
  key: PianoKey | undefined,
  whiteCount: number,
  startBeat: number,
  durationBeats: number,
  playheadBeat: number,
  leadInBeats: number,
): FallingNoteLayout | null {
  if (!key || whiteCount <= 0 || leadInBeats <= 0) {
    return null;
  }

  const verticalLayout = getFallingVerticalLayout(
    startBeat,
    durationBeats,
    playheadBeat,
    leadInBeats,
  );

  if (!verticalLayout) {
    return null;
  }

  const keyLayout = getFallingKeyLayout(key, whiteCount);

  if (!keyLayout) {
    return null;
  }

  return {
    ...keyLayout,
    ...verticalLayout,
  };
}

function getFallingVerticalLayout(
  startBeat: number,
  durationBeats: number,
  playheadBeat: number,
  leadInBeats: number,
): Pick<FallingNoteLayout, "top" | "height"> | null {
  if (leadInBeats <= 0) {
    return null;
  }

  const bottom = ((playheadBeat + leadInBeats - startBeat) / leadInBeats) * 100;
  const height = Math.max(4, (durationBeats / leadInBeats) * 100);
  const top = bottom - height;

  if (bottom < -8 || top > 108) {
    return null;
  }

  return { top, height };
}

function getFallingPreviewNoteLayout(
  key: PianoKey | undefined,
  whiteCount: number,
): FallingNoteLayout | null {
  const keyLayout = getFallingKeyLayout(key, whiteCount);

  if (!keyLayout) {
    return null;
  }

  return {
    ...keyLayout,
    top: 18,
    height: 58,
  };
}

function getTargetNoteKey(startBeat: number, midi: number): string {
  return `${startBeat.toFixed(4)}:${midi}`;
}

function getFallingKeyLayout(
  key: PianoKey | undefined,
  whiteCount: number,
): Pick<FallingNoteLayout, "left" | "width"> | null {
  if (!key || whiteCount <= 0) {
    return null;
  }

  const whiteKeyWidth = 100 / whiteCount;

  if (!key.isBlack) {
    return {
      left: (key.whiteIndex ?? 0) * whiteKeyWidth,
      width: whiteKeyWidth,
    };
  }

  const width = whiteKeyWidth * 0.66;
  const center = ((key.blackCenter ?? 0) / whiteCount) * 100;

  return {
    left: center - width / 2,
    width,
  };
}
