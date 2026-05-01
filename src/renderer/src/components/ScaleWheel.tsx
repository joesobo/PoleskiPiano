import { useEffect, useRef } from "react";
import { noteCssVars } from "../music/colors";
import { PITCH_CLASSES, type PitchClass } from "../music/notes";
import type { SelectedScale } from "../music/scales";
import { getScalePitchClasses, SCALE_MODE_LABELS } from "../music/scales";

interface ScaleWheelProps {
  scale: SelectedScale | null;
  activePitchClasses: Set<string>;
  onPitchClassInputStart?: (pitchClass: PitchClass) => void;
  onInputStop?: () => void;
  inputResetKey?: number;
}

export function ScaleWheel({
  scale,
  activePitchClasses,
  onPitchClassInputStart,
  onInputStop,
  inputResetKey,
}: ScaleWheelProps): React.ReactElement {
  const activePointerIdRef = useRef<number | null>(null);
  const scalePitchClasses = new Set(scale ? getScalePitchClasses(scale) : []);

  useEffect(() => {
    activePointerIdRef.current = null;
  }, [inputResetKey]);

  const handlePointerDown = (
    event: React.PointerEvent<HTMLElement>,
  ): void => {
    const pitchClass = getPitchClassFromPointerEvent(event);

    if (!pitchClass || activePointerIdRef.current !== null) {
      return;
    }

    event.preventDefault();
    activePointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    onPitchClassInputStart?.(pitchClass);
  };

  const handlePointerMove = (
    event: React.PointerEvent<HTMLElement>,
  ): void => {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }

    const pitchClass = getPitchClassFromPointerEvent(event);

    if (pitchClass) {
      onPitchClassInputStart?.(pitchClass);
    }
  };

  const stopPointerInput = (event: React.PointerEvent<HTMLElement>): void => {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }

    activePointerIdRef.current = null;
    onInputStop?.();
  };

  return (
    <section className="scale-panel practice-panel">
      <div className="panel-kicker">Scale</div>
      <div className="scale-title">
        {scale
          ? `${scale.tonic} ${SCALE_MODE_LABELS[scale.mode]}`
          : "No key"}
      </div>
      <div
        className="scale-wheel"
        aria-label="Selected scale"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopPointerInput}
        onPointerCancel={stopPointerInput}
        onLostPointerCapture={stopPointerInput}
      >
        {PITCH_CLASSES.map((pitchClass, index) => {
          const isInScale = !scale || scalePitchClasses.has(pitchClass);
          const isActive = activePitchClasses.has(pitchClass);
          const angle =
            (index / PITCH_CLASSES.length) * Math.PI * 2 - Math.PI / 2;

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
              data-pitch-class={pitchClass}
              role="button"
              aria-label={pitchClass}
            >
              {pitchClass}
            </span>
          );
        })}
      </div>
    </section>
  );
}

function getPitchClassFromPointerEvent(
  event: React.PointerEvent<HTMLElement>,
): PitchClass | null {
  const pitchClass = document
    .elementFromPoint(event.clientX, event.clientY)
    ?.closest<HTMLElement>("[data-pitch-class]")?.dataset.pitchClass;

  return PITCH_CLASSES.includes(pitchClass as PitchClass)
    ? (pitchClass as PitchClass)
    : null;
}
