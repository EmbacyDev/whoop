import { forwardRef, useImperativeHandle, useRef } from 'react';
import { WhoopLogo } from '../../ui/WhoopLogo/WhoopLogo';
import {
  PHONE_UI_METRICS,
  PHONE_UI_SHARPNESS,
  type PhoneHomeUiElements,
} from './phoneHomeUiMotion';
import styles from './PhoneHomeUI.module.css';

const RING_VIEW = 100;
/**
 * Ring band weight in viewBox units.
 * Figma annulus path is ~8% of diameter (35.5/444); bumped to 10 so the
 * stroked SVG reads as bold as the filled Figma rings in screenshots.
 */
const STROKE = 10;
const RADIUS = (RING_VIEW - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Calendar viz — concentric tracks sized to match Figma screen 3 (1330:856). */
const CAL_VIEW = 100;
const CAL_OUTER_R = 42;
const CAL_MID_R = 30;
const CAL_INNER_R = 18;
const CAL_OUTER_STROKE = 10;
const CAL_MID_STROKE = 7;
const CAL_INNER_STROKE = 5;
const CAL_GREEN_CIRC = 2 * Math.PI * CAL_OUTER_R;
/** ~38% of outer ring — left-side work-window segment from Figma. */
const CAL_GREEN_PCT = 38;

export type PhoneHomeUIHandle = {
  getElements: () => PhoneHomeUiElements | null;
};

type MetricDef = (typeof PHONE_UI_METRICS)[number];

function RingGradients({ metric }: { metric: MetricDef }) {
  if (metric.id === 'recovery') {
    return (
      <defs>
        <linearGradient id="phoneUiRecoveryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff2d1a" />
          <stop offset="100%" stopColor="#f96d28" />
        </linearGradient>
      </defs>
    );
  }
  if (metric.id === 'strain') {
    return (
      <defs>
        <linearGradient id="phoneUiStrainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffb92e" />
          <stop offset="100%" stopColor="#f98c28" />
        </linearGradient>
      </defs>
    );
  }
  return null;
}

/**
 * In-phone home UI (Figma 1301:4 → 1323:4 → 1330:856):
 * TODAY + WHOOP + Sleep/Recovery/Strain → Sharpness → calendar card.
 */
export const PhoneHomeUI = forwardRef<PhoneHomeUIHandle>(function PhoneHomeUI(_, ref) {
  const rootRef = useRef<HTMLDivElement>(null);
  const metricRefs = useRef<(HTMLDivElement | null)[]>([]);
  const valueRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const progressRefs = useRef<(SVGCircleElement | null)[]>([]);
  const sharpnessRootRef = useRef<HTMLDivElement>(null);
  const sharpnessValueRef = useRef<HTMLSpanElement>(null);
  const sharpnessValueWrapRef = useRef<HTMLDivElement>(null);
  const sharpnessLabelRef = useRef<HTMLParagraphElement>(null);
  const sharpnessProgressRef = useRef<SVGCircleElement>(null);
  const sharpnessTrackRef = useRef<SVGCircleElement>(null);
  const sharpnessRingWrapRef = useRef<HTMLDivElement>(null);
  const calendarRootRef = useRef<HTMLDivElement>(null);
  const calLayerRefs = useRef<(SVGCircleElement | null)[]>([]);
  const calGreenRef = useRef<SVGCircleElement>(null);
  const recommendRootRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    getElements: () => {
      const root = rootRef.current;
      const sharpnessRoot = sharpnessRootRef.current;
      const sharpnessValue = sharpnessValueRef.current;
      const sharpnessValueWrap = sharpnessValueWrapRef.current;
      const sharpnessLabel = sharpnessLabelRef.current;
      const sharpnessProgress = sharpnessProgressRef.current;
      const sharpnessTrack = sharpnessTrackRef.current;
      const sharpnessRingWrap = sharpnessRingWrapRef.current;
      const calendarRoot = calendarRootRef.current;
      const calGreen = calGreenRef.current;
      const recommendRoot = recommendRootRef.current;
      if (
        !root ||
        !sharpnessRoot ||
        !sharpnessValue ||
        !sharpnessValueWrap ||
        !sharpnessLabel ||
        !sharpnessProgress ||
        !sharpnessTrack ||
        !sharpnessRingWrap ||
        !calendarRoot ||
        !calGreen ||
        !recommendRoot
      ) {
        return null;
      }
      const metricRoots: HTMLElement[] = [];
      const valueEls: HTMLElement[] = [];
      const progressEls: SVGCircleElement[] = [];
      for (let i = 0; i < PHONE_UI_METRICS.length; i++) {
        const m = metricRefs.current[i];
        const v = valueRefs.current[i];
        const p = progressRefs.current[i];
        if (!m || !v || !p) return null;
        metricRoots.push(m);
        valueEls.push(v);
        progressEls.push(p);
      }
      const calLayers: SVGCircleElement[] = [];
      for (let i = 0; i < 3; i++) {
        const layer = calLayerRefs.current[i];
        if (!layer) return null;
        calLayers.push(layer);
      }
      return {
        root,
        metricRoots,
        valueEls,
        progressEls,
        circumferences: PHONE_UI_METRICS.map(() => CIRCUMFERENCE),
        sharpnessRoot,
        sharpnessValue,
        sharpnessValueWrap,
        sharpnessLabel,
        sharpnessProgress,
        sharpnessTrack,
        sharpnessRingWrap,
        sharpnessCircumference: CIRCUMFERENCE,
        calendarRoot,
        calLayers,
        calGreen,
        calGreenCircumference: CAL_GREEN_CIRC,
        calGreenPct: CAL_GREEN_PCT,
        recommendRoot,
      };
    },
  }));

  return (
    <div
      className={styles.root}
      ref={rootRef}
      aria-hidden="true"
      data-phone-home-ui="true"
    >
      <div className={styles.backdrop} />

      <div className={styles.header}>
        <div className={styles.today}>Today</div>
        <WhoopLogo className={styles.logo} decorative />
      </div>

      <div className={styles.metrics}>
        {PHONE_UI_METRICS.map((metric, i) => (
          <div
            key={metric.id}
            className={styles.metric}
            ref={(el) => {
              metricRefs.current[i] = el;
            }}
            data-metric={metric.id}
          >
            <div className={styles.ringWrap}>
              <svg
                className={styles.ringSvg}
                viewBox={`0 0 ${RING_VIEW} ${RING_VIEW}`}
                role="presentation"
              >
                <RingGradients metric={metric} />
                <circle
                  className={styles.track}
                  cx={RING_VIEW / 2}
                  cy={RING_VIEW / 2}
                  r={RADIUS}
                  strokeWidth={STROKE}
                />
                <circle
                  className={styles.progress}
                  ref={(el) => {
                    progressRefs.current[i] = el;
                  }}
                  cx={RING_VIEW / 2}
                  cy={RING_VIEW / 2}
                  r={RADIUS}
                  strokeWidth={STROKE}
                  stroke={metric.color}
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={CIRCUMFERENCE * (1 - metric.from / 100)}
                />
              </svg>
              <div className={styles.value}>
                <span
                  className={styles.valueNumber}
                  ref={(el) => {
                    valueRefs.current[i] = el;
                  }}
                >
                  {metric.from}
                </span>
                <span className={styles.valuePercent}>%</span>
              </div>
            </div>
            <p className={styles.label}>{metric.label}</p>
          </div>
        ))}
      </div>

      {/* Figma 1330:1129 — calendar card (fades behind morphing Sharpness arc). */}
      <div className={styles.calendarAnchor}>
        <div className={styles.calendarCard} ref={calendarRootRef} data-phone-ui="calendar">
          <div className={styles.calHeader}>
            <div className={styles.workBadge}>
              <span className={styles.workLabel}>work</span>
              <span className={styles.workCount}>1/2</span>
            </div>
            <p className={styles.calTime}>12PM—2PM</p>
            <p className={styles.calLeft}>1h left</p>
          </div>
          <div className={styles.calViz}>
            <svg
              className={styles.calSvg}
              viewBox={`0 0 ${CAL_VIEW} ${CAL_VIEW}`}
              role="presentation"
            >
              <defs>
                <linearGradient id="phoneUiCalGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a6e048" />
                  <stop offset="100%" stopColor="#8fe048" />
                </linearGradient>
              </defs>
              {/* Back → front concentric tracks (Figma layers 1 / 2 / 3). */}
              <circle
                className={styles.calTrackOuter}
                ref={(el) => {
                  calLayerRefs.current[0] = el;
                }}
                cx={CAL_VIEW / 2}
                cy={CAL_VIEW / 2}
                r={CAL_OUTER_R}
                strokeWidth={CAL_OUTER_STROKE}
              />
              <circle
                className={styles.calTrackMid}
                ref={(el) => {
                  calLayerRefs.current[1] = el;
                }}
                cx={CAL_VIEW / 2}
                cy={CAL_VIEW / 2}
                r={CAL_MID_R}
                strokeWidth={CAL_MID_STROKE}
              />
              <circle
                className={styles.calTrackInner}
                ref={(el) => {
                  calLayerRefs.current[2] = el;
                }}
                cx={CAL_VIEW / 2}
                cy={CAL_VIEW / 2}
                r={CAL_INNER_R}
                strokeWidth={CAL_INNER_STROKE}
              />
              <circle
                className={styles.calGreen}
                ref={calGreenRef}
                cx={CAL_VIEW / 2}
                cy={CAL_VIEW / 2}
                r={CAL_OUTER_R}
                strokeWidth={CAL_OUTER_STROKE}
                stroke="url(#phoneUiCalGreenGrad)"
                strokeDasharray={CAL_GREEN_CIRC}
                strokeDashoffset={CAL_GREEN_CIRC}
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Figma 1324:10205 — anchor at resting upper slot; GSAP owns opacity/scale/y. */}
      <div className={styles.sharpnessAnchor}>
        <div
          className={styles.sharpness}
          ref={sharpnessRootRef}
          data-metric="sharpness"
        >
          <div className={styles.ringWrap} ref={sharpnessRingWrapRef}>
            <svg
              className={styles.ringSvg}
              viewBox={`0 0 ${RING_VIEW} ${RING_VIEW}`}
              role="presentation"
            >
              <defs>
                <linearGradient id="phoneUiSharpnessGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f96d28" />
                  <stop offset="45%" stopColor="#ffb92e" />
                  <stop offset="100%" stopColor="#b0f13f" />
                </linearGradient>
              </defs>
              <circle
                className={styles.track}
                ref={sharpnessTrackRef}
                cx={RING_VIEW / 2}
                cy={RING_VIEW / 2}
                r={RADIUS}
                strokeWidth={STROKE}
              />
              <circle
                className={styles.progress}
                ref={sharpnessProgressRef}
                cx={RING_VIEW / 2}
                cy={RING_VIEW / 2}
                r={RADIUS}
                strokeWidth={STROKE}
                stroke={PHONE_UI_SHARPNESS.color}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - PHONE_UI_SHARPNESS.from / 100)}
              />
            </svg>
            <div className={styles.value} ref={sharpnessValueWrapRef}>
              <span className={styles.valueNumber} ref={sharpnessValueRef}>
                {PHONE_UI_SHARPNESS.from}
              </span>
              <span className={styles.valuePercent}>%</span>
            </div>
          </div>
          <p className={styles.label} ref={sharpnessLabelRef}>
            Sharpness
          </p>
        </div>
      </div>

      {/* Figma 1330:1140 — bottom recommendation strip. */}
      <div className={styles.recommendAnchor}>
        <div className={styles.recommend} ref={recommendRootRef} data-phone-ui="recommend">
          <p className={styles.recommendEyebrow}>Next window:</p>
          <p className={styles.recommendBody}>
            Recovery (2PM—2:30PM)
            <br />
            30-minute walk is recommended
          </p>
        </div>
      </div>
    </div>
  );
});
