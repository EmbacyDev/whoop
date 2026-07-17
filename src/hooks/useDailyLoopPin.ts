import { useEffect, useRef, useState, type RefObject } from 'react';

type DailyLoopPinOptions = {
  stateCount: number;
  minWidth?: number;
  scrollPerStateVh?: number;
  /** Idle ms before snap-to-nearest settles. */
  settleDelayMs?: number;
  /** Duration of the visual settle ease toward the nearest state. */
  settleMs?: number;
};

export type DailyLoopPinState = {
  pinRef: RefObject<HTMLDivElement>;
  /**
   * Index used to render the wheel/image/copy. Matches scroll while moving;
   * eases to the nearest integer when the user stops.
   */
  displayIndex: number;
  /** Nearest predefined state (0…stateCount-1). */
  activeIndex: number;
  /** True while the user is scrolling (before settle completes). */
  isMoving: boolean;
  enabled: boolean;
  segmentCount: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

/**
 * Sticky pin for The Daily Loop.
 * - While scrolling: `displayIndex` tracks scroll 1:1 via `raw + bias`.
 * - On idle: eases to the nearest integer and stores a bias so resume stays continuous.
 * - Never calls `scrollTo` — the window scroll position is never yanked.
 */
export function useDailyLoopPin({
  stateCount,
  minWidth = 768,
  scrollPerStateVh = 0.62,
  settleDelayMs = 140,
  settleMs = 420,
}: DailyLoopPinOptions): DailyLoopPinState {
  const pinRef = useRef<HTMLDivElement>(null!);
  const [enabled, setEnabled] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const segmentCount = Math.max(stateCount - 1, 1);

  const rawIndexRef = useRef(0);
  const displayIndexRef = useRef(0);
  const activeIndexRef = useRef(0);
  const biasRef = useRef(0);
  const settleRafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const desktopMq = window.matchMedia(`(min-width: ${minWidth}px)`);
    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');

    const syncEnabled = () => {
      setEnabled(desktopMq.matches && !motionMq.matches);
    };

    syncEnabled();
    desktopMq.addEventListener('change', syncEnabled);
    motionMq.addEventListener('change', syncEnabled);
    return () => {
      desktopMq.removeEventListener('change', syncEnabled);
      motionMq.removeEventListener('change', syncEnabled);
    };
  }, [minWidth]);

  useEffect(() => {
    if (!enabled) {
      rawIndexRef.current = 0;
      displayIndexRef.current = 0;
      activeIndexRef.current = 0;
      biasRef.current = 0;
      setDisplayIndex(0);
      setActiveIndex(0);
      setIsMoving(false);
      return;
    }

    let ticking = false;
    let settleTimer: number | undefined;
    let lastScrollY = window.scrollY;
    /** Raw index captured when the current latch began (for micro-scroll ignore). */
    let latchedRaw: number | null = null;
    let latchedTarget: number | null = null;

    /** Ignore trackpad jitter this far from the raw value at settle. */
    const LOCK_EPSILON = 0.08;
    /** Extra deadband past the midpoint before the discrete active index flips. */
    const ACTIVE_HYSTERESIS = 0.08;

    const cancelSettleAnimation = () => {
      if (settleRafRef.current !== undefined) {
        cancelAnimationFrame(settleRafRef.current);
        settleRafRef.current = undefined;
      }
    };

    const readRawIndex = () => {
      const root = pinRef.current;
      if (!root) return 0;
      const scrollable = root.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return 0;
      const rootTop = root.getBoundingClientRect().top + window.scrollY;
      const scrolled = clamp(window.scrollY - rootTop, 0, scrollable);
      return clamp((scrolled / scrollable) * (stateCount - 1), 0, stateCount - 1);
    };

    const mappedIndex = (raw: number) =>
      clamp(raw + biasRef.current, 0, stateCount - 1);

    const commitDisplay = (value: number) => {
      displayIndexRef.current = value;
      setDisplayIndex(value);
    };

    const commitActive = (value: number) => {
      const next = clamp(value, 0, stateCount - 1);
      if (next === activeIndexRef.current) return;
      activeIndexRef.current = next;
      setActiveIndex(next);
    };

    /**
     * Flip the discrete active state only after clearing the midpoint + deadband,
     * so boundary jitter cannot bounce the pill/copy label.
     */
    const activeFromContinuous = (value: number) => {
      const prev = activeIndexRef.current;
      const delta = value - prev;
      if (delta >= 0.5 + ACTIVE_HYSTERESIS) {
        return clamp(Math.floor(value + 0.5), 0, stateCount - 1);
      }
      if (delta <= -(0.5 + ACTIVE_HYSTERESIS)) {
        return clamp(Math.ceil(value - 0.5), 0, stateCount - 1);
      }
      return prev;
    };

    const animateToIndex = (target: number) => {
      cancelSettleAnimation();
      const from = displayIndexRef.current;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced || Math.abs(from - target) < 0.001) {
        commitDisplay(target);
        commitActive(target);
        setIsMoving(false);
        return;
      }

      const start = performance.now();
      const step = (now: number) => {
        const t = clamp((now - start) / settleMs, 0, 1);
        const value = from + (target - from) * easeOutCubic(t);
        commitDisplay(value);
        commitActive(activeFromContinuous(value));
        if (t < 1) {
          settleRafRef.current = requestAnimationFrame(step);
        } else {
          commitDisplay(target);
          commitActive(target);
          setIsMoving(false);
          settleRafRef.current = undefined;
        }
      };
      settleRafRef.current = requestAnimationFrame(step);
    };

    const settle = () => {
      settleTimer = undefined;
      const raw = rawIndexRef.current;
      const target = clamp(Math.round(mappedIndex(raw)), 0, stateCount - 1);
      biasRef.current = target - raw;
      latchedRaw = raw;
      latchedTarget = target;
      // Do not flip the discrete active label before the visual settle — keep
      // pill/time in lockstep with displayIndex through animateToIndex.
      animateToIndex(target);
    };

    const scheduleSettle = () => {
      if (settleTimer !== undefined) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settle, settleDelayMs);
    };

    const followScroll = (raw: number) => {
      latchedRaw = null;
      latchedTarget = null;
      cancelSettleAnimation();
      const next = mappedIndex(raw);
      commitDisplay(next);
      commitActive(activeFromContinuous(next));
      setIsMoving(true);
      scheduleSettle();
    };

    const onScrollFrame = () => {
      ticking = false;

      const raw = readRawIndex();
      const scrollY = window.scrollY;
      const moved = Math.abs(scrollY - lastScrollY) > 0.5;
      lastScrollY = scrollY;
      rawIndexRef.current = raw;

      if (!moved) return;

      // Hold the settled stop through tiny inertia / trackpad jitter.
      if (
        latchedRaw !== null &&
        latchedTarget !== null &&
        Math.abs(raw - latchedRaw) < LOCK_EPSILON
      ) {
        if (settleTimer !== undefined) {
          window.clearTimeout(settleTimer);
          settleTimer = undefined;
        }
        return;
      }

      followScroll(raw);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(onScrollFrame);
    };

    const onResize = () => {
      const raw = readRawIndex();
      rawIndexRef.current = raw;
      lastScrollY = window.scrollY;

      if (
        latchedRaw !== null &&
        latchedTarget !== null &&
        Math.abs(raw - latchedRaw) < LOCK_EPSILON
      ) {
        cancelSettleAnimation();
        biasRef.current = latchedTarget - raw;
        commitDisplay(latchedTarget);
        commitActive(latchedTarget);
        setIsMoving(false);
        return;
      }

      // Don't fight an in-flight settle ease on resize.
      if (settleRafRef.current !== undefined) return;

      const next = mappedIndex(raw);
      commitDisplay(next);
      commitActive(clamp(Math.round(next), 0, stateCount - 1));
    };

    const initial = readRawIndex();
    rawIndexRef.current = initial;
    biasRef.current = 0;
    displayIndexRef.current = initial;
    activeIndexRef.current = clamp(Math.round(initial), 0, stateCount - 1);
    setDisplayIndex(initial);
    setActiveIndex(activeIndexRef.current);
    setIsMoving(false);
    lastScrollY = window.scrollY;

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    const resizeObserver = new ResizeObserver(onResize);
    const root = pinRef.current;
    if (root) resizeObserver.observe(root);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      resizeObserver.disconnect();
      if (settleTimer !== undefined) window.clearTimeout(settleTimer);
      cancelSettleAnimation();
    };
  }, [enabled, stateCount, settleDelayMs, settleMs]);

  useEffect(() => {
    const root = pinRef.current;
    if (!root) return;
    if (enabled) {
      root.style.setProperty('--daily-loop-segments', String(segmentCount));
      root.style.setProperty('--daily-loop-scroll-vh', String(scrollPerStateVh));
    } else {
      root.style.removeProperty('--daily-loop-segments');
      root.style.removeProperty('--daily-loop-scroll-vh');
    }
  }, [enabled, segmentCount, scrollPerStateVh]);

  return {
    pinRef,
    displayIndex,
    activeIndex,
    isMoving,
    enabled,
    segmentCount,
  };
}
