import { useEffect, useMemo, useRef, useState } from 'react';
import { Container } from '../ui/Container/Container';
import { SectionHeading } from '../ui/SectionHeading/SectionHeading';
import { useDailyLoopPin } from '../../hooks/useDailyLoopPin';
import { usePreloadImages } from '../../hooks/usePreloadImages';
import { Timeline } from './Timeline/Timeline';
import { LoopCard } from './LoopCard/LoopCard';
import { dailyLoopStates, timelineHours } from './dailyLoopData';
import {
  DAILY_LOOP_FINAL_HOLD_VH,
  DAILY_LOOP_HOLD_FRACTION,
  DAILY_LOOP_SCROLL_PER_STATE_VH,
  DAILY_LOOP_STEP_DURATION_MS,
} from './dailyLoopScrollMap';
import styles from './DailyLoop.module.css';

/** Warm PNG overlays; videos use `preload="auto"` on each face. */
const OVERLAY_URLS = dailyLoopStates.map((state) => state.overlay);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hourIndexForScroll(scrollIndex: number): number {
  const hourStops = dailyLoopStates.map((state) => Math.max(0, timelineHours.indexOf(state.hour)));
  const max = dailyLoopStates.length - 1;
  const i0 = clamp(Math.floor(scrollIndex), 0, max);
  const i1 = clamp(i0 + 1, 0, max);
  const t = clamp(scrollIndex - i0, 0, 1);
  return hourStops[i0] + (hourStops[i1] - hourStops[i0]) * t;
}

/**
 * Figma "Block 3" — "The Daily Loop".
 *
 * Desktop: heading scrolls in normal flow; timeline/image/copy pin under the
 * fixed header. Scroll triggers discrete step cycles (compress → rotate → expand),
 * not continuous scrubbing.
 *
 * Outer section stays layout-stable; heading fades/lifts in when the top
 * sentinel enters the viewport (no ancestor transform that breaks sticky).
 */
export function DailyLoop() {
  const headingRef = useRef<HTMLDivElement>(null);
  const [headingVisible, setHeadingVisible] = useState(false);
  usePreloadImages(OVERLAY_URLS);

  // Same IO pattern as Block 2 "Outsmart your burnout" heading.
  useEffect(() => {
    const el = headingRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setHeadingVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setHeadingVisible(entry.isIntersecting);
      },
      { threshold: 0.35, rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const {
    pinRef,
    displayIndex,
    activeIndex,
    isMoving,
    enabled,
    prismZoom,
    prismRotation,
    prismPhase,
    prismRadiusScale,
    assembleProgress,
    dissolveProgress,
  } = useDailyLoopPin({
    stateCount: dailyLoopStates.length,
    scrollPerStateVh: DAILY_LOOP_SCROLL_PER_STATE_VH,
    holdFraction: DAILY_LOOP_HOLD_FRACTION,
    finalHoldVh: DAILY_LOOP_FINAL_HOLD_VH,
    stepDurationMs: DAILY_LOOP_STEP_DURATION_MS,
  });

  const index = enabled ? displayIndex : 0;
  const hourIndex = useMemo(() => hourIndexForScroll(index), [index]);
  const nearestIndex = clamp(Math.round(index), 0, dailyLoopStates.length - 1);
  const pillHour = dailyLoopStates[nearestIndex]?.hour ?? dailyLoopStates[0].hour;
  const fractionFromSnap = Math.abs(index - nearestIndex);
  const axisCrossing = enabled && (isMoving || fractionFromSnap > 0.02);
  const linked = enabled;

  return (
    <section
      id="daily-loop"
      className={styles.section}
      data-pinned={enabled}
    >
      <Container>
        <div
          ref={headingRef}
          className={styles.headingEntrance}
          data-visible={headingVisible}
        >
          <SectionHeading
            className={styles.heading}
            title="The Daily Loop"
            subtitle="WHOOP doesn't rewrite your calendar. It acts as a bio-consultant, guiding your energy through a 24-hour cycle."
          />
        </div>
      </Container>

      <div className={styles.pinTrack} ref={pinRef} data-pinned={enabled}>
        <div className={styles.sticky}>
          <Container>
            <div className={styles.stage}>
              <div className={styles.visual}>
                <LoopCard
                  states={dailyLoopStates}
                  scrollIndex={index}
                  activeIndex={enabled ? activeIndex : 0}
                  prismZoom={enabled ? prismZoom : 1}
                  prismRotation={enabled ? prismRotation : 0}
                  prismPhase={enabled ? prismPhase : 'rest'}
                  prismRadiusScale={enabled ? prismRadiusScale : 1}
                  assembleProgress={enabled ? assembleProgress : 0}
                  dissolveProgress={enabled ? dissolveProgress : 1}
                  linked={linked}
                  axis={
                    <Timeline
                      hourIndex={hourIndex}
                      activeHour={pillHour}
                      axisCrossing={axisCrossing}
                      linked={linked}
                    />
                  }
                />
              </div>
            </div>
          </Container>
        </div>
      </div>
    </section>
  );
}
