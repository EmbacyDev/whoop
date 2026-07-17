import type { CSSProperties, ReactNode } from 'react';
import type { DailyLoopState } from '../dailyLoopData';
import styles from './LoopCard.module.css';

type LoopCardProps = {
  states: DailyLoopState[];
  /** Continuous 0…n-1 scroll progress — drives image cylinder + copy blend. */
  scrollIndex: number;
  linked?: boolean;
  axis?: ReactNode;
};

/**
 * Same angular step language as the timeline wheel (ITEM_ANGLE is per-hour;
 * this is per Daily Loop state — kept restrained for a premium curve).
 */
const STATE_ANGLE = 22;
/** Cylinder radius in px — faces sit on this ring under the shared perspective. */
const CYLINDER_RADIUS = 306;

/**
 * Photo + pill + description. Images share one cylindrical wheel with the
 * timeline: the stage rotates with scrollIndex; each face is fixed on the
 * ring. Active face is front-facing; neighbors curve away. Transforms are
 * continuous (never snapped to `none`).
 */
export function LoopCard({ states, scrollIndex, linked = false, axis }: LoopCardProps) {
  const wheelStyle = {
    transform: `translate(-50%, -50%) translateZ(${-CYLINDER_RADIUS}px) rotateX(${(scrollIndex * STATE_ANGLE).toFixed(3)}deg)`,
  } satisfies CSSProperties;

  return (
    <div className={styles.card} data-linked={linked}>
      <div className={styles.imageStage}>
        {axis}
        <div className={styles.imageClip}>
          <div className={styles.imagePerspective}>
            <div className={styles.imageWheel} style={wheelStyle}>
              {states.map((state, index) => {
                const offset = index - scrollIndex;
                const abs = Math.abs(offset);
                /* Keep mid-transition readable without smearing three footers. */
                const opacity = abs >= 1 ? 0 : Math.pow(1 - abs, 1.6);
                const faceStyle = {
                  opacity,
                  transform: `rotateX(${(-index * STATE_ANGLE).toFixed(3)}deg) translateZ(${CYLINDER_RADIUS}px)`,
                  zIndex: Math.round((1 - Math.min(abs, 1)) * 10),
                } satisfies CSSProperties;

                return (
                  <img
                    key={state.id}
                    className={styles.image}
                    src={state.image}
                    alt={abs < 0.5 ? state.imageAlt : ''}
                    draggable={false}
                    style={faceStyle}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.footerStack}>
        {states.map((state, index) => {
          const abs = Math.abs(index - scrollIndex);
          const opacity = abs >= 1 ? 0 : Math.pow(1 - abs, 1.6);
          return (
            <div
              key={state.id}
              className={styles.footer}
              style={{ opacity }}
              aria-hidden={abs >= 0.5}
            >
              <span className={styles.pill}>{state.pillLabel}</span>
              <p className={styles.description}>{state.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
