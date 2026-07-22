import { useEffect, useMemo, useRef, useState } from 'react';
import { Container } from '../ui/Container/Container';
import { SectionHeading } from '../ui/SectionHeading/SectionHeading';
import { useDailyLoopPin } from '../../hooks/useDailyLoopPin';
import { usePreloadImages } from '../../hooks/usePreloadImages';
import { Timeline } from './Timeline/Timeline';
import { LoopCard } from './LoopCard/LoopCard';
import { dailyLoopStates, timelineHours } from './dailyLoopData';
import styles from './DailyLoop.module.css';

const IMAGE_URLS = dailyLoopStates.map((state) => state.image);

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
  const sectionRef = useRef<HTMLElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [entranceVisible, setEntranceVisible] = useState(false);
  usePreloadImages(IMAGE_URLS);

  // Observe a 1px sentinel at the section top — NOT the tall pin track.
  // Observing the full section with threshold failed because the pin track
  // is ~4× viewport tall, so intersection ratio stayed tiny near entry.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    if (typeof IntersectionObserver === 'undefined') {
      setEntranceVisible(true);
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setEntranceVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) setEntranceVisible(true);
      },
      // Fire as the Daily Loop heading approaches the lower viewport.
      { threshold: 0, rootMargin: '0px 0px -18% 0px' },
    );
    observer.observe(sentinel);
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
    scrollPerStateVh: 2.4,
    finalHoldVh: 0.25,
    stepDurationMs: 2300,
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
      ref={sectionRef}
      className={styles.section}
      data-visible={entranceVisible}
      data-pinned={enabled}
    >
      {/* IO target — independent of the tall pin-track height. */}
      <div ref={sentinelRef} className={styles.entranceSentinel} aria-hidden="true" />

      <Container>
        <SectionHeading
          className={styles.heading}
          title="The Daily Loop"
          subtitle="WHOOP doesn't rewrite your calendar. It acts as a bio-consultant, guiding your energy through a 24-hour cycle."
        />
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
