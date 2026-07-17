import { useMemo } from 'react';
import { Container } from '../ui/Container/Container';
import { SectionHeading } from '../ui/SectionHeading/SectionHeading';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';
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
 * fixed header. Scroll tracks continuously, then visually settles to the
 * nearest state without moving the window scroll position.
 */
export function DailyLoop() {
  const { ref: revealRef, isVisible } = useRevealOnScroll<HTMLDivElement>();
  usePreloadImages(IMAGE_URLS);

  const { pinRef, displayIndex, isMoving, enabled } = useDailyLoopPin({
    stateCount: dailyLoopStates.length,
    scrollPerStateVh: 0.62,
  });

  const index = enabled ? displayIndex : 0;
  const hourIndex = useMemo(() => hourIndexForScroll(index), [index]);
  // Keep the time pill on the same continuous index as image/copy (no early snap).
  const nearestIndex = clamp(Math.round(index), 0, dailyLoopStates.length - 1);
  const pillHour = dailyLoopStates[nearestIndex]?.hour ?? dailyLoopStates[0].hour;
  const fractionFromSnap = Math.abs(index - nearestIndex);
  // Crossing only while actively moving or mid settle ease — never at rest.
  const axisCrossing = enabled && (isMoving || fractionFromSnap > 0.02);
  // Direct-drive transforms whenever the pin is active so CSS transitions
  // never compete with the scroll/settle cylinder (avoids the end-of-snap jump).
  const linked = enabled;

  return (
    <section id="daily-loop" className={styles.section} data-pinned={enabled}>
      <Container>
        <div className={styles.reveal} ref={revealRef} data-visible={isVisible}>
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
