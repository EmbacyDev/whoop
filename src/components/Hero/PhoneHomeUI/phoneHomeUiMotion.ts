import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);

/**
 * Figma screen 1 relative length (node 1301:4) — proportions only.
 * Scaled into the scroll-scrub window (screenshot pose → Sharpness heading).
 */
export const PHONE_UI_PHASE1_WEIGHT = 2;

/**
 * Figma screen 2 relative length (node 1323:4 / “screen 2”).
 * Continues immediately after phase 1 on the same scrubbed timeline.
 */
export const PHONE_UI_PHASE2_WEIGHT = 1.815;

/**
 * Figma screen 3 relative length (node 1330:856 / cohort ~4.057s).
 * Continues after Sharpness settle through peek hold on the parent scrub.
 */
export const PHONE_UI_PHASE3_WEIGHT = 4.057;

/** Combined Figma weight for phases 1+2 only (preserved when phase 3 is appended). */
export const PHONE_UI_PHASE12_WEIGHT = PHONE_UI_PHASE1_WEIGHT + PHONE_UI_PHASE2_WEIGHT;

/** @deprecated Prefer PHONE_UI_PHASE12_WEIGHT — phases 1+2 only. */
export const PHONE_UI_TOTAL_WEIGHT = PHONE_UI_PHASE12_WEIGHT;

/**
 * Phase-3 fractions of the Figma screen-3 cohort (get_motion_context 1330:856).
 * Soft continuous morph: Sharpness opens → calendar card → layers → green → recommend.
 */
export const PHONE_UI_CALENDAR = {
  /** Sharpness continues growing / drifting toward the card. */
  sharpContinueStart: 0.008,
  sharpContinueEnd: 0.184,
  /** End scale relative to the settled Sharpness endScale (1.5 → ~1.9 in Figma). */
  sharpEndScaleMul: 1.9 / 1.5,
  sharpEndYPx: 28,
  /** Figma 1330:898 — ring opens into a bottom arc (flatten + drift down). */
  arcOpenStart: 0.081,
  arcOpenEnd: 0.487,
  arcEndYPx: 186,
  arcFlatScaleX: 2.35,
  arcFlatScaleY: 0.4,
  /** Visible stroke grows slightly as the ring opens. */
  arcPctEnd: 74,
  valueFadeStart: 0.091,
  valueFadeEnd: 0.124,
  trackFadeStart: 0.054,
  trackFadeEnd: 0.13,
  labelFadeStart: 0.081,
  labelFadeEnd: 0.184,
  /** Filled Sharpness arc exits as card viz takes over. */
  sharpExitStart: 0.53,
  sharpExitEnd: 0.586,
  cardStart: 0.453,
  cardEnd: 0.703,
  cardFromScale: 0.9,
  cardToScale: 1,
  cardFromYPx: -18,
  cardToYPx: 85,
  layer1Start: 0.535,
  layer1End: 0.611,
  layer2Start: 0.56,
  layer2End: 0.636,
  layer3Start: 0.581,
  layer3End: 0.658,
  layer1Opacity: 1,
  layer2Opacity: 0.55,
  layer3Opacity: 0.55,
  greenStart: 0.7,
  greenEnd: 0.86,
  recommendStart: 0.641,
  recommendEnd: 0.899,
  recommendFromYPx: 28,
} as const;

/** @deprecated Use PHONE_UI_PHASE1_WEIGHT — kept as alias for any external reads. */
export const PHONE_UI_DURATION_S = PHONE_UI_PHASE1_WEIGHT;
/** @deprecated Use PHONE_UI_PHASE2_WEIGHT */
export const PHONE_UI_PHASE2_DURATION_S = PHONE_UI_PHASE2_WEIGHT;
/** @deprecated Phase 2 start is phase1 weight within the scrub window. */
export const PHONE_UI_PHASE2_START_S = PHONE_UI_PHASE1_WEIGHT;

/**
 * Metric entrance from get_motion_context (times are fractions of phase 1).
 * Sleep → Recovery → Strain stagger; opacity uses (0.5,0,0.5,1), y uses near-expo outs.
 */
export const PHONE_UI_METRICS = [
  {
    id: 'sleep' as const,
    label: 'Sleep',
    from: 100,
    to: 94,
    /** Lime — Figma sleep filled stroke */
    color: '#b0f13f',
    yPx: 100,
    holdUntil: 0.0205,
    settleAt: 0.2463,
    opacityEase: 'phoneUiOpacity',
    yEase: 'phoneUiSleepY',
  },
  {
    id: 'recovery' as const,
    label: 'Recovery',
    from: 45,
    to: 32,
    /** Warm red→orange — Figma recovery */
    color: 'url(#phoneUiRecoveryGrad)',
    yPx: 70,
    holdUntil: 0.0829,
    settleAt: 0.315,
    opacityEase: 'phoneUiOpacity',
    yEase: 'phoneUiRecoveryY',
  },
  {
    id: 'strain' as const,
    label: 'Strain',
    from: 55,
    to: 49,
    /** Amber — Figma strain */
    color: 'url(#phoneUiStrainGrad)',
    yPx: 90,
    holdUntil: 0.1873,
    settleAt: 0.4053,
    opacityEase: 'phoneUiOpacity',
    yEase: 'phoneUiStrainY',
  },
] as const;

export type PhoneUiMetricId = (typeof PHONE_UI_METRICS)[number]['id'];

/**
 * Sharpness — expands from the merge point after the three rings collapse.
 * CSS parks the anchor at the resting top (1077 → 27.11%); GSAP grows from a
 * near-zero seed at that exact center (no off-screen travel).
 *
 * Phase-2 timing (fractions of phase 2) — morph is a short early burst,
 * then Sharpness holds at 58% through the rest of the scrub window:
 *   0 → 0.03     brief settle on the trio
 *   0.03 → 0.15  collapse (converge + shrink + fade)
 *   0.14 → 0.34  Sharpness ring expand + value 0→48
 *   0.34 → 1     value 48→58 finishes while Meet Sharpness is on screen
 */
export const PHONE_UI_SHARPNESS = {
  from: 0,
  /** Last ~10% of the count finishes during the Meet Sharpness hold. */
  mid: 48,
  to: 58,
  /** Orange → yellow → lime — Figma sharpness filled stroke */
  color: 'url(#phoneUiSharpnessGrad)',
  /** Near-point seed — expands only after the trio has collapsed */
  startScale: 0.06,
  endScale: 1.5,
  startYPx: 0,
  endYPx: 0,
  /** Starts as collapse finishes — avoids a 4-ring pile-up */
  holdUntil: 0.14,
  /** Ring scale settles here; value continues to `valueSettleAt`. */
  settleAt: 0.34,
  /** Value / stroke reach 58% by end of phase 12 (Meet Sharpness on screen). */
  valueSettleAt: 1,
} as const;

/**
 * Parent scrub time when the Sharpness ring expand begins (phase-2 handoff).
 * Used to sync phone drop + Meet Sharpness heading without retiming phases 1–2.
 */
export function phoneUiSharpnessRingScrubTime(
  phoneUiStart: number,
  phase12Duration: number,
): number {
  const p1Dur = phase12Duration * (PHONE_UI_PHASE1_WEIGHT / PHONE_UI_PHASE12_WEIGHT);
  const p2Dur = phase12Duration * (PHONE_UI_PHASE2_WEIGHT / PHONE_UI_PHASE12_WEIGHT);
  const sharpStart = p1Dur + PHONE_UI_SHARPNESS.holdUntil * p2Dur;
  return phoneUiStart + sharpStart;
}

/**
 * Phase-2 collapse (fractions of phase 2).
 * Short decisive burst: cards converge to the Sharpness center (offsets
 * measured at build), scale to a point, and fade as one unit
 * (ring + number + % + label). Travel is xPercent / yPercent of each card
 * so it stays proportional as the phone resizes.
 */
const PHASE2_COLLAPSE = {
  /** Brief settle, then quick collapse together. */
  hold: 0.03,
  end: 0.15,
  endScale: 0.08,
} as const;

let easesRegistered = false;
let customEasesOk = false;

export function ensurePhoneUiEases() {
  if (easesRegistered) return;
  try {
    // Verbatim Figma cubic-beziers from get_motion_context snippets.
    CustomEase.create('phoneUiOpacity', '0.5,0,0.5,1');
    CustomEase.create('phoneUiSleepY', '0,0,0,0.991');
    CustomEase.create('phoneUiRecoveryY', '0,0,0.274,0.991');
    CustomEase.create('phoneUiStrainY', '0,0,0.271,0.989');
    CustomEase.create('phoneUiRing', '0,0,0.58,1');
    // Phase-2: snappy collapse → expand (short scrub burst)
    CustomEase.create('phoneUiExit', '0.5,0,0.75,1');
    CustomEase.create('phoneUiExitMove', '0.45,0,0.6,1');
    CustomEase.create('phoneUiSharpEnter', '0.2,0.7,0.25,1');
    // Phase-3: soft premium beziers from Figma screen-3 snippets.
    CustomEase.create('phoneUiCalCard', '0,0,0.427,0.981');
    CustomEase.create('phoneUiCalCardY', '0,0,0.083,0.978');
    CustomEase.create('phoneUiCalLayer', '0.5,0,0.5,1');
    CustomEase.create('phoneUiCalSharp', '0,0,0.107,0.937');
    CustomEase.create('phoneUiCalRecommend', '0,0,0,0.996');
    customEasesOk = true;
  } catch {
    customEasesOk = false;
  }
  easesRegistered = true;
}

const EASE_FALLBACKS: Record<string, string> = {
  phoneUiOpacity: 'power2.inOut',
  phoneUiSleepY: 'power3.out',
  phoneUiRecoveryY: 'power3.out',
  phoneUiStrainY: 'power3.out',
  phoneUiRing: 'power2.out',
  phoneUiExit: 'power2.inOut',
  phoneUiExitMove: 'power2.inOut',
  phoneUiSharpEnter: 'power2.out',
  phoneUiCalCard: 'power2.out',
  phoneUiCalCardY: 'power3.out',
  phoneUiCalLayer: 'power2.inOut',
  phoneUiCalSharp: 'power2.out',
  phoneUiCalRecommend: 'power3.out',
};

function resolveEase(name: string) {
  ensurePhoneUiEases();
  return customEasesOk ? name : (EASE_FALLBACKS[name] ?? 'power2.out');
}

export type PhoneHomeUiElements = {
  root: HTMLElement;
  metricRoots: HTMLElement[];
  valueEls: HTMLElement[];
  progressEls: SVGCircleElement[];
  circumferences: number[];
  sharpnessRoot: HTMLElement;
  sharpnessValue: HTMLElement;
  sharpnessValueWrap: HTMLElement;
  sharpnessLabel: HTMLElement;
  sharpnessProgress: SVGCircleElement;
  sharpnessTrack: SVGCircleElement;
  sharpnessRingWrap: HTMLElement;
  sharpnessCircumference: number;
  calendarRoot: HTMLElement;
  calLayers: SVGCircleElement[];
  calGreen: SVGCircleElement;
  calGreenCircumference: number;
  calGreenPct: number;
  recommendRoot: HTMLElement;
};

function dashOffset(circumference: number, pct: number) {
  return circumference * (1 - Math.min(Math.max(pct, 0), 100) / 100);
}

/** Flatten the Sharpness ring into a wide bottom arc (Figma 1330:898). */
function applySharpnessArcMorph(
  els: Pick<
    PhoneHomeUiElements,
    'sharpnessProgress' | 'sharpnessTrack' | 'sharpnessRingWrap' | 'sharpnessCircumference'
  >,
  t: number,
  endPct: number,
) {
  const clamped = Math.min(Math.max(t, 0), 1);
  const cal = PHONE_UI_CALENDAR;
  const scaleX = gsap.utils.interpolate(1, cal.arcFlatScaleX, clamped);
  const scaleY = gsap.utils.interpolate(1, cal.arcFlatScaleY, clamped);
  const arcOrigin = '50% 88%';
  gsap.set(els.sharpnessRingWrap, {
    scaleX,
    scaleY,
    transformOrigin: arcOrigin,
  });
  gsap.set(els.sharpnessTrack, {
    scaleX,
    scaleY,
    transformOrigin: '50% 50%',
  });
  const pct = gsap.utils.interpolate(PHONE_UI_SHARPNESS.to, endPct, clamped);
  els.sharpnessProgress.style.strokeDashoffset = String(
    dashOffset(els.sharpnessCircumference, pct),
  );
}

function showRoot(root: HTMLElement) {
  root.classList.add('isVisible');
  gsap.set(root, { autoAlpha: 1, immediateRender: true });
}

function hideRoot(root: HTMLElement) {
  root.classList.remove('isVisible');
  gsap.set(root, { autoAlpha: 0, immediateRender: true });
}

function screenScale(root: HTMLElement) {
  return root.clientWidth / 1833 || 1;
}

/**
 * Pixel offset from each metric card’s center → Sharpness ring center,
 * expressed as GSAP xPercent/yPercent of that card (scale-invariant as the
 * phone resizes). Forces settled phase-1 layout for measurement because the
 * timeline is built while cards may still sit at entrance y-offsets.
 */
function measureCollapseTargets(els: PhoneHomeUiElements) {
  const backups = els.metricRoots.map((root) => ({
    x: gsap.getProperty(root, 'x') as number,
    y: gsap.getProperty(root, 'y') as number,
    xPercent: gsap.getProperty(root, 'xPercent') as number,
    yPercent: gsap.getProperty(root, 'yPercent') as number,
    scale: gsap.getProperty(root, 'scale') as number,
  }));
  const sharpBackup = {
    x: gsap.getProperty(els.sharpnessRoot, 'x') as number,
    y: gsap.getProperty(els.sharpnessRoot, 'y') as number,
    scale: gsap.getProperty(els.sharpnessRoot, 'scale') as number,
  };

  els.metricRoots.forEach((root) => {
    gsap.set(root, { x: 0, y: 0, xPercent: 0, yPercent: 0, scale: 1 });
  });
  gsap.set(els.sharpnessRoot, {
    x: 0,
    y: 0,
    scale: PHONE_UI_SHARPNESS.startScale,
  });

  const sharpRing =
    (els.sharpnessRoot.querySelector('[class*="ringWrap"]') as HTMLElement | null) ??
    els.sharpnessRoot;
  const sharpBox = sharpRing.getBoundingClientRect();
  const targetX = sharpBox.left + sharpBox.width / 2;
  const targetY = sharpBox.top + sharpBox.height / 2;

  const targets = els.metricRoots.map((root, i) => {
    const box = root.getBoundingClientRect();
    const w = box.width || 1;
    const h = box.height || 1;
    if (box.width < 2 || box.height < 2 || sharpBox.width < 2) {
      const approx = [110, 0, -110][i] ?? 0;
      return { xPercent: approx, yPercent: -8 };
    }
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    return {
      xPercent: ((targetX - cx) / w) * 100,
      yPercent: ((targetY - cy) / h) * 100,
    };
  });

  els.metricRoots.forEach((root, i) => gsap.set(root, backups[i]));
  gsap.set(els.sharpnessRoot, sharpBackup);

  return targets;
}

/** Instant resting / reduced-motion end state = after calendar morph. */
export function setPhoneUiFinal(els: PhoneHomeUiElements) {
  ensurePhoneUiEases();
  showRoot(els.root);
  const scale = screenScale(els.root);
  const targets = measureCollapseTargets(els);

  PHONE_UI_METRICS.forEach((m, i) => {
    const t = targets[i];
    gsap.set(els.metricRoots[i], {
      opacity: 0,
      visibility: 'hidden',
      x: 0,
      y: 0,
      xPercent: t.xPercent,
      yPercent: t.yPercent,
      scale: PHASE2_COLLAPSE.endScale,
      transformOrigin: '50% 50%',
    });
    els.valueEls[i].textContent = String(m.to);
    gsap.set(els.progressEls[i], {
      strokeDashoffset: dashOffset(els.circumferences[i], m.to),
    });
  });

  gsap.set(els.sharpnessRoot, {
    autoAlpha: 0,
    x: 0,
    y: PHONE_UI_CALENDAR.arcEndYPx * scale,
    scale: PHONE_UI_SHARPNESS.endScale * PHONE_UI_CALENDAR.sharpEndScaleMul,
    transformOrigin: '50% 50%',
  });
  gsap.set(els.sharpnessRingWrap, { scaleX: 1, scaleY: 1, transformOrigin: '50% 50%' });
  gsap.set(els.sharpnessTrack, { scaleX: 1, scaleY: 1, transformOrigin: '50% 50%' });
  gsap.set([els.sharpnessValueWrap, els.sharpnessLabel, els.sharpnessTrack], {
    opacity: 0,
  });
  els.sharpnessValue.textContent = String(PHONE_UI_SHARPNESS.to);
  gsap.set(els.sharpnessProgress, {
    opacity: 0,
    strokeDashoffset: dashOffset(els.sharpnessCircumference, PHONE_UI_SHARPNESS.to),
  });

  gsap.set(els.calendarRoot, {
    autoAlpha: 1,
    x: 0,
    y: PHONE_UI_CALENDAR.cardToYPx * scale,
    scale: PHONE_UI_CALENDAR.cardToScale,
    transformOrigin: '50% 50%',
  });
  const layerOpacities = [
    PHONE_UI_CALENDAR.layer1Opacity,
    PHONE_UI_CALENDAR.layer2Opacity,
    PHONE_UI_CALENDAR.layer3Opacity,
  ];
  els.calLayers.forEach((layer, i) => {
    gsap.set(layer, { opacity: layerOpacities[i] });
  });
  gsap.set(els.calGreen, {
    opacity: 0.85,
    strokeDashoffset: dashOffset(els.calGreenCircumference, els.calGreenPct),
  });
  gsap.set(els.recommendRoot, {
    autoAlpha: 1,
    x: 0,
    y: 0,
  });
}

/** Hidden while hero-bg is the phone screen (pre–title-fade / scroll-back). */
export function setPhoneUiInitial(els: PhoneHomeUiElements) {
  ensurePhoneUiEases();
  hideRoot(els.root);
  const scale = screenScale(els.root);

  PHONE_UI_METRICS.forEach((m, i) => {
    gsap.set(els.metricRoots[i], {
      opacity: 0,
      visibility: 'visible',
      x: 0,
      y: m.yPx * scale,
      xPercent: 0,
      yPercent: 0,
      scale: 1,
      transformOrigin: '50% 50%',
    });
    els.valueEls[i].textContent = String(m.from);
    gsap.set(els.progressEls[i], {
      strokeDashoffset: dashOffset(els.circumferences[i], m.from),
    });
  });

  gsap.set(els.sharpnessRoot, {
    autoAlpha: 0,
    x: 0,
    y: PHONE_UI_SHARPNESS.startYPx * scale,
    scale: PHONE_UI_SHARPNESS.startScale,
    transformOrigin: '50% 50%',
  });
  gsap.set(els.sharpnessRingWrap, { scaleX: 1, scaleY: 1, transformOrigin: '50% 50%' });
  gsap.set(els.sharpnessTrack, { scaleX: 1, scaleY: 1, transformOrigin: '50% 50%' });
  gsap.set([els.sharpnessValueWrap, els.sharpnessLabel, els.sharpnessTrack], {
    opacity: 1,
  });
  els.sharpnessValue.textContent = String(PHONE_UI_SHARPNESS.from);
  gsap.set(els.sharpnessProgress, {
    opacity: 1,
    strokeDashoffset: dashOffset(els.sharpnessCircumference, PHONE_UI_SHARPNESS.from),
  });

  gsap.set(els.calendarRoot, {
    autoAlpha: 0,
    x: 0,
    y: PHONE_UI_CALENDAR.cardFromYPx * scale,
    scale: PHONE_UI_CALENDAR.cardFromScale,
    transformOrigin: '50% 50%',
  });
  els.calLayers.forEach((layer) => gsap.set(layer, { opacity: 0 }));
  gsap.set(els.calGreen, {
    opacity: 0.85,
    strokeDashoffset: els.calGreenCircumference,
  });
  gsap.set(els.recommendRoot, {
    autoAlpha: 0,
    x: 0,
    y: PHONE_UI_CALENDAR.recommendFromYPx * scale,
  });
}

/**
 * Scroll-scrubbed in-phone UI sequence (rings → Sharpness → calendar).
 * `scrubDuration` is in parent ScrollTrigger timeline units.
 * Pass `phase12Duration` to keep phases 1+2 paced exactly as before
 * (screenshot pose → Meet Sharpness) while phase 3 fills the remainder
 * through peek hold.
 */
export function buildPhoneUiTimeline(
  els: PhoneHomeUiElements,
  scrubDuration: number,
  options?: { phase12Duration?: number },
): gsap.core.Timeline {
  ensurePhoneUiEases();
  const scale = screenScale(els.root);
  const tl = gsap.timeline();

  // Phases 1+2 keep their relative Figma pacing inside phase12Duration
  // (defaults to full scrub when no phase 3 window is provided).
  const phase12Duration = Math.min(
    scrubDuration,
    options?.phase12Duration ?? scrubDuration,
  );
  const p1Dur = phase12Duration * (PHONE_UI_PHASE1_WEIGHT / PHONE_UI_PHASE12_WEIGHT);
  const p2Dur = phase12Duration * (PHONE_UI_PHASE2_WEIGHT / PHONE_UI_PHASE12_WEIGHT);
  const p2 = p1Dur;
  const p3 = phase12Duration;
  const p3Dur = Math.max(0, scrubDuration - phase12Duration);
  const minDur = Math.max(0.001, scrubDuration * 0.002);
  const p1TimeScale = p1Dur / PHONE_UI_PHASE1_WEIGHT;

  // Screen switch: dark home UI replaces hero-bg as soon as scrub enters this window.
  // fromTo (not set/call) so reverse scrub restores hero-bg cleanly.
  tl.fromTo(
    els.root,
    { autoAlpha: 0 },
    {
      autoAlpha: 1,
      duration: minDur,
      ease: 'none',
      immediateRender: false,
      onStart: () => {
        els.root.classList.add('isVisible');
      },
      onReverseComplete: () => {
        els.root.classList.remove('isVisible');
        gsap.set(els.root, { autoAlpha: 0 });
      },
    },
    0,
  );

  // ── Phase 1: rings entrance (Figma proportions, scrub units) ────────────
  PHONE_UI_METRICS.forEach((m, i) => {
    const start = m.holdUntil * p1Dur;
    const duration = Math.max(minDur, (m.settleAt - m.holdUntil) * p1Dur);
    const root = els.metricRoots[i];
    const valueEl = els.valueEls[i];
    const progressEl = els.progressEls[i];
    const circ = els.circumferences[i];
    const proxy = { v: m.from };
    const opacityEase = resolveEase(m.opacityEase);
    const yEase = resolveEase(m.yEase);
    const ringEase = resolveEase('phoneUiRing');

    tl.set(
      root,
      {
        visibility: 'visible',
        opacity: 0,
        x: 0,
        y: m.yPx * scale,
        xPercent: 0,
        yPercent: 0,
        scale: 1,
        transformOrigin: '50% 50%',
      },
      start,
    );
    tl.to(root, { opacity: 1, duration, ease: opacityEase }, start);
    tl.to(root, { y: 0, duration, ease: yEase }, start);

    const countDur = Math.min(0.85 * p1TimeScale, duration + 0.35 * p1TimeScale);
    tl.to(
      proxy,
      {
        v: m.to,
        duration: Math.max(minDur, countDur),
        ease: ringEase,
        onUpdate: () => {
          const v = proxy.v;
          valueEl.textContent = String(Math.round(v));
          progressEl.style.strokeDashoffset = String(dashOffset(circ, v));
        },
      },
      start,
    );
  });

  // Keep Sharpness parked invisible at the merge point through phase 1.
  tl.set(
    els.sharpnessRoot,
    {
      autoAlpha: 0,
      x: 0,
      y: PHONE_UI_SHARPNESS.startYPx * scale,
      scale: PHONE_UI_SHARPNESS.startScale,
      transformOrigin: '50% 50%',
    },
    0,
  );
  tl.set(
    [els.sharpnessValueWrap, els.sharpnessLabel, els.sharpnessTrack, els.sharpnessProgress],
    { opacity: 1 },
    0,
  );
  tl.set(
    els.calendarRoot,
    {
      autoAlpha: 0,
      x: 0,
      y: PHONE_UI_CALENDAR.cardFromYPx * scale,
      scale: PHONE_UI_CALENDAR.cardFromScale,
      transformOrigin: '50% 50%',
    },
    0,
  );
  tl.set(els.calLayers, { opacity: 0 }, 0);
  tl.set(
    els.calGreen,
    { opacity: 0.85, strokeDashoffset: els.calGreenCircumference },
    0,
  );
  tl.set(
    els.recommendRoot,
    {
      autoAlpha: 0,
      x: 0,
      y: PHONE_UI_CALENDAR.recommendFromYPx * scale,
    },
    0,
  );

  // ── Phase 2: collapse to a point → Sharpness expands (scrub units) ─────
  const collapseEase = resolveEase('phoneUiExit');
  const collapseMoveEase = resolveEase('phoneUiExitMove');
  const sharpEase = resolveEase('phoneUiSharpEnter');
  const ringEase = resolveEase('phoneUiRing');
  const targets = measureCollapseTargets(els);

  const collapseStart = p2 + PHASE2_COLLAPSE.hold * p2Dur;
  const collapseDur = Math.max(
    minDur,
    (PHASE2_COLLAPSE.end - PHASE2_COLLAPSE.hold) * p2Dur,
  );

  els.metricRoots.forEach((root, i) => {
    const t = targets[i];

    // Reset any leftover transforms from earlier builds / final-state sets.
    tl.set(
      root,
      { x: 0, y: 0, xPercent: 0, yPercent: 0, scale: 1, opacity: 1, visibility: 'visible' },
      collapseStart,
    );

    // Whole card (ring + number + % + label) fades and collapses together.
    tl.to(root, { opacity: 0, duration: collapseDur, ease: collapseEase }, collapseStart);
    tl.to(
      root,
      {
        scale: PHASE2_COLLAPSE.endScale,
        xPercent: t.xPercent,
        yPercent: t.yPercent,
        duration: collapseDur,
        ease: collapseMoveEase,
        transformOrigin: '50% 50%',
      },
      collapseStart,
    );

    tl.set(root, { visibility: 'hidden' }, collapseStart + collapseDur);
  });

  const sharpStart = p2 + PHONE_UI_SHARPNESS.holdUntil * p2Dur;
  const sharpDur = Math.max(
    minDur,
    (PHONE_UI_SHARPNESS.settleAt - PHONE_UI_SHARPNESS.holdUntil) * p2Dur,
  );
  const sharpProxy = { v: PHONE_UI_SHARPNESS.from };

  // Stay fully hidden until the handoff beat, then grow from the same center.
  tl.set(
    els.sharpnessRoot,
    {
      autoAlpha: 0,
      x: 0,
      y: PHONE_UI_SHARPNESS.startYPx * scale,
      scale: PHONE_UI_SHARPNESS.startScale,
      transformOrigin: '50% 50%',
    },
    p2,
  );
  tl.set(
    els.sharpnessRoot,
    {
      autoAlpha: 0,
      scale: PHONE_UI_SHARPNESS.startScale,
      transformOrigin: '50% 50%',
    },
    sharpStart,
  );
  tl.to(
    els.sharpnessRoot,
    { autoAlpha: 1, duration: sharpDur * 0.35, ease: sharpEase },
    sharpStart,
  );
  tl.to(
    els.sharpnessRoot,
    {
      scale: PHONE_UI_SHARPNESS.endScale,
      y: PHONE_UI_SHARPNESS.endYPx * scale,
      duration: sharpDur,
      ease: sharpEase,
      transformOrigin: '50% 50%',
    },
    sharpStart,
  );
  const updateSharpValue = () => {
    const v = sharpProxy.v;
    els.sharpnessValue.textContent = String(Math.round(v));
    els.sharpnessProgress.style.strokeDashoffset = String(
      dashOffset(els.sharpnessCircumference, v),
    );
  };

  // Value 0→48 with the ring expand; 48→58 finishes during Meet Sharpness.
  tl.to(
    sharpProxy,
    {
      v: PHONE_UI_SHARPNESS.mid,
      duration: sharpDur,
      ease: ringEase,
      onUpdate: updateSharpValue,
    },
    sharpStart,
  );
  const valueTailStart = sharpStart + sharpDur;
  const valueTailEnd =
    p2 + PHONE_UI_SHARPNESS.valueSettleAt * p2Dur;
  const valueTailDur = Math.max(minDur, valueTailEnd - valueTailStart);
  tl.to(
    sharpProxy,
    {
      v: PHONE_UI_SHARPNESS.to,
      duration: valueTailDur,
      ease: ringEase,
      onUpdate: updateSharpValue,
    },
    valueTailStart,
  );

  // Hold Sharpness at 58% through the rest of phase 12 when phase 3 follows.
  const phase2HoldEnd = phase12Duration;
  if (tl.duration() < phase2HoldEnd) {
    tl.to({}, { duration: phase2HoldEnd - tl.duration() });
  }

  // ── Phase 3: Sharpness → calendar card (Figma 1330:856) ────────────────
  if (p3Dur > minDur) {
    const cal = PHONE_UI_CALENDAR;
    const calCardEase = resolveEase('phoneUiCalCard');
    const calLayerEase = resolveEase('phoneUiCalLayer');
    const calSharpEase = resolveEase('phoneUiCalSharp');
    const calRecEase = resolveEase('phoneUiCalRecommend');
    const p3t = (frac: number) => p3 + frac * p3Dur;
    const p3d = (from: number, to: number) => Math.max(minDur, (to - from) * p3Dur);

    // 1–2. Sharpness continues opening / drifting into the card space.
    tl.to(
      els.sharpnessRoot,
      {
        scale: PHONE_UI_SHARPNESS.endScale * cal.sharpEndScaleMul,
        y: cal.sharpEndYPx * scale,
        duration: p3d(cal.sharpContinueStart, cal.sharpContinueEnd),
        ease: calSharpEase,
        transformOrigin: '50% 50%',
      },
      p3t(cal.sharpContinueStart),
    );
    tl.to(
      els.sharpnessValueWrap,
      {
        opacity: 0,
        duration: p3d(cal.valueFadeStart, cal.valueFadeEnd),
        ease: calLayerEase,
      },
      p3t(cal.valueFadeStart),
    );
    tl.to(
      els.sharpnessTrack,
      {
        opacity: 0,
        duration: p3d(cal.trackFadeStart, cal.trackFadeEnd),
        ease: calLayerEase,
      },
      p3t(cal.trackFadeStart),
    );
    tl.to(
      els.sharpnessLabel,
      {
        opacity: 0,
        duration: p3d(cal.labelFadeStart, cal.labelFadeEnd),
        ease: calLayerEase,
      },
      p3t(cal.labelFadeStart),
    );

    // 2. Sharpness ring opens into a wide bottom arc (same object → card viz).
    const arcProxy = { t: 0 };
    tl.to(
      arcProxy,
      {
        t: 1,
        duration: p3d(cal.arcOpenStart, cal.arcOpenEnd),
        ease: calSharpEase,
        onUpdate: () => applySharpnessArcMorph(els, arcProxy.t, cal.arcPctEnd),
      },
      p3t(cal.arcOpenStart),
    );
    tl.to(
      els.sharpnessRoot,
      {
        y: cal.arcEndYPx * scale,
        duration: p3d(cal.arcOpenStart, cal.arcOpenEnd),
        ease: calSharpEase,
        transformOrigin: '50% 50%',
      },
      p3t(cal.arcOpenStart),
    );

    // 3–4. Calendar card fades/scales in behind the evolving arc.
    tl.fromTo(
      els.calendarRoot,
      {
        autoAlpha: 0,
        scale: cal.cardFromScale,
        y: cal.cardFromYPx * scale,
      },
      {
        autoAlpha: 1,
        scale: cal.cardToScale,
        y: cal.cardToYPx * scale,
        duration: p3d(cal.cardStart, cal.cardEnd),
        ease: calCardEase,
        transformOrigin: '50% 50%',
        immediateRender: false,
      },
      p3t(cal.cardStart),
    );

    // Sharpness filled arc hands off into the card viz — reset flatten transforms.
    tl.set(
      els.sharpnessRingWrap,
      { scaleX: 1, scaleY: 1, transformOrigin: '50% 50%' },
      p3t(cal.sharpExitStart),
    );
    tl.set(
      els.sharpnessTrack,
      { scaleX: 1, scaleY: 1, transformOrigin: '50% 50%' },
      p3t(cal.sharpExitStart),
    );
    tl.to(
      els.sharpnessProgress,
      {
        opacity: 0,
        duration: p3d(cal.sharpExitStart, cal.sharpExitEnd),
        ease: calSharpEase,
      },
      p3t(cal.sharpExitStart),
    );
    tl.to(
      els.sharpnessRoot,
      {
        autoAlpha: 0,
        duration: p3d(cal.sharpExitStart, cal.sharpExitEnd),
        ease: calLayerEase,
      },
      p3t(cal.sharpExitStart),
    );

    // 5. Concentric layers appear back → front.
    const layerTargets = [
      { el: els.calLayers[0], start: cal.layer1Start, end: cal.layer1End, op: cal.layer1Opacity },
      { el: els.calLayers[1], start: cal.layer2Start, end: cal.layer2End, op: cal.layer2Opacity },
      { el: els.calLayers[2], start: cal.layer3Start, end: cal.layer3End, op: cal.layer3Opacity },
    ];
    layerTargets.forEach(({ el, start, end, op }) => {
      tl.fromTo(
        el,
        { opacity: 0 },
        {
          opacity: op,
          duration: p3d(start, end),
          ease: calLayerEase,
          immediateRender: false,
        },
        p3t(start),
      );
    });

    // 6. Green progress segment settles on the outer ring.
    const greenProxy = { v: 0 };
    tl.to(
      greenProxy,
      {
        v: els.calGreenPct,
        duration: p3d(cal.greenStart, cal.greenEnd),
        ease: resolveEase('phoneUiRing'),
        onUpdate: () => {
          els.calGreen.style.strokeDashoffset = String(
            dashOffset(els.calGreenCircumference, greenProxy.v),
          );
        },
      },
      p3t(cal.greenStart),
    );
    tl.fromTo(
      els.calGreen,
      { opacity: 0 },
      {
        opacity: 0.85,
        duration: p3d(cal.greenStart, cal.greenStart + 0.08),
        ease: calLayerEase,
        immediateRender: false,
      },
      p3t(cal.greenStart),
    );

    // 7. Recommendation strip fades + slides up.
    tl.fromTo(
      els.recommendRoot,
      {
        autoAlpha: 0,
        y: cal.recommendFromYPx * scale,
      },
      {
        autoAlpha: 1,
        y: 0,
        duration: p3d(cal.recommendStart, cal.recommendEnd),
        ease: calRecEase,
        immediateRender: false,
      },
      p3t(cal.recommendStart),
    );
  }

  // Pad to full scrub window (phase 12 end or phase 3 end).
  if (tl.duration() < scrubDuration) {
    tl.to({}, { duration: scrubDuration - tl.duration() });
  }

  return tl;
}
