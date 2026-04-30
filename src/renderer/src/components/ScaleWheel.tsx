import { noteCssVars } from "../music/colors";
import { PITCH_CLASSES } from "../music/notes";
import type { SelectedScale } from "../music/scales";
import { getScalePitchClasses, SCALE_MODE_LABELS } from "../music/scales";

interface ScaleWheelProps {
  scale: SelectedScale;
  activePitchClasses: Set<string>;
}

export function ScaleWheel({
  scale,
  activePitchClasses,
}: ScaleWheelProps): React.ReactElement {
  const scalePitchClasses = new Set(getScalePitchClasses(scale));

  return (
    <section className="scale-panel practice-panel">
      <div className="panel-kicker">Scale</div>
      <div className="scale-title">
        {scale.tonic} {SCALE_MODE_LABELS[scale.mode]}
      </div>
      <div className="scale-wheel" aria-label="Selected scale">
        {PITCH_CLASSES.map((pitchClass, index) => {
          const isInScale = scalePitchClasses.has(pitchClass);
          const isActive = activePitchClasses.has(pitchClass);
          const angle = (index / PITCH_CLASSES.length) * Math.PI * 2 - Math.PI / 2;

          return (
            <span
              key={pitchClass}
              className={[
                "scale-note",
                isInScale ? "is-in-scale" : "is-out-scale",
                isActive ? "is-active" : "",
              ].join(" ")}
              style={{
                ...noteCssVars(pitchClass),
                left: `calc(50% + ${Math.cos(angle) * 95}px)`,
                top: `calc(50% + ${Math.sin(angle) * 95}px)`,
              }}
            >
              {pitchClass}
            </span>
          );
        })}
      </div>
    </section>
  );
}
