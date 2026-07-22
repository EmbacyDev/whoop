import { useEffect, useRef } from 'react';
import cycleDesktopVideo from '../../assets/images/banners/cycle-adaptation-desktop.mp4';
import cycleMobile from '../../assets/images/banners/cycle-adaptation-mobile.jpg';
import { useParallax } from '../../hooks/useParallax';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';
import shared from './SmallBanner.module.css';
import styles from './CycleAdaptationBanner.module.css';

type CycleAdaptationBannerProps = {
  /** When set (desktop stagger), bypass the local one-shot reveal observer. */
  forceVisible?: boolean;
};

/**
 * "Cycle Adaptation" — desktop plays cycle-adaptation-desktop.mp4 once per
 * viewport visit (holds the last frame); mobile keeps the static photo.
 * The desktop video gets a subtle scroll parallax; card/text stay fixed.
 */
export function CycleAdaptationBanner({ forceVisible }: CycleAdaptationBannerProps = {}) {
  const { ref: revealRef, isVisible } = useRevealOnScroll<HTMLDivElement>();
  const cardRef = useRef<HTMLDivElement>(null);
  // Keep parallax small so framing can stay near 1:1 with the card (no heavy bleed zoom).
  const videoRef = useParallax<HTMLVideoElement>(8);
  const playedThisEntryRef = useRef(false);
  const visible = forceVisible || isVisible;

  useEffect(() => {
    const card = cardRef.current;
    const video = videoRef.current;
    if (!card || !video) return;

    // Desktop-only media; mobile uses the static <img>.
    const desktopMq = window.matchMedia('(min-width: 768px)');
    let cancelled = false;

    const holdFinalFrame = () => {
      video.pause();
      if (Number.isFinite(video.duration) && video.duration > 0) {
        try {
          video.currentTime = video.duration;
        } catch {
          /* ignore */
        }
      }
    };

    const resetAfterExit = () => {
      playedThisEntryRef.current = false;
      video.pause();
      try {
        video.currentTime = 0;
      } catch {
        /* ignore */
      }
    };

    const start = async () => {
      if (cancelled || playedThisEntryRef.current) return;
      if (!desktopMq.matches) return;
      playedThisEntryRef.current = true;
      try {
        video.currentTime = 0;
      } catch {
        /* ignore */
      }
      try {
        await video.play();
      } catch {
        playedThisEntryRef.current = false;
      }
    };

    video.addEventListener('ended', holdFinalFrame);

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
          void start();
          return;
        }
        if (!entry.isIntersecting) {
          resetAfterExit();
        }
      },
      { threshold: [0, 0.35, 0.75, 1] },
    );
    observer.observe(card);

    const onBreakpoint = () => {
      if (!desktopMq.matches) {
        resetAfterExit();
      }
    };
    desktopMq.addEventListener('change', onBreakpoint);

    return () => {
      cancelled = true;
      observer.disconnect();
      desktopMq.removeEventListener('change', onBreakpoint);
      video.removeEventListener('ended', holdFinalFrame);
      video.pause();
      playedThisEntryRef.current = false;
    };
  }, [videoRef]);

  return (
    <div className={styles.card} ref={cardRef}>
      <div className={shared.imageReveal} ref={revealRef} data-visible={visible}>
        <video
          ref={videoRef}
          className={styles.desktopVideo}
          src={cycleDesktopVideo}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        <img
          className={styles.mobileImage}
          src={cycleMobile}
          alt="A hand reaching down from a wrist wearing WHOOP, with HRV and Deep Sleep readings and an AI Assessment of Well Recovered"
          draggable={false}
        />
      </div>
      <div className={shared.overlay} />

      <div className={shared.text}>
        <p className={shared.titleLight}>Cycle Adaptation</p>
        <p className={shared.descriptionLight}>
          Automatically cross-references your long-term baselines to adjust readiness expectations
          around your body's natural, hidden cycles
        </p>
      </div>
    </div>
  );
}
