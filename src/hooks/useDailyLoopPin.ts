import { useEffect, useRef, useState, type RefObject } from 'react';

type DailyLoopPinOptions = {
  stateCount: number;
  minWidth?: number;
  /** Scroll distance (vh) to unlock each step transition. */
  scrollPerStateVh?: number;
  /** Extra scroll (vh) after the last state before the pin releases. */
  finalHoldVh?: number;
  /** Duration of one full compress → rotate → expand cycle (ms). */
  stepDurationMs?: number;
};

export type PrismPhase = 'rest' | 'compress' | 'rotate' | 'expand';

export type DailyLoopPinState = {
  pinRef: RefObject<HTMLDivElement>;
  /**
   * Continuous index for timeline / copy. Holds on integers while settled;
   * lerps across a step only during the scripted cycle (never scrubbed).
   */
  displayIndex: number;
  /** Settled (or destination) face index. */
  activeIndex: number;
  /** True while a step cycle is playing. */
  isMoving: boolean;
  enabled: boolean;
  segmentCount: number;
  /** 1 = full-size card; lower = assembled prism. */
  prismZoom: number;
  /** Prism rotateX in degrees (faceIndex * 60 at rest). */
  prismRotation: number;
  /** Current step-cycle phase for face visibility. */
  prismPhase: PrismPhase;
  /** 1 = normal face spacing; lower = tighter prism assembly. */
  prismRadiusScale: number;
  /** 0→1 while neighboring faces assemble during compress. */
  assembleProgress: number;
  /** 0→1 while non-destination faces dissolve during expand (1 = front only). */
  dissolveProgress: number;
  /** Extra pin-track height (vh) so fast scroll cannot unpin mid-cycle. */
  extraPinVh: number;
};

const FACE_ANGLE = 60;
/** Assembled prism size relative to full card (~60% of card width). */
const PRISM_ZOOM = 0.6;
const PRISM_RADIUS_TIGHT = 0.94;
/** Ignore residual wheel ticks from the same gesture after a step settles. */
const GESTURE_IDLE_MS = 180;
/** Compress ends at 40% — scale phases breathe before/after rotate. */
const COMPRESS_END = 0.4;
/** Rotate ends at 62% — longer window for weighted ease-in-out. */
const ROTATE_END = 0.62;
/** Neighbor faces begin assembling after this fraction of compress local time. */
const ASSEMBLE_START = 0.38;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function easeOutQuint(t: number) {
  return 1 - (1 - t) ** 5;
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function easeInOutQuint(t: number) {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - (-2 * t + 2) ** 5 / 2;
}

/** Heavier ease-in-out for rotation — slow start/end, fast mid. */
function easeInOutPower(t: number, p = 6) {
  return t < 0.5
    ? 2 ** (p - 1) * t ** p
    : 1 - (-2 * t + 2) ** p / 2;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/**
 * Pose for one complete step cycle (progress 0→1):
 * compress → one-face rotate → expand. Never leaves the prism mid-turn.
 */
function poseForStepProgress(from: number, to: number, progress: number) {
  const p = clamp(progress, 0, 1);

  if (p <= COMPRESS_END) {
    const localT = p / COMPRESS_END;
    const zoomT = easeInOutQuint(localT);
    const zoom = lerp(1, PRISM_ZOOM, zoomT);

    let assembleProgress = 0;
    if (localT > ASSEMBLE_START) {
      const assembleT = (localT - ASSEMBLE_START) / (1 - ASSEMBLE_START);
      assembleProgress = easeInOutCubic(assembleT);
    }

    const radiusT = easeInOutQuint(assembleProgress);

    return {
      zoom,
      rotation: from * FACE_ANGLE,
      displayIndex: from,
      phase: 'compress' as const,
      radiusScale: lerp(1, PRISM_RADIUS_TIGHT, radiusT),
      assembleProgress,
      dissolveProgress: 0,
    };
  }

  if (p <= ROTATE_END) {
    const rotateT = easeInOutPower(
      (p - COMPRESS_END) / (ROTATE_END - COMPRESS_END),
      6,
    );
    return {
      zoom: PRISM_ZOOM,
      rotation: lerp(from, to, rotateT) * FACE_ANGLE,
      displayIndex: lerp(from, to, rotateT),
      phase: 'rotate' as const,
      radiusScale: PRISM_RADIUS_TIGHT,
      assembleProgress: 1,
      dissolveProgress: 0,
    };
  }

  const localT = (p - ROTATE_END) / (1 - ROTATE_END);
  const zoomT = easeInOutQuint(localT);
  const dissolveT = easeOutQuint(Math.min(localT / 0.32, 1));
  const radiusT = easeInOutQuint(localT);

  return {
    zoom: lerp(PRISM_ZOOM, 1, zoomT),
    rotation: to * FACE_ANGLE,
    displayIndex: to,
    phase: 'expand' as const,
    radiusScale: lerp(PRISM_RADIUS_TIGHT, 1, radiusT),
    assembleProgress: 1,
    dissolveProgress: dissolveT,
  };
}

/**
 * Sticky pin for The Daily Loop — discrete step cycles.
 *
 * Scroll only chooses the next target face. Crossing a step threshold plays
 * one full compress → rotate-one-face → expand animation. The prism is never
 * scrubbed by scroll. After the last face settles, the pin releases immediately.
 */
export function useDailyLoopPin({
  stateCount,
  minWidth = 768,
  scrollPerStateVh = 2.4,
  finalHoldVh = 0.25,
  stepDurationMs = 2300,
}: DailyLoopPinOptions): DailyLoopPinState {
  const pinRef = useRef<HTMLDivElement>(null!);
  const [enabled, setEnabled] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [prismZoom, setPrismZoom] = useState(1);
  const [prismRotation, setPrismRotation] = useState(0);
  const [prismPhase, setPrismPhase] = useState<PrismPhase>('rest');
  const [prismRadiusScale, setPrismRadiusScale] = useState(1);
  const [assembleProgress, setAssembleProgress] = useState(0);
  const [dissolveProgress, setDissolveProgress] = useState(1);
  const [extraPinVh, setExtraPinVh] = useState(0);

  const segmentCount = Math.max(stateCount - 1, 1);
  const lastIndex = Math.max(stateCount - 1, 0);
  /** Transition segments + a trailing final-hold segment after the last card. */
  const scrollSegments = segmentCount + finalHoldVh / scrollPerStateVh;

  const committedRef = useRef(0);
  const animatingRef = useRef(false);
  const rafRef = useRef<number | undefined>(undefined);
  const displayIndexRef = useRef(0);
  const extraPinVhRef = useRef(0);
  /**
   * When false, wheel/trackpad input cannot start a new step.
   * Stays false during a transition and until the gesture goes idle.
   */
  const armedRef = useRef(true);
  const gestureIdleTimerRef = useRef<number | undefined>(undefined);

  const applyExtraPinVh = (value: number) => {
    extraPinVhRef.current = value;
    setExtraPinVh(value);
  };

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
      committedRef.current = 0;
      animatingRef.current = false;
      displayIndexRef.current = 0;
      setDisplayIndex(0);
      setActiveIndex(0);
      setIsMoving(false);
      setPrismZoom(1);
      setPrismRotation(0);
      setPrismPhase('rest');
      setPrismRadiusScale(1);
      setAssembleProgress(0);
      setDissolveProgress(1);
      applyExtraPinVh(0);
      armedRef.current = true;
      if (gestureIdleTimerRef.current !== undefined) {
        window.clearTimeout(gestureIdleTimerRef.current);
        gestureIdleTimerRef.current = undefined;
      }
      return;
    }

    const cancelAnim = () => {
      if (rafRef.current !== undefined) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = undefined;
      }
      animatingRef.current = false;
    };

    const clearGestureIdle = () => {
      if (gestureIdleTimerRef.current !== undefined) {
        window.clearTimeout(gestureIdleTimerRef.current);
        gestureIdleTimerRef.current = undefined;
      }
    };

    /** Disarm until wheel/trackpad input has been idle briefly. */
    const disarmUntilGestureIdle = () => {
      armedRef.current = false;
      clearGestureIdle();
      gestureIdleTimerRef.current = window.setTimeout(() => {
        gestureIdleTimerRef.current = undefined;
        if (!animatingRef.current) {
          armedRef.current = true;
        }
      }, GESTURE_IDLE_MS);
    };

    const applyPose = (from: number, to: number, progress: number) => {
      const pose = poseForStepProgress(from, to, progress);
      displayIndexRef.current = pose.displayIndex;
      setDisplayIndex(pose.displayIndex);
      setPrismZoom(pose.zoom);
      setPrismRotation(pose.rotation);
      setPrismPhase(pose.phase);
      setPrismRadiusScale(pose.radiusScale);
      setAssembleProgress(pose.assembleProgress);
      setDissolveProgress(pose.dissolveProgress);
    };

    /**
     * Scroll progress in step units. Step length matches CSS pin track:
     * `100vh * scrollPerStateVh` per transition (not `/100`).
     */
    const readScrollRaw = () => {
      const root = pinRef.current;
      if (!root) return 0;
      const pinStartY = root.getBoundingClientRect().top + window.scrollY;
      const scrolled = Math.max(0, window.scrollY - pinStartY);
      const stepLength = scrollPerStateVh * window.innerHeight;
      if (stepLength <= 0) return 0;
      return scrolled / stepLength;
    };

    /** Absolute face index from scroll — used on load / resize jump only. */
    const readAbsoluteIndex = () => {
      return clamp(Math.round(readScrollRaw()), 0, lastIndex);
    };

    /** True while the pin track is sticky / owning scroll. */
    const isPinEngaged = () => {
      const root = pinRef.current;
      if (!root) return false;
      const rect = root.getBoundingClientRect();
      return rect.top <= 0 && rect.bottom >= window.innerHeight - 1;
    };

    const reservePinVhForStep = (to: number) => {
      // Keep sticky alive through the full scripted cycle even if the user
      // scrolls quickly through the remaining pin track (especially on last step).
      const reserve =
        to === lastIndex ? scrollPerStateVh * 2.75 : scrollPerStateVh * 1.35;
      applyExtraPinVh(reserve);
    };

    const settleAt = (index: number) => {
      committedRef.current = index;
      displayIndexRef.current = index;
      setDisplayIndex(index);
      setActiveIndex(index);
      setPrismZoom(1);
      setPrismRotation(index * FACE_ANGLE);
      setPrismPhase('rest');
      setPrismRadiusScale(1);
      setAssembleProgress(0);
      setDissolveProgress(1);
      setIsMoving(false);
      animatingRef.current = false;
      // Release extra pin immediately — next scroll leaves the section.
      applyExtraPinVh(0);
      // Do not auto-chain steps from scroll position. Wait for a new gesture.
      disarmUntilGestureIdle();
    };

    const playStep = (from: number, to: number) => {
      if (from === to) {
        settleAt(to);
        return;
      }

      armedRef.current = false;
      clearGestureIdle();
      cancelAnim();
      animatingRef.current = true;
      setIsMoving(true);
      setActiveIndex(to);
      reservePinVhForStep(to);

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) {
        settleAt(to);
        return;
      }

      const start = performance.now();
      const step = (now: number) => {
        const t = clamp((now - start) / stepDurationMs, 0, 1);
        applyPose(from, to, t);
        if (t < 1) {
          rafRef.current = requestAnimationFrame(step);
          return;
        }
        settleAt(to);
      };
      rafRef.current = requestAnimationFrame(step);
    };

    /**
     * One wheel / trackpad gesture → exactly one card (±1).
     * Same threshold both directions. Extra events ignored until the cycle
     * finishes and the gesture goes idle.
     */
    const onWheel = (event: WheelEvent) => {
      if (!isPinEngaged()) return;

      // Keep the current gesture disarmed while ticks keep arriving.
      if (animatingRef.current || !armedRef.current) {
        disarmUntilGestureIdle();
        return;
      }

      const dy = event.deltaY;
      if (Math.abs(dy) < 6) return;

      const committed = committedRef.current;
      if (dy > 0 && committed < lastIndex) {
        playStep(committed, committed + 1);
        return;
      }
      if (dy < 0 && committed > 0) {
        playStep(committed, committed - 1);
      }
    };

    const onResize = () => {
      if (animatingRef.current) return;
      settleAt(committedRef.current);
    };

    armedRef.current = true;
    settleAt(0);
    // Align to current scroll in case the page reloads mid-section.
    requestAnimationFrame(() => {
      const absolute = readAbsoluteIndex();
      if (absolute !== 0) {
        // Jump to the face without animating a long catch-up chain on load.
        settleAt(absolute);
        armedRef.current = true;
        clearGestureIdle();
      }
    });

    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('resize', onResize);
    const resizeObserver = new ResizeObserver(onResize);
    const root = pinRef.current;
    if (root) resizeObserver.observe(root);

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      resizeObserver.disconnect();
      clearGestureIdle();
      cancelAnim();
    };
  }, [
    enabled,
    stateCount,
    segmentCount,
    scrollSegments,
    stepDurationMs,
    lastIndex,
    finalHoldVh,
    scrollPerStateVh,
  ]);

  useEffect(() => {
    const root = pinRef.current;
    if (!root) return;
    if (enabled) {
      root.style.setProperty('--daily-loop-segments', String(scrollSegments));
      root.style.setProperty('--daily-loop-scroll-vh', String(scrollPerStateVh));
      root.style.setProperty('--daily-loop-extra-vh', String(extraPinVh));
    } else {
      root.style.removeProperty('--daily-loop-segments');
      root.style.removeProperty('--daily-loop-scroll-vh');
      root.style.removeProperty('--daily-loop-extra-vh');
    }
  }, [enabled, scrollSegments, scrollPerStateVh, extraPinVh]);

  return {
    pinRef,
    displayIndex,
    activeIndex,
    isMoving,
    enabled,
    segmentCount,
    prismZoom,
    prismRotation,
    prismPhase,
    prismRadiusScale,
    assembleProgress,
    dissolveProgress,
    extraPinVh,
  };
}
