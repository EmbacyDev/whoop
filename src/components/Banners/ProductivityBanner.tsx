import { useEffect, useRef } from 'react';
import productivityDesktopVideo from '../../assets/images/banners/productivity-desktop-video.mp4';
import productivityMobileVideo from '../../assets/images/banners/productivity-mobile.mp4';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';
import shared from './SmallBanner.module.css';
import styles from './ProductivityBanner.module.css';

type ProductivityBannerProps = {
  /** When set (stagger from Banners), bypass the local one-shot reveal observer. */
  forceVisible?: boolean;
};

const DESKTOP_MQ = '(min-width: 768px)';

/**
 * "Productivity Windows" — plays the breakpoint MP4 once per viewport visit
 * (holds the last frame). Copy stays real HTML/CSS underneath the media.
 */
export function ProductivityBanner({ forceVisible }: ProductivityBannerProps = {}) {
  const { ref: revealRef, isVisible } = useRevealOnScroll<HTMLDivElement>();
  const cardRef = useRef<HTMLDivElement>(null);
  const desktopVideoRef = useRef<HTMLVideoElement>(null);
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
  }, []);

  return (
    <div className={styles.card} ref={cardRef}>
      <div className={styles.imageArea} ref={revealRef} data-visible={visible}>
        <video
          ref={desktopVideoRef}
          className={styles.desktopVideo}
          src={productivityDesktopVideo}
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
          src={productivityMobileVideo}
          muted
          playsInline
          preload="auto"
          controls={false}
          disablePictureInPicture
          aria-hidden="true"
        />
      </div>

      <div className={[shared.text, styles.text].join(' ')}>
        <p className={styles.titleEntrance} data-enter={visible}>
          <span className={shared.titleDark}>Productivity Windows</span>
        </p>
        <p className={shared.descriptionDark}>
          Translates your 8-week physiological trends into shifting daily intervals tailored for deep
          focus and essential recovery. Move past rigid hourly grids
        </p>
      </div>
    </div>
  );
}
