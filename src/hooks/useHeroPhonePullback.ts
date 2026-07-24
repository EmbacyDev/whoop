import { useEffect, useRef, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  HERO_COVER_VH,
  HERO_PHONE_FULL_HOLD_VH,
  HERO_PHONE_HOLD_VH,
  HERO_PHONE_KEYFRAMES,
  HERO_PHONE_SEGMENT_VH,
  finalPhoneSize,
  getHeroPhoneKeyframes,
  heroPhoneRevealScrollVh,
  heroPinVh,
  heroStickyVh,
  isHeroPhoneMobileViewport,
  layoutForKeyframe,
  peekKeyframe,
  type HeroPhoneKeyframe,
  type HeroPhoneLayout,
} from '../components/Hero/heroPhoneKeyframes';
import type { PhoneHomeUIHandle } from '../components/Hero/PhoneHomeUI/PhoneHomeUI';
import {
  buildPhoneUiTimeline,
  phoneUiSharpnessRingScrubTime,
  setPhoneUiFinal,
  setPhoneUiInitial,
  PHONE_UI_MORPH_REV,
} from '../components/Hero/PhoneHomeUI/phoneHomeUiMotion';

gsap.registerPlugin(ScrollTrigger);

/**
 * Desktop phone / media / copy timeline = git HEAD (0eb3579) phone path.
 * Intro heading: scale 1→0.95 + fade in place on all frames.
 * PhoneHomeUI nests on that schedule without delaying phone segments.
 *
 * Mobile / portrait-tablet uses MOBILE_HERO_PHONE_KEYFRAMES with the
 * Sharpness-synced drop + Meet Sharpness hold (does not affect desktop).
 */
/**
 * Intro heading (all frames): scale starts immediately with scroll;
 * opacity is delayed so the title stays readable ~2.5× longer.
 * Previous combined fade ended at t=0.5 → opacity now completes at t=1.25.
 */
const COPY_INTRO_SCALE_START = 0;
const COPY_INTRO_SCALE_DURATION = 0.5;
/** Subtle shrink while scrolling (no Y drift). */
const COPY_INTRO_SCALE_END = 0.95;
/** Hold full opacity through the scale, then fade out (ends 2.5× later). */
const COPY_INTRO_OPACITY_START = 0.5;
const COPY_INTRO_OPACITY_DURATION = 0.75;

/** In-phone UI scrub begins at scroll-3 (t=2) on both paths. */
const PHONE_UI_START = 2;
const COPY_SHARPNESS_FADE_START = 4;
const PHONE_UI_PHASE12_DURATION = COPY_SHARPNESS_FADE_START - PHONE_UI_START;

/** Mobile-only: delay s4→s5 / peek for Sharpness ring sync. */
const PHONE_DROP_SEGMENT = 3;
const PHONE_PEEK_SEGMENT = 4;
const MEET_SHARPNESS_HOLD = 0.45;
const COPY_HANDOFF_DURATION = 0.35;

type UseHeroPhonePullbackOptions = {
  enabled: boolean;
  /**
   * Desktop scrub gate (HEAD default 768). Mobile / portrait-tablet scrub is
   * enabled separately via `isHeroPhoneMobileViewport` and does not use this.
   */
  minWidth?: number;
};

export type HeroPhonePullbackRefs = {
  trackRef: RefObject<HTMLElement>;
  stickyRef: RefObject<HTMLDivElement>;
  phoneRef: RefObject<HTMLDivElement>;
  phoneChromeRef: RefObject<HTMLDivElement>;
  scroll1ImageRef: RefObject<HTMLDivElement>;
  phoneHomeUiRef: RefObject<PhoneHomeUIHandle>;
  bgBeigeRef: RefObject<HTMLDivElement>;
  bgFinalRef: RefObject<HTMLDivElement>;
  copyIntroRef: RefObject<HTMLDivElement>;
  scrollIndicatorRef: RefObject<HTMLDivElement>;
  copySharpnessRef: RefObject<HTMLDivElement>;
  copyFinalRef: RefObject<HTMLDivElement>;
};

function applyLayout(
  phone: HTMLElement,
  kf: HeroPhoneKeyframe,
  lockedSize?: { width: number; height: number },
) {
  const { width, height, left, top } = layoutForKeyframe(
    kf,
    window.innerWidth,
    window.innerHeight,
    lockedSize,
  );
  gsap.set(phone, { width, height, left, top, x: 0, y: 0 });
}

function sizeVars(kf: HeroPhoneKeyframe) {
  return {
    width: () => layoutForKeyframe(kf, window.innerWidth, window.innerHeight).width,
    height: () => layoutForKeyframe(kf, window.innerWidth, window.innerHeight).height,
    left: () => layoutForKeyframe(kf, window.innerWidth, window.innerHeight).left,
    top: () => layoutForKeyframe(kf, window.innerWidth, window.innerHeight).top,
  };
}

/* ─── Desktop media box (exact HEAD) ─────────────────────────────────────── */

function resolveLayoutDesktop(kf: HeroPhoneKeyframe, lockedSize?: boolean): HeroPhoneLayout {
  return lockedSize
    ? layoutForKeyframe(
        kf,
        window.innerWidth,
        window.innerHeight,
        finalPhoneSize(window.innerHeight, false),
      )
    : layoutForKeyframe(kf, window.innerWidth, window.innerHeight);
}

function fullBleedInPhoneDesktop(layout: HeroPhoneLayout) {
  return {
    left: -layout.left,
    top: -layout.top,
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

function phoneFillBoxDesktop(layout: HeroPhoneLayout) {
  const insetX = layout.width * 0.02;
  const insetY = layout.height * 0.01;
  return {
    left: insetX,
    top: insetY,
    width: layout.width - insetX * 2,
    height: layout.height - insetY * 2,
  };
}

function mediaBoxDesktop(kf: HeroPhoneKeyframe, lockedSize?: boolean) {
  const layout = resolveLayoutDesktop(kf, lockedSize);
  if (lockedSize || kf.id === 'scroll-6-peek') return phoneFillBoxDesktop(layout);
  return fullBleedInPhoneDesktop(layout);
}

function imageBoxVarsDesktop(kf: HeroPhoneKeyframe, lockedSize?: boolean) {
  return {
    left: () => mediaBoxDesktop(kf, lockedSize).left,
    top: () => mediaBoxDesktop(kf, lockedSize).top,
    width: () => mediaBoxDesktop(kf, lockedSize).width,
    height: () => mediaBoxDesktop(kf, lockedSize).height,
    borderRadius: 0,
  };
}

/* ─── Mobile media box (mobile / portrait tablet only) ───────────────────── */

function resolveLayoutMobile(kf: HeroPhoneKeyframe, lockedSize?: boolean): HeroPhoneLayout {
  return lockedSize
    ? layoutForKeyframe(
        kf,
        window.innerWidth,
        window.innerHeight,
        finalPhoneSize(window.innerHeight, true),
      )
    : layoutForKeyframe(kf, window.innerWidth, window.innerHeight);
}

function fullBleedInPhoneMobile(layout: HeroPhoneLayout) {
  const viewLeft = -layout.left;
  const viewTop = -layout.top;
  const viewRight = viewLeft + window.innerWidth;
  const viewBottom = viewTop + window.innerHeight;
  const left = Math.min(0, viewLeft);
  const top = Math.min(0, viewTop);
  const right = Math.max(layout.width, viewRight);
  const bottom = Math.max(layout.height, viewBottom);
  return {
    left,
    top,
    width: right - left,
    height: bottom - top,
  };
}

function phoneFillBoxMobile(layout: HeroPhoneLayout) {
  const insetX = layout.width * 0.02;
  const insetY = layout.height * 0.01;
  return {
    left: insetX,
    top: insetY,
    width: layout.width - insetX * 2,
    height: layout.height - insetY,
  };
}

function mediaBoxMobile(kf: HeroPhoneKeyframe, lockedSize?: boolean) {
  const layout = resolveLayoutMobile(kf, lockedSize);
  if (lockedSize || kf.id === 'scroll-6-peek' || kf.id === 'scroll-5') {
    return phoneFillBoxMobile(layout);
  }
  return fullBleedInPhoneMobile(layout);
}

function imageBoxVarsMobile(kf: HeroPhoneKeyframe, lockedSize?: boolean) {
  return {
    left: () => mediaBoxMobile(kf, lockedSize).left,
    top: () => mediaBoxMobile(kf, lockedSize).top,
    width: () => mediaBoxMobile(kf, lockedSize).width,
    height: () => mediaBoxMobile(kf, lockedSize).height,
    borderRadius: '18% / 9%',
  };
}

/**
 * Sticky-track scrub through Figma Scroll 1→6 peek.
 *
 * Desktop: git HEAD phone / video / copy path (unmodified by mobile branches).
 * Mobile / portrait tablet: separate keyframes + media helpers + hold timing.
 * Landscape tablet reuses the desktop path.
 */
export function useHeroPhonePullback({
  enabled,
  minWidth = 768,
}: UseHeroPhonePullbackOptions): HeroPhonePullbackRefs {
  const trackRef = useRef<HTMLElement>(null!);
  const stickyRef = useRef<HTMLDivElement>(null!);
  const phoneRef = useRef<HTMLDivElement>(null!);
  const phoneChromeRef = useRef<HTMLDivElement>(null!);
  const scroll1ImageRef = useRef<HTMLDivElement>(null!);
  const phoneHomeUiRef = useRef<PhoneHomeUIHandle>(null!);
  const bgBeigeRef = useRef<HTMLDivElement>(null!);
  const bgFinalRef = useRef<HTMLDivElement>(null!);
  const copyIntroRef = useRef<HTMLDivElement>(null!);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null!);
  const copySharpnessRef = useRef<HTMLDivElement>(null!);
  const copyFinalRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    const track = trackRef.current;
    const sticky = stickyRef.current;
    const phone = phoneRef.current;
    const scroll1Image = scroll1ImageRef.current;
    if (!track || !sticky || !phone || !scroll1Image) return;

    const phoneChrome = phoneChromeRef.current;
    const bgBeige = bgBeigeRef.current;
    const bgFinal = bgFinalRef.current;
    const copyIntro = copyIntroRef.current;
    const scrollIndicator = scrollIndicatorRef.current;
    const copySharpness = copySharpnessRef.current;
    const copyFinal = copyFinalRef.current;

    const desktopWidthMq = window.matchMedia(`(min-width: ${minWidth}px)`);
    const orientationMq = window.matchMedia('(orientation: portrait)');
    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');

    let ctx: gsap.Context | undefined;

    const readPhoneUi = () => phoneHomeUiRef.current?.getElements() ?? null;

    const resetPhoneUi = () => {
      const els = readPhoneUi();
      if (els) setPhoneUiInitial(els);
    };

    const applyHeroFrameAttr = (isMobile: boolean) => {
      track.dataset.heroFrame = isMobile ? 'mobile' : 'desktop';
    };

    const clearScrubLayout = () => {
      track.style.removeProperty('--hero-track-vh');
      track.style.removeProperty('height');
      sticky.style.removeProperty('height');
      sticky.style.removeProperty('position');
      sticky.style.removeProperty('overflow');
    };

    const setRestingLayout = () => {
      clearScrubLayout();
      track.style.setProperty('--hero-track-vh', '100vh');
    };

    const setScrubLayout = (isMobile: boolean) => {
      sticky.style.position = 'relative';
      sticky.style.overflow = 'hidden';
      sticky.style.height = `${heroStickyVh(isMobile) * 100}vh`;
      track.style.height = 'auto';
      track.style.setProperty('--hero-track-vh', `${heroStickyVh(isMobile) * 100}vh`);
    };

    const setImageBoxDesktop = (kf: HeroPhoneKeyframe, locked?: boolean) => {
      const box = mediaBoxDesktop(kf, locked);
      gsap.set(scroll1Image, {
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
        borderRadius: 0,
        clipPath: 'none',
        x: 0,
        y: 0,
        scale: 1,
      });
    };

    const setImageBoxMobile = (kf: HeroPhoneKeyframe, locked?: boolean) => {
      const box = mediaBoxMobile(kf, locked);
      gsap.set(scroll1Image, {
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
        borderRadius: '18% / 9%',
        clipPath: 'none',
        x: 0,
        y: 0,
        scale: 1,
      });
    };

    const attachPhoneUi = (tl: gsap.core.Timeline, scrubDuration: number) => {
      const phoneUiEls = readPhoneUi();
      if (phoneUiEls) {
        setPhoneUiInitial(phoneUiEls);
        tl.add(
          buildPhoneUiTimeline(phoneUiEls, scrubDuration, {
            phase12Duration: PHONE_UI_PHASE12_DURATION,
          }),
          PHONE_UI_START,
        );
      } else {
        requestAnimationFrame(() => {
          const retry = readPhoneUi();
          if (!retry || !ctx) return;
          setPhoneUiInitial(retry);
          tl.add(
            buildPhoneUiTimeline(retry, scrubDuration, {
              phase12Duration: PHONE_UI_PHASE12_DURATION,
            }),
            PHONE_UI_START,
          );
          ScrollTrigger.refresh();
        });
      }
    };

    /** Desktop timeline — phone/media/copy match git HEAD; UI nests without delay. */
    const buildDesktopScrub = () => {
      const peek = peekKeyframe(false);
      setScrubLayout(false);
      applyLayout(phone, HERO_PHONE_KEYFRAMES[0]);

      if (bgBeige) gsap.set(bgBeige, { opacity: 1 });
      if (bgFinal) gsap.set(bgFinal, { opacity: 0 });
      if (copyIntro) {
        gsap.set(copyIntro, {
          opacity: 1,
          scale: 1,
          y: 0,
          transformOrigin: 'center center',
        });
      }
      if (scrollIndicator) gsap.set(scrollIndicator, { opacity: 1, transition: 'none' });
      if (copySharpness) gsap.set(copySharpness, { opacity: 0, y: 12 });
      if (copyFinal) gsap.set(copyFinal, { opacity: 0, y: 12 });
      if (phoneChrome) gsap.set(phoneChrome, { opacity: 0 });
      setImageBoxDesktop(HERO_PHONE_KEYFRAMES[0]);
      resetPhoneUi();

      const holdDuration = HERO_PHONE_HOLD_VH / HERO_PHONE_SEGMENT_VH;
      const revealDuration = heroPhoneRevealScrollVh(false) / HERO_PHONE_SEGMENT_VH;
      const fullHoldDuration = HERO_PHONE_FULL_HOLD_VH / HERO_PHONE_SEGMENT_VH;
      const coverDuration = HERO_COVER_VH / HERO_PHONE_SEGMENT_VH;
      const peekIndex = HERO_PHONE_KEYFRAMES.findIndex((k) => k.id === 'scroll-6-peek');
      const peekTweenStart = Math.max(peekIndex - 1, 0);
      const baseAfterPeek = peekIndex;
      const phoneUiEnd = baseAfterPeek + holdDuration;
      const phoneExitStart = phoneUiEnd;
      const afterPeek = phoneExitStart + 1;
      const phoneHoldOffset = afterPeek - baseAfterPeek;
      const phoneSegmentStart = (segmentIndex: number) =>
        segmentIndex === peekTweenStart ? phoneExitStart : segmentIndex;
      const pinDistance = () =>
        (heroPinVh(false) + phoneHoldOffset * HERO_PHONE_SEGMENT_VH) *
        window.innerHeight;
      const phoneUiScrubDuration = phoneUiEnd - PHONE_UI_START;

      ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: track,
            pin: sticky,
            pinSpacing: true,
            start: 'top top',
            end: () => `+=${pinDistance()}`,
            scrub: 0.8,
            invalidateOnRefresh: true,
            onRefresh: () => {
              sticky.style.height = `${heroStickyVh(false) * 100}vh`;
            },
          },
        });

        attachPhoneUi(tl, phoneUiScrubDuration);

        for (let i = 1; i <= peekIndex; i++) {
          tl.to(
            phone,
            {
              duration: 1,
              ease: 'none',
              immediateRender: false,
              ...sizeVars(HERO_PHONE_KEYFRAMES[i]),
            },
            phoneSegmentStart(i - 1),
          );
        }

        tl.to(
          scroll1Image,
          {
            duration: 1,
            ease: 'none',
            immediateRender: false,
            ...imageBoxVarsDesktop(HERO_PHONE_KEYFRAMES[1]),
          },
          0,
        );
        for (let i = 2; i <= peekIndex; i++) {
          tl.to(
            scroll1Image,
            {
              duration: 1,
              ease: 'none',
              immediateRender: false,
              ...imageBoxVarsDesktop(HERO_PHONE_KEYFRAMES[i]),
            },
            phoneSegmentStart(i - 1),
          );
        }

        if (phoneChrome) {
          tl.to(phoneChrome, { opacity: 1, duration: 0.75, ease: 'none' }, 0.08);
        }

        if (scrollIndicator) {
          tl.to(scrollIndicator, { opacity: 0, duration: 0.2, ease: 'none' }, 0);
        }

        if (bgFinal) {
          tl.to(bgFinal, { opacity: 1, duration: 0.7, ease: 'none' }, peekTweenStart);
        }

        if (copyIntro) {
          // Scale immediately; opacity delayed — fixed in place (no Y drift).
          tl.fromTo(
            copyIntro,
            { scale: 1, y: 0, transformOrigin: 'center center' },
            {
              scale: COPY_INTRO_SCALE_END,
              y: 0,
              duration: COPY_INTRO_SCALE_DURATION,
              ease: 'none',
              immediateRender: false,
            },
            COPY_INTRO_SCALE_START,
          );
          tl.fromTo(
            copyIntro,
            { opacity: 1 },
            {
              opacity: 0,
              duration: COPY_INTRO_OPACITY_DURATION,
              ease: 'none',
              immediateRender: false,
            },
            COPY_INTRO_OPACITY_START,
          );
        }
        if (copySharpness) {
          tl.fromTo(
            copySharpness,
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.55, ease: 'none' },
            2.85,
          );
          tl.to(
            copySharpness,
            { opacity: 0, y: -12, duration: 0.45, ease: 'none' },
            peekTweenStart - 0.15,
          );
        }
        if (copyFinal) {
          tl.fromTo(
            copyFinal,
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'none' },
            peekTweenStart,
          );
        }

        tl.call(
          () => {
            applyLayout(phone, peek, finalPhoneSize(window.innerHeight, false));
            setImageBoxDesktop(peek, true);
          },
          undefined,
          afterPeek,
        );
        tl.to({}, { duration: holdDuration }, afterPeek);
        tl.fromTo(
          sticky,
          { y: 0 },
          {
            y: () => -heroPhoneRevealScrollVh(false) * window.innerHeight,
            duration: revealDuration,
            ease: 'none',
            immediateRender: false,
          },
        );
        tl.to({}, { duration: fullHoldDuration });
        tl.to({}, { duration: coverDuration });
      }, track);
    };

    /** Mobile / portrait-tablet timeline — isolated from desktop helpers. */
    const buildMobileScrub = () => {
      const keyframes = getHeroPhoneKeyframes(true);
      const peek = peekKeyframe(true);
      setScrubLayout(true);
      applyLayout(phone, keyframes[0]);

      if (bgBeige) gsap.set(bgBeige, { opacity: 1 });
      if (bgFinal) gsap.set(bgFinal, { opacity: 0 });
      if (copyIntro) {
        gsap.set(copyIntro, {
          opacity: 1,
          scale: 1,
          y: 0,
          transformOrigin: 'center center',
        });
      }
      if (scrollIndicator) gsap.set(scrollIndicator, { opacity: 1, transition: 'none' });
      if (copySharpness) gsap.set(copySharpness, { opacity: 0, y: 0 });
      if (copyFinal) gsap.set(copyFinal, { opacity: 0, y: 0 });
      if (phoneChrome) gsap.set(phoneChrome, { opacity: 0 });
      setImageBoxMobile(keyframes[0]);
      resetPhoneUi();

      const holdDuration = HERO_PHONE_HOLD_VH / HERO_PHONE_SEGMENT_VH;
      const revealDuration = heroPhoneRevealScrollVh(true) / HERO_PHONE_SEGMENT_VH;
      const fullHoldDuration = HERO_PHONE_FULL_HOLD_VH / HERO_PHONE_SEGMENT_VH;
      const coverDuration = HERO_COVER_VH / HERO_PHONE_SEGMENT_VH;
      const peekIndex = keyframes.findIndex((k) => k.id === 'scroll-6-peek');
      const sharpnessRingStart = phoneUiSharpnessRingScrubTime(
        PHONE_UI_START,
        PHONE_UI_PHASE12_DURATION,
      );
      const dropEnd = sharpnessRingStart + 1;
      const meetHoldEnd = dropEnd + MEET_SHARPNESS_HOLD;
      const basePhoneSegmentStart = (segmentIndex: number) => {
        if (segmentIndex === PHONE_DROP_SEGMENT) return sharpnessRingStart;
        if (segmentIndex === PHONE_PEEK_SEGMENT) return meetHoldEnd;
        return segmentIndex;
      };
      const peekTweenStart = basePhoneSegmentStart(PHONE_PEEK_SEGMENT);
      const baseAfterPeek = meetHoldEnd + 1;
      const phoneUiEnd = baseAfterPeek + holdDuration;
      const phoneExitStart = phoneUiEnd;
      const phoneSegmentStart = (segmentIndex: number) =>
        segmentIndex === PHONE_PEEK_SEGMENT
          ? phoneExitStart
          : basePhoneSegmentStart(segmentIndex);
      const afterPeek = phoneExitStart + 1;
      const phoneDropOffset = afterPeek - peekIndex;
      const phoneUiScrubDuration = phoneUiEnd - PHONE_UI_START;
      const pinDistance = () =>
        (heroPinVh(true) + phoneDropOffset * HERO_PHONE_SEGMENT_VH) * window.innerHeight;

      ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: track,
            pin: sticky,
            pinSpacing: true,
            start: 'top top',
            end: () => `+=${pinDistance()}`,
            scrub: 0.8,
            invalidateOnRefresh: true,
            onRefresh: () => {
              sticky.style.height = `${heroStickyVh(true) * 100}vh`;
            },
          },
        });

        attachPhoneUi(tl, phoneUiScrubDuration);

        for (let i = 1; i <= peekIndex; i++) {
          tl.to(
            phone,
            {
              duration: 1,
              ease: 'none',
              immediateRender: false,
              ...sizeVars(keyframes[i]),
            },
            phoneSegmentStart(i - 1),
          );
        }

        tl.to(
          scroll1Image,
          {
            duration: 1,
            ease: 'none',
            immediateRender: false,
            ...imageBoxVarsMobile(keyframes[1]),
          },
          0,
        );
        for (let i = 2; i <= peekIndex; i++) {
          tl.to(
            scroll1Image,
            {
              duration: 1,
              ease: 'none',
              immediateRender: false,
              ...imageBoxVarsMobile(keyframes[i]),
            },
            phoneSegmentStart(i - 1),
          );
        }

        if (phoneChrome) {
          tl.to(phoneChrome, { opacity: 1, duration: 0.75, ease: 'none' }, 0.08);
        }

        if (scrollIndicator) {
          tl.to(scrollIndicator, { opacity: 0, duration: 0.2, ease: 'none' }, 0);
        }

        if (bgFinal) {
          tl.to(bgFinal, { opacity: 1, duration: 0.7, ease: 'none' }, peekTweenStart);
        }

        if (copyIntro) {
          tl.fromTo(
            copyIntro,
            { scale: 1, y: 0, transformOrigin: 'center center' },
            {
              scale: COPY_INTRO_SCALE_END,
              y: 0,
              duration: COPY_INTRO_SCALE_DURATION,
              ease: 'none',
              immediateRender: false,
            },
            COPY_INTRO_SCALE_START,
          );
          tl.fromTo(
            copyIntro,
            { opacity: 1 },
            {
              opacity: 0,
              duration: COPY_INTRO_OPACITY_DURATION,
              ease: 'none',
              immediateRender: false,
            },
            COPY_INTRO_OPACITY_START,
          );
        }
        if (copySharpness) {
          tl.fromTo(
            copySharpness,
            { opacity: 0, y: 0 },
            { opacity: 1, y: 0, duration: 0.55, ease: 'none' },
            sharpnessRingStart,
          );
          tl.to(
            copySharpness,
            { opacity: 0, y: 0, duration: COPY_HANDOFF_DURATION, ease: 'none' },
            meetHoldEnd,
          );
        }
        if (copyFinal) {
          tl.fromTo(
            copyFinal,
            { opacity: 0, y: 0 },
            { opacity: 1, y: 0, duration: COPY_HANDOFF_DURATION, ease: 'none' },
            meetHoldEnd,
          );
        }

        tl.call(
          () => {
            applyLayout(phone, peek, finalPhoneSize(window.innerHeight, true));
            setImageBoxMobile(peek, true);
          },
          undefined,
          afterPeek,
        );
        tl.to({}, { duration: holdDuration }, afterPeek);
        if (revealDuration > 0) {
          tl.fromTo(
            sticky,
            { y: 0 },
            {
              y: () => -heroPhoneRevealScrollVh(true) * window.innerHeight,
              duration: revealDuration,
              ease: 'none',
              immediateRender: false,
            },
          );
        }
        tl.to({}, { duration: fullHoldDuration });
        tl.to({}, { duration: coverDuration });
      }, track);
    };

    const mount = () => {
      ctx?.revert();
      ctx = undefined;

      const isMobile = isHeroPhoneMobileViewport();
      applyHeroFrameAttr(isMobile);

      gsap.set(phone, { opacity: 1, autoAlpha: 1 });

      // Desktop / landscape tablet: HEAD gate (min-width). Mobile frame always scrubs.
      const canScrubDesktop = enabled && desktopWidthMq.matches && !motionMq.matches;
      const canScrubMobile = enabled && isMobile && !motionMq.matches;

      if (isMobile) {
        if (!canScrubMobile) {
          setRestingLayout();
          applyLayout(phone, peekKeyframe(true), finalPhoneSize(window.innerHeight, true));
          if (bgBeige) gsap.set(bgBeige, { opacity: 1 });
          if (bgFinal) gsap.set(bgFinal, { opacity: 1 });
          if (copyIntro) gsap.set(copyIntro, { opacity: 0, scale: COPY_INTRO_SCALE_END, y: 0 });
          if (scrollIndicator) gsap.set(scrollIndicator, { opacity: 0 });
          if (copySharpness) gsap.set(copySharpness, { opacity: 0, y: 0 });
          if (copyFinal) gsap.set(copyFinal, { opacity: 0, y: 0 });
          if (phoneChrome) gsap.set(phoneChrome, { opacity: 1 });
          setImageBoxMobile(peekKeyframe(true), true);
          requestAnimationFrame(() => {
            const phoneUi = readPhoneUi();
            if (phoneUi) setPhoneUiFinal(phoneUi);
          });
          return;
        }
        buildMobileScrub();
      } else {
        if (!canScrubDesktop) {
          setRestingLayout();
          applyLayout(phone, peekKeyframe(false), finalPhoneSize(window.innerHeight, false));
          if (bgBeige) gsap.set(bgBeige, { opacity: 1 });
          if (bgFinal) gsap.set(bgFinal, { opacity: 1 });
          if (copyIntro) gsap.set(copyIntro, { opacity: 0, scale: COPY_INTRO_SCALE_END, y: 0 });
          if (scrollIndicator) gsap.set(scrollIndicator, { opacity: 0 });
          if (copySharpness) gsap.set(copySharpness, { opacity: 0, y: 0 });
          if (copyFinal) gsap.set(copyFinal, { opacity: 0, y: 0 });
          if (phoneChrome) gsap.set(phoneChrome, { opacity: 1 });
          setImageBoxDesktop(peekKeyframe(false), true);
          requestAnimationFrame(() => {
            const phoneUi = readPhoneUi();
            if (phoneUi) setPhoneUiFinal(phoneUi);
          });
          return;
        }
        buildDesktopScrub();
      }

      ScrollTrigger.refresh();
    };

    mount();
    desktopWidthMq.addEventListener('change', mount);
    orientationMq.addEventListener('change', mount);
    motionMq.addEventListener('change', mount);

    return () => {
      desktopWidthMq.removeEventListener('change', mount);
      orientationMq.removeEventListener('change', mount);
      motionMq.removeEventListener('change', mount);
      ctx?.revert();
      clearScrubLayout();
      delete track.dataset.heroFrame;
    };
  }, [enabled, minWidth, PHONE_UI_MORPH_REV]);

  return {
    trackRef,
    stickyRef,
    phoneRef,
    phoneChromeRef,
    scroll1ImageRef,
    phoneHomeUiRef,
    bgBeigeRef,
    bgFinalRef,
    copyIntroRef,
    scrollIndicatorRef,
    copySharpnessRef,
    copyFinalRef,
  };
}
