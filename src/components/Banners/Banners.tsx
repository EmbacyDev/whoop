import { useEffect, useRef, useState, type TransitionEvent } from 'react';
import { Container } from '../ui/Container/Container';
import { SectionHeading } from '../ui/SectionHeading/SectionHeading';
import { BigBanner } from './BigBanner';
import { ProductivityBanner } from './ProductivityBanner';
import { CycleAdaptationBanner } from './CycleAdaptationBanner';
import { AiCoachBanner } from './AiCoachBanner';
import styles from './Banners.module.css';

/** Matches `.headingEntrance` / `.banner` / small-card entrance duration. */
const ENTRANCE_MS = 900;
/** Start the large banner before the heading fully settles (overlap). */
const HEADING_TO_BANNER_MS = 120;
/** Keep small banners on-screen briefly after they leave the viewport. */
const SMALL_EXIT_DELAY_MS = 700;

/**
 * Figma "Block 2" — the "Outsmart your burnout" banner grid.
 *
 * Entrance sequence (downward):
 * 1. Section heading
 * 2. Large banner (after heading finishes)
 * 3–5. Small banners one-by-one after the large banner finishes
 *
 * Small banners observe their own row for exit / re-entry so they are not
 * cleared when the large banner leaves the viewport first, and so scrolling
 * back up from below replays the same stagger.
 */
export function Banners() {
  const headingRef = useRef<HTMLDivElement>(null);
  const smallStageRef = useRef<HTMLDivElement>(null);

  const [headingVisible, setHeadingVisible] = useState(false);
  /** Sticky arm for the large banner — set once heading has finished once. */
  const [headingDone, setHeadingDone] = useState(false);
  /** After the large banner has entered once, smalls may show on their own IO. */
  const [smallsArmed, setSmallsArmed] = useState(false);
  const [smallActive, setSmallActive] = useState(false);
  const [smallsInView, setSmallsInView] = useState(false);

  const headingDoneTimerRef = useRef<number | undefined>(undefined);
  const smallArmTimerRef = useRef<number | undefined>(undefined);
  const smallExitTimerRef = useRef<number | undefined>(undefined);
  const smallActiveRef = useRef(false);
  smallActiveRef.current = smallActive;

  // Heading: animate when it actually enters the viewport (not the tall section).
  useEffect(() => {
    const el = headingRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setHeadingVisible(true);
        } else {
          // Exit animation; keep headingDone so the large banner stays armed.
          setHeadingVisible(false);
        }
      },
      { threshold: 0.35, rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Arm large banner partway through the heading entrance (snappier handoff).
  useEffect(() => {
    if (headingDoneTimerRef.current !== undefined) {
      window.clearTimeout(headingDoneTimerRef.current);
      headingDoneTimerRef.current = undefined;
    }
    if (!headingVisible) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setHeadingDone(true);
      return;
    }

    headingDoneTimerRef.current = window.setTimeout(() => {
      setHeadingDone(true);
    }, HEADING_TO_BANNER_MS);

    return () => {
      if (headingDoneTimerRef.current !== undefined) {
        window.clearTimeout(headingDoneTimerRef.current);
      }
    };
  }, [headingVisible]);

  // Small-banner row: own visibility — delayed exit, staggered re-entry.
  useEffect(() => {
    const el = smallStageRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setSmallsInView(entry.isIntersecting);
      },
      { threshold: 0.15, rootMargin: '0px 0px 10% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (smallExitTimerRef.current !== undefined) {
      window.clearTimeout(smallExitTimerRef.current);
      smallExitTimerRef.current = undefined;
    }

    if (smallsInView && smallsArmed) {
      if (smallActiveRef.current) return;
      // Ensure a clean off→on edge so staggered transitions replay.
      setSmallActive(false);
      const id = window.requestAnimationFrame(() => {
        setSmallActive(true);
      });
      return () => window.cancelAnimationFrame(id);
    }

    if (!smallsInView && smallActiveRef.current) {
      smallExitTimerRef.current = window.setTimeout(() => {
        setSmallActive(false);
      }, SMALL_EXIT_DELAY_MS);
    }
  }, [smallsInView, smallsArmed]);

  useEffect(() => {
    return () => {
      if (headingDoneTimerRef.current !== undefined) {
        window.clearTimeout(headingDoneTimerRef.current);
      }
      if (smallArmTimerRef.current !== undefined) {
        window.clearTimeout(smallArmTimerRef.current);
      }
      if (smallExitTimerRef.current !== undefined) {
        window.clearTimeout(smallExitTimerRef.current);
      }
    };
  }, []);

  const handleHeadingTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.propertyName !== 'opacity') return;
    if (!headingVisible) return;
    setHeadingDone(true);
  };

  const handleBigEntranceChange = (visible: boolean) => {
    if (!visible) {
      // Large-banner exit must not yank the small row away while it is still
      // on screen — smalls use their own observer + delayed exit.
      return;
    }

    if (smallArmTimerRef.current !== undefined) {
      window.clearTimeout(smallArmTimerRef.current);
      smallArmTimerRef.current = undefined;
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const delay = reduced ? 0 : ENTRANCE_MS;
    smallArmTimerRef.current = window.setTimeout(() => {
      setSmallsArmed(true);
    }, delay);
  };

  return (
    <section id="banners" className={styles.section}>
      <Container>
        <div className={styles.group}>
          <div
            ref={headingRef}
            className={styles.headingEntrance}
            data-visible={headingVisible}
            onTransitionEnd={handleHeadingTransitionEnd}
          >
            <SectionHeading
              className={styles.heading}
              subtitleClassName={styles.subtitle}
              title="Outsmart your burnout"
              subtitle="Stop letting back-to-back meetings dictate your energy. Own your life-work balance by syncing your daily schedule with your biology."
            />
          </div>

          <div className={styles.content}>
            <div className={styles.bigBannerStage}>
              <BigBanner
                entranceArmed={headingDone}
                onEntranceChange={handleBigEntranceChange}
              />
            </div>
            <div
              ref={smallStageRef}
              className={styles.smallBannersStage}
              data-active={smallActive}
            >
              <div className={styles.smallBanners}>
                <ProductivityBanner forceVisible={smallActive} />
                <CycleAdaptationBanner forceVisible={smallActive} />
                <AiCoachBanner forceVisible={smallActive} />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
