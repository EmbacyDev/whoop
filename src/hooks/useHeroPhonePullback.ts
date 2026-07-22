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
  heroPhoneRevealScrollVh,
  heroPinVh,
  heroStickyVh,
  layoutForKeyframe,
  peekKeyframe,
  type HeroPhoneKeyframe,
  type HeroPhoneLayout,
} from '../components/Hero/heroPhoneKeyframes';

gsap.registerPlugin(ScrollTrigger);

type UseHeroPhonePullbackOptions = {
  enabled: boolean;
  minWidth?: number;
};

export type HeroPhonePullbackRefs = {
  trackRef: RefObject<HTMLElement>;
  stickyRef: RefObject<HTMLDivElement>;
  phoneRef: RefObject<HTMLDivElement>;
  phoneChromeRef: RefObject<HTMLDivElement>;
  scroll1ImageRef: RefObject<HTMLDivElement>;
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

function resolveLayout(kf: HeroPhoneKeyframe, lockedSize?: boolean): HeroPhoneLayout {
  return lockedSize
    ? layoutForKeyframe(
        kf,
        window.innerWidth,
        window.innerHeight,
        finalPhoneSize(window.innerHeight),
      )
    : layoutForKeyframe(kf, window.innerWidth, window.innerHeight);
}

/**
 * Full-bleed viewport cover in phone-local coordinates.
 *
 * Used through Scroll 1→5 so hero-bg keeps Scroll 1 / Figma framing — the
 * phone is a window into that crop. Collapsing into the portrait hole early
 * re-`cover`s the 16:9 video and crops corner trees.
 */
function fullBleedInPhone(layout: HeroPhoneLayout) {
  return {
    left: -layout.left,
    top: -layout.top,
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Fill the phone display (phone-local). Required at peek: viewport-tall
 * full-bleed only covers phone-local y ∈ [−top, −top+vh], so the below-fold
 * part of the display hole would show stage cream through the PNG.
 *
 * Inset slightly into the bezel (not the full box) so `#05252b` never sits
 * under iphone.png’s transparent outer pad / soft alpha — that read as a
 * blue hairline just below the silhouette. Inset stays < bottom chin (~2%)
 * so the hole remains fully covered.
 */
function phoneFillBox(layout: HeroPhoneLayout) {
  const insetX = layout.width * 0.02;
  const insetY = layout.height * 0.01;
  return {
    left: insetX,
    top: insetY,
    width: layout.width - insetX * 2,
    height: layout.height - insetY * 2,
  };
}

function mediaBoxForKeyframe(kf: HeroPhoneKeyframe, lockedSize?: boolean) {
  const layout = resolveLayout(kf, lockedSize);
  // Peek / locked resting: fill the full display. Earlier scrub: viewport crop.
  if (lockedSize || kf.id === 'scroll-6-peek') return phoneFillBox(layout);
  return fullBleedInPhone(layout);
}

/** Image box for a keyframe (phone-local). */
function imageBoxVars(kf: HeroPhoneKeyframe, lockedSize?: boolean) {
  return {
    left: () => mediaBoxForKeyframe(kf, lockedSize).left,
    top: () => mediaBoxForKeyframe(kf, lockedSize).top,
    width: () => mediaBoxForKeyframe(kf, lockedSize).width,
    height: () => mediaBoxForKeyframe(kf, lockedSize).height,
    borderRadius: 0,
  };
}

/**
 * Sticky-track scrub through Figma Scroll 1→6 peek.
 *
 * phoneScreen is viewport full-bleed (phone-local) through Scroll 1→5 so the
 * phone windows Scroll 1 framing. At peek it switches to filling the phone
 * box so the display hole stays covered below the fold (no cream crop).
 *
 * At peek the phone size/position freeze; brief hold, then a reveal scrub so
 * the below-fold phone bottom enters the viewport, then HERO_COVER_VH pin
 * tail while Banners (−100vh) slide over. No additional phone scale.
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

    const desktopMq = window.matchMedia(`(min-width: ${minWidth}px)`);
    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');

    let ctx: gsap.Context | undefined;

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

    const setScrubLayout = () => {
      // GSAP pin owns sticking — disable CSS sticky so it cannot re-stick after unpin.
      sticky.style.position = 'relative';
      sticky.style.overflow = 'hidden';
      sticky.style.height = `${heroStickyVh() * 100}vh`;
      // Track sizes to the stage; pinSpacing supplies scrub distance.
      track.style.height = 'auto';
      track.style.setProperty('--hero-track-vh', `${heroStickyVh() * 100}vh`);
    };

    const setImageBox = (kf: HeroPhoneKeyframe, locked?: boolean) => {
      const box = mediaBoxForKeyframe(kf, locked);
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

    const setRestingStage = () => {
      if (bgBeige) gsap.set(bgBeige, { opacity: 1 });
      if (bgFinal) gsap.set(bgFinal, { opacity: 1 });
      if (copyIntro) gsap.set(copyIntro, { opacity: 0, y: 0 });
      if (scrollIndicator) gsap.set(scrollIndicator, { opacity: 0 });
      if (copySharpness) gsap.set(copySharpness, { opacity: 0, y: 0 });
      if (copyFinal) gsap.set(copyFinal, { opacity: 0, y: 0 });
      if (phoneChrome) gsap.set(phoneChrome, { opacity: 1 });
      setImageBox(peekKeyframe(), true);
    };

    const setInitialStage = () => {
      if (bgBeige) gsap.set(bgBeige, { opacity: 1 });
      if (bgFinal) gsap.set(bgFinal, { opacity: 0 });
      if (copyIntro) gsap.set(copyIntro, { opacity: 1, y: 0 });
      // Own opacity for scrub; clear CSS reveal transition so it doesn't fight GSAP.
      if (scrollIndicator) gsap.set(scrollIndicator, { opacity: 1, transition: 'none' });
      if (copySharpness) gsap.set(copySharpness, { opacity: 0, y: 12 });
      if (copyFinal) gsap.set(copyFinal, { opacity: 0, y: 12 });
      if (phoneChrome) gsap.set(phoneChrome, { opacity: 0 });
      setImageBox(HERO_PHONE_KEYFRAMES[0]);
    };

    const mount = () => {
      ctx?.revert();
      ctx = undefined;

      const canScrub = enabled && desktopMq.matches && !motionMq.matches;
      const peek = peekKeyframe();

      gsap.set(phone, { opacity: 1, autoAlpha: 1 });

      if (!canScrub) {
        setRestingLayout();
        applyLayout(phone, peek, finalPhoneSize(window.innerHeight));
        setRestingStage();
        return;
      }

      setScrubLayout();
      applyLayout(phone, HERO_PHONE_KEYFRAMES[0]);
      setInitialStage();

      const holdDuration = HERO_PHONE_HOLD_VH / HERO_PHONE_SEGMENT_VH;
      const revealDuration = heroPhoneRevealScrollVh() / HERO_PHONE_SEGMENT_VH;
      const fullHoldDuration = HERO_PHONE_FULL_HOLD_VH / HERO_PHONE_SEGMENT_VH;
      const coverDuration = HERO_COVER_VH / HERO_PHONE_SEGMENT_VH;
      const peekIndex = HERO_PHONE_KEYFRAMES.findIndex((k) => k.id === 'scroll-6-peek');
      const peekTweenStart = Math.max(peekIndex - 1, 0);
      // Timeline ends at peek + hold + reveal + cover; pin distance matches in px.
      const afterPeek = peekIndex;
      const pinDistance = () => heroPinVh() * window.innerHeight;

      ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: track,
            pin: sticky,
            // Spacer after the stage so unpin does not jump; remaining stage
            // height below the fold then scrolls naturally (phone bottom + text).
            pinSpacing: true,
            start: 'top top',
            end: () => `+=${pinDistance()}`,
            scrub: 0.8,
            invalidateOnRefresh: true,
            onRefresh: () => {
              sticky.style.height = `${heroStickyVh() * 100}vh`;
            },
          },
        });

        for (let i = 1; i <= peekIndex; i++) {
          tl.to(
            phone,
            {
              duration: 1,
              ease: 'none',
              immediateRender: false,
              ...sizeVars(HERO_PHONE_KEYFRAMES[i]),
            },
            i - 1,
          );
        }

        // hero-bg: viewport full-bleed through Scroll 5; fills phone at peek.
        tl.to(
          scroll1Image,
          {
            duration: 1,
            ease: 'none',
            immediateRender: false,
            ...imageBoxVars(HERO_PHONE_KEYFRAMES[1]),
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
              ...imageBoxVars(HERO_PHONE_KEYFRAMES[i]),
            },
            i - 1,
          );
        }

        if (phoneChrome) {
          tl.to(phoneChrome, { opacity: 1, duration: 0.75, ease: 'none' }, 0.08);
        }

        // Hide Scroll pill at the very start of scrub (before phone transition).
        if (scrollIndicator) {
          tl.to(
            scrollIndicator,
            { opacity: 0, duration: 0.2, ease: 'none' },
            0,
          );
        }

        if (bgFinal) {
          tl.to(bgFinal, { opacity: 1, duration: 0.7, ease: 'none' }, peekTweenStart);
        }

        if (copyIntro) {
          // Hold until phone top sits just under the header (scroll-3 / t≈1.5),
          // then fade — timing only; duration/easing unchanged.
          tl.to(
            copyIntro,
            { opacity: 0, y: -16, duration: 0.4, ease: 'none' },
            1.5,
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
          // Fade in at peek; stays put — exits with the stage on post-pin scroll.
          tl.fromTo(
            copyFinal,
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'none' },
            peekTweenStart,
          );
        }

        // Freeze at peek size/position; hold → reveal full phone → full-hold → cover.
        // Re-assert locked size so scrub overshoot cannot shrink past peek.
        // Reveal shifts the pinned stage up by the below-fold overflow so the
        // phone bottom enters view before Banners (−100vh) begin covering.
        // Peek layout ratios stay unchanged; coverDuration / banners CSS untouched.
        tl.call(
          () => {
            applyLayout(phone, peek, finalPhoneSize(window.innerHeight));
            setImageBox(peek, true);
          },
          undefined,
          afterPeek,
        );
        tl.to({}, { duration: holdDuration }, afterPeek);
        // Shift pinned stage by the below-fold overflow (+ pad) so the phone
        // bottom clears the viewport before Banners begin covering.
        tl.fromTo(
          sticky,
          { y: 0 },
          {
            y: () => -heroPhoneRevealScrollVh() * window.innerHeight,
            duration: revealDuration,
            ease: 'none',
            immediateRender: false,
          },
        );
        // Brief hold with the full phone on-screen before Block 2 cover.
        tl.to({}, { duration: fullHoldDuration });
        tl.to({}, { duration: coverDuration });
      }, track);

      ScrollTrigger.refresh();
    };

    mount();
    desktopMq.addEventListener('change', mount);
    motionMq.addEventListener('change', mount);

    return () => {
      desktopMq.removeEventListener('change', mount);
      motionMq.removeEventListener('change', mount);
      ctx?.revert();
      clearScrubLayout();
    };
  }, [enabled, minWidth]);

  return {
    trackRef,
    stickyRef,
    phoneRef,
    phoneChromeRef,
    scroll1ImageRef,
    bgBeigeRef,
    bgFinalRef,
    copyIntroRef,
    scrollIndicatorRef,
    copySharpnessRef,
    copyFinalRef,
  };
}
