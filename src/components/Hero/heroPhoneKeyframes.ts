/**
 * Figma Desktop "Scroll 1"–"Scroll 6" Hero camera pull-back.
 *
 * Source: Whoop — IN / Development / Desktop
 * Reference viewports: 1440×768 (Scroll 1–5), 1440×1000 (Scroll 6).
 *
 * Mobile keyframes: Whoop — IN / Development / Mobile (1175:10638)
 * Reference viewports: 375×812 (Scroll 1–4), 375×768 (Scroll 5–6).
 *
 * Phone values are viewport-relative:
 * - widthRatio  = device width / viewport width
 * - heightRatio = device height / viewport height (preferred when set)
 * - cx          = device center X / viewport width
 * - topRatio    = device top / viewport height
 *
 * Scroll 6 peek is the final locked size + composition. After a short hold,
 * a reveal scrub brings the full phone on-screen, HERO_PHONE_FULL_HOLD_VH
 * keeps it there briefly, then HERO_COVER_VH keeps the pin while Block 2
 * slides over (Banners −100vh).
 *
 * Frame selection (`isHeroPhoneMobileViewport`):
 * - phones (any orientation) → mobile keyframes
 * - portrait tablet → mobile keyframes
 * - landscape tablet / desktop → desktop keyframes (exact HEAD path)
 *
 * Tweak freely after review — the scrub timeline reads this array in order.
 */
export type HeroPhoneKeyframe = {
  id:
    | 'scroll-1'
    | 'scroll-2'
    | 'scroll-3'
    | 'scroll-4'
    | 'scroll-5'
    | 'scroll-6-peek';
  note: string;
  widthRatio: number;
  /** When set, height is derived from viewport height (Figma S6 uses this). */
  heightRatio?: number;
  cx: number;
  topRatio: number;
};

/** Device frame aspect from Figma (~317×646). */
export const HERO_PHONE_ASPECT = 0.491;

/** CSS phone / narrow breakpoint (portrait phones + small portrait tablets). */
export const HERO_PHONE_MOBILE_MAX_WIDTH = 767;

/**
 * True phone short-edge ceiling — keeps phone-landscape on the mobile frame
 * even when CSS width exceeds 767.
 */
const HERO_PHONE_SHORT_EDGE_MAX = 500;

/**
 * Mobile-frame keyframes when:
 * - true phone (short edge ≤ 500) in any orientation, or
 * - CSS width ≤ 767, or
 * - portrait tablet (width ≥ 768 and height > width).
 * Landscape tablet + desktop → desktop frame (never mobile).
 */
export function isHeroPhoneMobileViewport(
  width = typeof window !== 'undefined' ? window.innerWidth : 1440,
  height = typeof window !== 'undefined' ? window.innerHeight : 900,
) {
  if (Math.min(width, height) <= HERO_PHONE_SHORT_EDGE_MAX) return true;
  if (width <= HERO_PHONE_MOBILE_MAX_WIDTH) return true;
  return height > width;
}

/**
 * Scroll distance per scale keyframe segment, in viewport heights.
 * Compressed so Scroll 1 → centered final phone lands in ~1 viewport of scrub
 * (5 segments ≈ 0.93vh). Tweens/keyframes unchanged — only scrub length.
 */
export const HERO_PHONE_SEGMENT_VH = 0.55;

/**
 * Brief hold at the locked peek composition before the pin releases.
 */
export const HERO_PHONE_HOLD_VH = 0.2;

/**
 * Scroll after peek freeze / before Block 2 cover so the phone bottom can enter
 * the viewport. Peek sits at topRatio + heightRatio ≈ 1.3vh — the overflow past
 * 1vh must clear before Banners’ −100vh cover engages.
 */
export const HERO_PHONE_REVEAL_PAD_VH = 0.04;

/**
 * Hold after the full phone is on-screen, before Block 2 cover begins.
 * Keeps the phone composition locked a beat longer without extending reveal Y.
 */
export const HERO_PHONE_FULL_HOLD_VH = 0.25;

/**
 * Extra sticky track after the phone timeline so the Banners panel can slide
 * up and cover the Hero (whoop.com-style). Matched by Banners’ negative margin.
 * Kept as a pin-tail so the cover still reads while the stage is held.
 */
export const HERO_COVER_VH = 1;

/**
 * Beige stage color from Figma Scroll 2–5 (`bg-[#e4d7c6]`).
 * Scroll 6 adds a cream gradient toward `#f9f3ec`.
 */
export const HERO_STAGE_BEIGE = '#e4d7c6';
export const HERO_STAGE_CREAM = '#f9f3ec';

/**
 * Final locked phone size (enlarged vs Figma Scroll 6 317.2×646 / 1440×1000).
 * widthRatio kept in sync for the same 1440×1000 reference:
 * heightRatio × (1000/1440) × HERO_PHONE_ASPECT.
 */
const FINAL_HEIGHT_RATIO = 0.84;
const FINAL_WIDTH_RATIO = 0.2864;

/** Rings pose — framed phone size (also used for Meet Sharpness; only Y changes). */
const MOBILE_RINGS_WIDTH_RATIO = 0.94;
/**
 * Vertical position so “Strain” sits ~60px above the viewport bottom
 * (375×812 reference; size unchanged). Leaves clear beige above the device.
 */
const MOBILE_RINGS_TOP_RATIO = 0.209;

/**
 * Meet Sharpness → Dynamic score lock: same size as rings, shifted down ~80px.
 * Identical for scroll-5 and peek so scale/position stay fixed across headings.
 */
const MOBILE_FINAL_WIDTH_RATIO = MOBILE_RINGS_WIDTH_RATIO;
const MOBILE_FINAL_TOP_RATIO = MOBILE_RINGS_TOP_RATIO + 80 / 812;
/** Height/vh for sticky + reveal when size is width-driven (375×812 reference). */
const MOBILE_FINAL_HEIGHT_RATIO =
  (MOBILE_RINGS_WIDTH_RATIO / HERO_PHONE_ASPECT) * (375 / 812);

/** Desktop keyframes — exact values from git HEAD (0eb3579). */
export const HERO_PHONE_KEYFRAMES: HeroPhoneKeyframe[] = [
  {
    id: 'scroll-1',
    note:
      'Figma Scroll 1 has no phone — hero-bg is full-bleed at scale 1; phone starts off-chrome',
    widthRatio: 1.35,
    cx: 0.5,
    // Top stays ≤ 0 so the oversized clip still covers the viewport.
    topRatio: -0.38,
  },
  {
    id: 'scroll-2',
    note:
      'Figma 1175:10036 size — Y midpoint bridge scroll-1→3 (monotonic down; scale unchanged)',
    widthRatio: 0.9338,
    cx: 0.4996,
    // Midpoint between scroll-1 (-0.38) and scroll-3 (0.0972) so first two
    // steps only move down — no reverse up at the end of step 2.
    topRatio: -0.1414,
  },
  {
    id: 'scroll-3',
    note:
      'Figma 1175:10050 size — end of second scrub step (scale / final Y unchanged)',
    widthRatio: 0.5663,
    cx: 0.4996,
    // Final Y of first two steps; scroll-4+ tops unchanged.
    topRatio: 0.0972,
  },
  {
    id: 'scroll-4',
    note: 'Figma 1175:10103 — 494.9×1008 at (471.9, 272.7) in 1440×768',
    widthRatio: 0.3437,
    cx: 0.4996,
    topRatio: 0.355,
  },
  {
    id: 'scroll-5',
    note: 'Figma 1175:10155 — 368.2×750 at (535.2, 272.7) in 1440×768',
    widthRatio: 0.2557,
    cx: 0.4996,
    topRatio: 0.355,
  },
  {
    id: 'scroll-6-peek',
    note:
      'Final size + composition lock — top under headline; hold → reveal → cover pin-tail; Banners slide over',
    widthRatio: FINAL_WIDTH_RATIO,
    heightRatio: FINAL_HEIGHT_RATIO,
    cx: 0.4996,
    // Under secondary headline; bottom peeks past fold (sticky = top + height ≈ 1.3vh).
    topRatio: 0.46,
  },
];

/**
 * Mobile entrance → locked Sharpness composition.
 *
 * Same camera-pullback idea as desktop: Scroll 1 is an oversized phone window
 * into the hero crop. Scaling down reveals the device around that content.
 *
 * Rings → Meet Sharpness: same size, only a ~80px downward shift so the heading
 * fits and the Sharpness ring stays in view. Locked through remaining headings.
 */
export const MOBILE_HERO_PHONE_KEYFRAMES: HeroPhoneKeyframe[] = [
  {
    id: 'scroll-1',
    note:
      'Hero close-up — oversized phone windows the hero video (same concept as desktop scroll-1)',
    widthRatio: 1.55,
    cx: 0.5,
    topRatio: -0.35,
  },
  {
    id: 'scroll-2',
    note:
      'Bridge scale; Y keeps phone center between scroll-1 and rings (no reverse up-wave)',
    widthRatio: 572.8205 / 375,
    cx: 0.5,
    // Center-bridge on 375×812 vs rings pose (0.94 @ 0.209).
    topRatio: -0.21,
  },
  {
    id: 'scroll-3',
    note: 'Rings pose — large framed phone; bottom may crop; UI scrub starts',
    widthRatio: MOBILE_RINGS_WIDTH_RATIO,
    cx: 0.5,
    topRatio: MOBILE_RINGS_TOP_RATIO,
  },
  {
    id: 'scroll-4',
    note: 'Hold rings pose; Y-only drop to Meet Sharpness (same size)',
    widthRatio: MOBILE_RINGS_WIDTH_RATIO,
    cx: 0.5,
    topRatio: MOBILE_RINGS_TOP_RATIO,
  },
  {
    id: 'scroll-5',
    note: 'Meet Sharpness — same size as rings, ~80px lower; locked thereafter',
    widthRatio: MOBILE_FINAL_WIDTH_RATIO,
    cx: 0.5,
    topRatio: MOBILE_FINAL_TOP_RATIO,
  },
  {
    id: 'scroll-6-peek',
    note: 'Identical to Scroll 5 — phone fixed while copy / in-phone UI continue',
    widthRatio: MOBILE_FINAL_WIDTH_RATIO,
    cx: 0.5,
    topRatio: MOBILE_FINAL_TOP_RATIO,
  },
];

export type HeroPhoneLayout = {
  width: number;
  height: number;
  left: number;
  top: number;
};

export function getHeroPhoneKeyframes(isMobile: boolean): readonly HeroPhoneKeyframe[] {
  return isMobile ? MOBILE_HERO_PHONE_KEYFRAMES : HERO_PHONE_KEYFRAMES;
}

/** Resolve a keyframe to a pixel box for the current viewport. */
export function layoutForKeyframe(
  kf: HeroPhoneKeyframe,
  viewportWidth: number,
  viewportHeight: number,
  /** When set, reuse this size (locked final size). */
  lockedSize?: { width: number; height: number },
): HeroPhoneLayout {
  let width: number;
  let height: number;

  if (lockedSize) {
    width = lockedSize.width;
    height = lockedSize.height;
  } else if (kf.heightRatio != null) {
    height = kf.heightRatio * viewportHeight;
    width = height * HERO_PHONE_ASPECT;
  } else {
    width = kf.widthRatio * viewportWidth;
    height = width / HERO_PHONE_ASPECT;
  }

  const top = kf.topRatio * viewportHeight;
  const left = kf.cx * viewportWidth - width / 2;

  return { width, height, left, top };
}

/** Size used once the phone reaches Scroll 6 peek (locked thereafter). */
export function finalPhoneSize(
  viewportHeight: number,
  isMobile = false,
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1440,
) {
  if (isMobile) {
    const width = MOBILE_RINGS_WIDTH_RATIO * viewportWidth;
    const height = width / HERO_PHONE_ASPECT;
    return { width, height };
  }
  // Desktop — exact HEAD formula (height-driven).
  const height = FINAL_HEIGHT_RATIO * viewportHeight;
  const width = height * HERO_PHONE_ASPECT;
  return { width, height };
}

/** Peek keyframe — final locked composition. */
export function peekKeyframe(isMobile = false): HeroPhoneKeyframe {
  const frames = getHeroPhoneKeyframes(isMobile);
  return frames[frames.length - 1];
}

/**
 * Sticky stage height in vh so the full peek phone fits in document flow.
 * Desktop matches git HEAD exactly (no Math.max floor).
 */
export function heroStickyVh(isMobile = false): number {
  const peek = peekKeyframe(isMobile);
  if (!isMobile) {
    return peek.topRatio + (peek.heightRatio ?? FINAL_HEIGHT_RATIO);
  }
  const heightRatio = peek.heightRatio ?? MOBILE_FINAL_HEIGHT_RATIO;
  return Math.max(1, peek.topRatio + heightRatio);
}

/**
 * Viewport-heights of peek phone that sit below the fold at freeze.
 * Desktop matches git HEAD (always includes reveal pad).
 */
export function heroPhoneRevealScrollVh(isMobile = false): number {
  if (!isMobile) {
    return Math.max(0, heroStickyVh(false) - 1) + HERO_PHONE_REVEAL_PAD_VH;
  }
  const overflow = Math.max(0, heroStickyVh(true) - 1);
  if (overflow === 0) return 0;
  return overflow + HERO_PHONE_REVEAL_PAD_VH;
}

/** Pin / scrub distance through scale → peek → hold → reveal → full-hold → cover (vh). */
export function heroPinVh(isMobile = false): number {
  const frames = getHeroPhoneKeyframes(isMobile);
  const peekIndex = frames.findIndex((k) => k.id === 'scroll-6-peek');
  return (
    HERO_PHONE_SEGMENT_VH * peekIndex +
    HERO_PHONE_HOLD_VH +
    heroPhoneRevealScrollVh(isMobile) +
    HERO_PHONE_FULL_HOLD_VH +
    HERO_COVER_VH
  );
}

/** Track contribution before pin spacer (sticky stage height). */
export function heroTrackVh(isMobile = false): number {
  return heroStickyVh(isMobile);
}
