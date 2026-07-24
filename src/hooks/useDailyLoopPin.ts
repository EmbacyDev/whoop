import { useEffect, useRef, useState, type RefObject } from 'react';
import { targetStateFromScroll } from '../components/DailyLoop/dailyLoopScrollMap';

type DailyLoopPinOptions = {
  stateCount: number;
  minWidth?: number;
  /** Scroll distance (vh) per state unit — mostly hold, short transition tail. */
  scrollPerStateVh?: number;
  /** Share of each unit spent viewing a state when syncing from scroll position. */
  holdFraction?: number;
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
  /** 0→1 while non-destination faces fade out during expand (1 = front only). */
  dissolveProgress: number;
  /** Extra pin-track height (vh) so fast scroll cannot unpin mid-cycle. */
  extraPinVh: number;
};

const FACE_ANGLE = 60;
/** Assembled prism size relative to full card (~60% of card width). */
const PRISM_ZOOM = 0.6;
const PRISM_RADIUS_TIGHT = 0.94;
/** Compress ends at 20% — quick, light entry into the prism. */
const COMPRESS_END = 0.2;
/** Rotate ends at 50% — rotation carries most of the mid-cycle momentum. */
const ROTATE_END = 0.5;
/** Neighbor faces begin assembling early during compress. */
const ASSEMBLE_START = 0.12;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Soft symmetric ease — natural momentum, minimal endpoint hesitation. */
function easeInOutSine(t: number) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

/** Gentle ease-out — fast start, soft settle (entry / exit). */
function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
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
    const zoomT = easeOutCubic(localT);
    const zoom = lerp(1, PRISM_ZOOM, zoomT);

    let assembleProgress = 0;
    if (localT > ASSEMBLE_START) {
      const assembleT = (localT - ASSEMBLE_START) / (1 - ASSEMBLE_START);
      assembleProgress = easeInOutSine(assembleT);
    }

    const radiusT = easeInOutSine(assembleProgress);

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
    const rotateT = easeInOutSine(
      (p - COMPRESS_END) / (ROTATE_END - COMPRESS_END),
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
  const zoomT = easeOutCubic(localT);
  const dissolveT = easeInOutSine(localT);
  const radiusT = easeInOutSine(localT);

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
 * Wheel / trackpad scroll triggers the next step immediately (±1 face).
 * Scroll position syncs state when re-entering the pin or scrolling back up,
 * so reverse playback matches forward.
 */
export function useDailyLoopPin({
  stateCount,
  minWidth = 768,
  scrollPerStateVh = 0.85,
  holdFraction = 0.8,
  finalHoldVh = 0.15,
  stepDurationMs = 1280,
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
  const pinEngagedRef = useRef(false);
  const lastScrollYRef = useRef(0);

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
      pinEngagedRef.current = false;
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
      return;
    }

    const cancelAnim = () => {
      if (rafRef.current !== undefined) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = undefined;
      }
      animatingRef.current = false;
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

    const readTargetIndex = () => {
      return targetStateFromScroll(readScrollRaw(), stateCount, holdFraction);
    };

    /** True while the pin track is sticky / owning scroll. */
    const isPinEngaged = () => {
      const root = pinRef.current;
      if (!root) return false;
      const rect = root.getBoundingClientRect();
      return rect.top <= 0 && rect.bottom >= window.innerHeight - 1;
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
      applyExtraPinVh(0);
    };

    const playStep = (from: number, to: number) => {
      if (from === to) {
        settleAt(to);
        return;
      }

      cancelAnim();
      animatingRef.current = true;
      setIsMoving(true);
      setActiveIndex(to);

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
     * Step toward scroll-mapped target when scrolling up or re-entering the pin.
     * Never auto-advances forward — wheel drives forward steps only.
     */
    const syncFromScrollPosition = (allowForward = false) => {
      if (!isPinEngaged() || animatingRef.current) return;

      const committed = committedRef.current;
      const target = readTargetIndex();
      if (target < committed) {
        playStep(committed, committed - 1);
      } else if (allowForward && target > committed) {
        playStep(committed, committed + 1);
      }
    };

    /**
     * Wheel / trackpad: one gesture → one face, immediately.
     * Forward and reverse use the same path.
     */
    const onWheel = (event: WheelEvent) => {
      if (!isPinEngaged() || animatingRef.current) return;

      const dy = event.deltaY;
      if (Math.abs(dy) < 4) return;

      const committed = committedRef.current;
      if (dy > 0 && committed < lastIndex) {
        playStep(committed, committed + 1);
        return;
      }
      if (dy < 0 && committed > 0) {
        playStep(committed, committed - 1);
      }
    };

    /**
     * Scroll position: sync when the pin is re-entered or when scrolling up,
     * so reverse playback from sections below stays aligned with scroll.
     */
    const onScroll = () => {
      const engaged = isPinEngaged();
      const scrollingUp = window.scrollY < lastScrollYRef.current - 0.5;
      const enteredPin = engaged && !pinEngagedRef.current;

      pinEngagedRef.current = engaged;
      lastScrollYRef.current = window.scrollY;

      if (!engaged || animatingRef.current) return;
      if (enteredPin) {
        syncFromScrollPosition(true);
      } else if (scrollingUp) {
        syncFromScrollPosition(false);
      }
    };

    const onResize = () => {
      if (animatingRef.current) return;
      // Pin-track height changes (extraPinVh) skew scroll progress — never
      // re-derive the face from scroll here or a settled state can flash forward.
      settleAt(committedRef.current);
    };

    lastScrollYRef.current = window.scrollY;
    pinEngagedRef.current = isPinEngaged();
    settleAt(readTargetIndex());

    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    const resizeObserver = new ResizeObserver(onResize);
    const root = pinRef.current;
    if (root) resizeObserver.observe(root);

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      resizeObserver.disconnect();
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
    holdFraction,
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
