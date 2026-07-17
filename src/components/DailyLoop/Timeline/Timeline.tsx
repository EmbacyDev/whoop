import { timelineHours } from '../dailyLoopData';
import styles from './Timeline.module.css';

type TimelineProps = {
  /** Continuous hour-wheel index (may be fractional while scrolling). */
  hourIndex: number;
  /** Label shown in the active pill (nearest scheduled stop). */
  activeHour: string;
  /**
   * When true, the horizontal axis may pass over the image. When false
   * (settled), a mask cutout lets the image sit above the line.
   */
  axisCrossing?: boolean;
  /** Prefer direct scroll tracking (short/no transition) vs settle ease. */
  linked?: boolean;
};

/** Degrees between adjacent hour marks on the shared cylindrical wheel. */
export const ITEM_ANGLE = 18;

/**
 * Vertical hour wheel + full-viewport horizontal axis.
 *
 * Resting axis uses a real horizontal mask cutout over the image bounds so
 * the photo sits above the line (Figma). While crossing, an unmasked stroke
 * fades in above the image. The active pill lives outside the wheel mask so
 * it stays fully opaque.
 */
export function Timeline({ hourIndex, activeHour, axisCrossing = false, linked = false }: TimelineProps) {
  const nearestIndex = Math.max(0, Math.min(timelineHours.length - 1, Math.round(hourIndex)));
  const wheelRotation = hourIndex * ITEM_ANGLE;

  return (
    <>
      {/* Behind / cut out under the photo at rest. */}
      <div className={styles.axisUnder} aria-hidden="true" data-crossing={axisCrossing} />

      <div
        className={styles.foreground}
        aria-hidden="true"
        data-crossing={axisCrossing}
        data-linked={linked}
      >
        {/* Full stroke above the photo — only while transitioning. */}
        <div className={styles.axisOver} />

        <div className={styles.marker}>
          <span className={styles.tick} />
          <span className={styles.dot} />
        </div>

        <div className={styles.wheelViewport}>
          <div
            className={styles.wheel}
            style={{
              transform: `translate(-50%, -50%) translateZ(calc(-1 * var(--wheel-radius))) rotateX(${wheelRotation}deg)`,
            }}
          >
            {timelineHours.map((hour, index) => {
              const distance = Math.abs(index - hourIndex);
              return (
                <span
                  key={hour}
                  className={styles.hourLabel}
                  data-active={index === nearestIndex}
                  style={{
                    transform: `rotateX(${-index * ITEM_ANGLE}deg) translateZ(var(--wheel-radius))`,
                    opacity: Math.max(0, 1 - distance * 0.22),
                  }}
                >
                  {hour}
                </span>
              );
            })}
          </div>
        </div>

        {/* Outside the masked wheel viewport — solid fill, never faded. */}
        <span className={styles.activePill}>{activeHour}</span>
      </div>
    </>
  );
}
