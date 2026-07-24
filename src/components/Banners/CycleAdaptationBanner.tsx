import { useEffect, useRef } from 'react';
import cycleDesktopVideo from '../../assets/images/banners/cycle-adaptation-desktop.mp4';
import cycleMobileVideo from '../../assets/images/banners/cycle-adaptation-mobile.mp4';
import { useParallax } from '../../hooks/useParallax';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';
import shared from './SmallBanner.module.css';
import styles from './CycleAdaptationBanner.module.css';

type CycleAdaptationBannerProps = {
  /** When set (stagger from Banners), bypass the local one-shot reveal observer. */
  forceVisible?: boolean;
};

const DESKTOP_MQ = '(min-width: 768px)';

/**
 * "Cycle Adaptation" — plays the breakpoint MP4 once per viewport visit
 * (holds the last frame). Desktop video gets a subtle scroll parallax;
 * card/text stay fixed.
 */
export function CycleAdaptationBanner({ forceVisible }: CycleAdaptationBannerProps = {}) {
  const { ref: revealRef, isVisible } = useRevealOnScroll<HTMLDivElement>();
  const cardRef = useRef<HTMLDivElement>(null);
  // Keep parallax small so framing can stay near 1:1 with the card (no heavy bleed zoom).
  const desktopVideoRef = useParallax<HTMLVideoElement>(8);
  const mobileVideoRef = useRef<HTMLVideoElement>(null);
  const playedThisEntryRef = useRef(false);
  const visible = forceVisible || isVisible;

  useEffect(() => {
    const card = cardRef.current;
    const desktopVideo = desktopVideoRef.current;
    const mobileVideo = mobileVideoRef.current;
    if (!card || !desktopVideo || !mobileVideo) return;

    const desktopMq = window.matchMedia(DESKTOP_MQ);
    let cancelled = false;

    const activeVideo = () => (desktopMq.matches ? desktopVideo : mobileVideo);
    const idleVideo = () => (desktopMq.matches ? mobileVideo : desktopVideo);

    const holdFinalFrame = () => {
      const video = activeVideo();
      video.pause();
      if (Number.isFinite(video.duration) && video.duration > 0) {
        try {
          video.currentTime = video.duration;
        } catch {
          /* ignore */
        }
      }
    };

    const resetVideo = (video: HTMLVideoElement) => {
      video.pause();
      try {
        video.currentTime = 0;
      } catch {
        /* ignore */
      }
    };

    const resetAfterExit = () => {
      playedThisEntryRef.current = false;
      resetVideo(desktopVideo);
      resetVideo(mobileVideo);
    };

    const start = async () => {
      if (cancelled || playedThisEntryRef.current) return;
      playedThisEntryRef.current = true;
      const video = activeVideo();
      resetVideo(idleVideo());
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

    desktopVideo.addEventListener('ended', holdFinalFrame);
    mobileVideo.addEventListener('ended', holdFinalFrame);

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
      resetVideo(idleVideo());
      if (playedThisEntryRef.current) {
        playedThisEntryRef.current = false;
        void start();
      }
    };
    desktopMq.addEventListener('change', onBreakpoint);

    return () => {
      cancelled = true;
      observer.disconnect();
      desktopMq.removeEventListener('change', onBreakpoint);
      desktopVideo.removeEventListener('ended', holdFinalFrame);
      mobileVideo.removeEventListener('ended', holdFinalFrame);
      desktopVideo.pause();
      mobileVideo.pause();
      playedThisEntryRef.current = false;
    };
  }, [desktopVideoRef]);

  return (
    <div className={styles.card} ref={cardRef}>
      <div className={shared.imageReveal} ref={revealRef} data-visible={visible}>
        <video
          ref={desktopVideoRef}
          className={styles.desktopVideo}
          src={cycleDesktopVideo}
          muted
          playsInline
          preload="auto"
          controls={false}
          disablePictureInPicture
          aria-hidden="true"
        />
        <video
          ref={mobileVideoRef}
          className={styles.mobileVideo}
          src={cycleMobileVideo}
          muted
          playsInline
          preload="auto"
          controls={false}
          disablePictureInPicture
          aria-hidden="true"
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
