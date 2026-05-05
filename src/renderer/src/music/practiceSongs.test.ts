import { describe, expect, it } from "vitest";
import {
  activeMidiNotesMatchPracticeTarget,
  createPracticeSongMusicXml,
  createPracticeSongOptions,
  normalizePracticeSongPath,
  parseOptionalPracticeScale,
  parsePracticeSong,
} from "./practiceSongs";

const BASIC_MUSICXML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <work><work-title>Scale Study</work-title></work>
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>4</divisions>
        <key><fifths>2</fifths><mode>major</mode></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <staves>2</staves>
        <clef number="1"><sign>G</sign><line>2</line></clef>
        <clef number="2"><sign>F</sign><line>4</line></clef>
      </attributes>
      <direction><sound tempo="84"/></direction>
      <note>
        <pitch><step>C</step><octave>3</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
        <staff>2</staff>
      </note>
      <note>
        <pitch><step>E</step><octave>3</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
        <staff>2</staff>
      </note>
    </measure>
  </part>
</score-partwise>`;

describe("Practice Song MusicXML parsing", () => {
  it("normalizes song paths to root .musicxml files", () => {
    expect(normalizePracticeSongPath("../../../../songs/my-song.musicxml")).toBe(
      "songs/my-song.musicxml",
    );
    expect(normalizePracticeSongPath("songs/my-song.musicxml")).toBe(
      "songs/my-song.musicxml",
    );
  });

  it("parses title, scale, tempo, measures, notes, and timed targets", () => {
    const song = parsePracticeSong(
      BASIC_MUSICXML,
      "songs/scale-study.musicxml",
      "Scale Study",
    );

    expect(song.title).toBe("Scale Study");
    expect(song.scale).toEqual({ tonic: "D", mode: "major" });
    expect(song.tempoBpm).toBe(84);
    expect(song.timeSignature).toBe("4/4");
    expect(song.measures).toEqual([
      { number: "1", startBeat: 0, durationBeats: 4 },
    ]);
    expect(song.notes.map((note) => note.label)).toEqual(["C3", "E3"]);
    expect(song.targets.map((target) => target.midiNotes)).toEqual([[48], [52]]);
    expect(song.targets.map((target) => target.startBeat)).toEqual([0, 1]);
  });

  it("uses chord, backup, and ties to build one timed target timeline", () => {
    const song = parsePracticeSong(
      `<?xml version="1.0" encoding="UTF-8"?>
      <score-partwise version="4.0">
        <part-list>
          <score-part id="P1"><part-name>Two Staff Study</part-name></score-part>
        </part-list>
        <part id="P1">
          <measure number="1">
            <attributes>
              <divisions>4</divisions>
              <time><beats>4</beats><beat-type>4</beat-type></time>
              <staves>2</staves>
            </attributes>
            <note>
              <pitch><step>C</step><octave>4</octave></pitch>
              <duration>8</duration>
              <type>half</type>
              <tie type="start"/>
              <staff>1</staff>
            </note>
            <note>
              <chord/>
              <pitch><step>E</step><octave>4</octave></pitch>
              <duration>8</duration>
              <type>half</type>
              <staff>1</staff>
            </note>
            <backup><duration>8</duration></backup>
            <note>
              <pitch><step>C</step><octave>3</octave></pitch>
              <duration>4</duration>
              <type>quarter</type>
              <staff>2</staff>
            </note>
            <note>
              <pitch><step>D</step><octave>3</octave></pitch>
              <duration>4</duration>
              <type>quarter</type>
              <staff>2</staff>
            </note>
          </measure>
          <measure number="2">
            <attributes>
              <divisions>4</divisions>
              <time><beats>4</beats><beat-type>4</beat-type></time>
            </attributes>
            <note>
              <pitch><step>C</step><octave>4</octave></pitch>
              <duration>8</duration>
              <type>half</type>
              <tie type="stop"/>
              <staff>1</staff>
            </note>
          </measure>
        </part>
      </score-partwise>`,
      "songs/two-staff-study.musicxml",
      "Two Staff Study",
    );

    expect(song.notes.find((note) => note.label === "C4")?.durationBeats).toBe(
      6,
    );
    expect(song.targets.map((target) => target.midiNotes)).toEqual([
      [48, 60, 64],
      [50],
    ]);
  });

  it("marks chord tones inside larger simultaneous targets without swallowing extra notes", () => {
    const song = parsePracticeSong(
      createPracticeSongMusicXml({
        title: "Chord With Neighbor Note",
        scale: null,
        targets: [
          {
            notes: [{ midi: 48 }, { midi: 50 }, { midi: 52 }, { midi: 55 }],
          },
        ],
      }),
      "songs/chord-with-neighbor-note.musicxml",
      "Chord With Neighbor Note",
    );
    const target = song.targets[0];

    expect(target.label).toBe("C3 + D3 + E3 + G3");
    expect(target.chordName).toBe("Cmaj");
    expect(target.chordGroups).toHaveLength(1);
    expect(target.chordGroups[0]).toMatchObject({
      name: "Cmaj",
      root: "C",
    });
    expect(target.chordGroups[0].notes.map((note) => note.label)).toEqual([
      "C3",
      "E3",
      "G3",
    ]);
  });

  it("keeps duplicate chord tones in the named chord group", () => {
    const song = parsePracticeSong(
      createPracticeSongMusicXml({
        title: "Chord With Doubled Root",
        scale: null,
        targets: [
          {
            notes: [{ midi: 45 }, { midi: 48 }, { midi: 52 }, { midi: 60 }],
          },
        ],
      }),
      "songs/chord-with-doubled-root.musicxml",
      "Chord With Doubled Root",
    );
    const target = song.targets[0];

    expect(target.chordName).toBe("Am");
    expect(target.chordGroups[0].notes.map((note) => note.label)).toEqual([
      "A2",
      "C3",
      "E3",
      "C4",
    ]);
  });

  it("builds disabled selector options for invalid MusicXML files", () => {
    const options = createPracticeSongOptions({
      "songs/bad-range.musicxml": BASIC_MUSICXML.replace(
        "<octave>3</octave>",
        "<octave>6</octave>",
      ),
      "songs/bad-xml.musicxml": "<",
      "songs/valid.musicxml": BASIC_MUSICXML,
    });

    expect(options).toHaveLength(3);
    expect(
      options.find((option) => option.path === "songs/valid.musicxml")?.status,
    ).toBe("valid");

    const badRange = options.find(
      (option) => option.path === "songs/bad-range.musicxml",
    );
    expect(badRange?.status).toBe("invalid");
    expect(badRange?.status === "invalid" ? badRange.error : "").toContain(
      "outside the C2-C5 range",
    );

    const badXml = options.find((option) => option.title === "Bad Xml");
    expect(badXml?.status).toBe("invalid");
  });
});

describe("Practice target matching", () => {
  it("matches exact active MIDI note sets without caring about order", () => {
    const step = parsePracticeSong(
      createPracticeSongMusicXml({
        title: "Chord",
        scale: null,
        targets: [{ notes: [{ midi: 43 }, { midi: 50 }, { midi: 54 }, { midi: 57 }] }],
      }),
      "songs/chord.musicxml",
      "Chord",
    ).targets[0];

    expect(activeMidiNotesMatchPracticeTarget([57, 54, 50, 43], step)).toBe(
      true,
    );
    expect(activeMidiNotesMatchPracticeTarget([43, 50, 54], step)).toBe(false);
    expect(activeMidiNotesMatchPracticeTarget([43, 50, 54, 57, 60], step)).toBe(
      false,
    );
  });
});

describe("Practice Song MusicXML creation", () => {
  it("serializes draft targets as parseable beginner MusicXML", () => {
    expect(parseOptionalPracticeScale("D major")).toEqual({
      tonic: "D",
      mode: "major",
    });

    const rawMusicXml = createPracticeSongMusicXml({
      title: "Draft Song",
      scale: { tonic: "D", mode: "major" },
      targets: [
        { notes: [{ midi: 48 }] },
        { notes: [{ midi: 50 }, { midi: 54 }] },
      ],
    });
    const song = parsePracticeSong(
      rawMusicXml,
      "songs/draft-song.musicxml",
      "Draft Song",
    );

    expect(song.title).toBe("Draft Song");
    expect(song.scale).toEqual({ tonic: "D", mode: "major" });
    expect(song.targets.map((target) => target.label)).toEqual([
      "C3",
      "D3 + F#3",
    ]);
  });
});
