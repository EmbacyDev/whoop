import { useEffect, useRef, useState } from 'react';
import bigBannerDesktopVideo from '../../assets/images/banners/big banner_desktop.mp4';
import bigBannerMobileVideo from '../../assets/images/banners/big-banner-mobile.mp4';
import styles from './BigBanner.module.css';

const PERCENT_START = 0;
const PERCENT_END = 74;
/** Require ~half the banner in view before starting (avoids hero cover flash). */
const VISIBILITY_THRESHOLD = 0.5;
const DESKTOP_MQ = '(min-width: 768px)';

/**
 * MP4 graph interval (seconds) — count maps 0→74 across this window only;
 * outside it the number holds. Same timing on desktop and mobile.
 */
const GRAPH_ANIM_START_S = 0.2;
const GRAPH_ANIM_END_S = 1.4;

function percentFromVideoTime(currentTime: number) {
  if (currentTime <= GRAPH_ANIM_START_S) return PERCENT_START;
  if (currentTime >= GRAPH_ANIM_END_S) return PERCENT_END;
  const t =
    (currentTime - GRAPH_ANIM_START_S) / (GRAPH_ANIM_END_S - GRAPH_ANIM_START_S);
  return Math.round(PERCENT_START + t * (PERCENT_END - PERCENT_START));
}

type BigBannerProps = {
  /**
   * When false, the banner stays hidden even if in view — used so the section
   * heading can finish before this entrance begins.
   */
  entranceArmed?: boolean;
  /** Fires when the banner entrance starts / resets after a full exit. */
  onEntranceChange?: (visible: boolean) => void;
};

/**
 * "Outsmart your burnout" — plays the breakpoint MP4 whenever the banner
 * enters the viewport (and is armed). HTML overlays the sharp percentage
 * synced to the progress-ring graph interval on both desktop and mobile.
 * Exit / full-exit replay behavior matches desktop.
 */
export function BigBanner({
  entranceArmed = true,
  onEntranceChange,
}: BigBannerProps = {}) {
  const desktopVideoRef = useRef<HTMLVideoElement>(null);
  const mobileVideoRef = useRef<HTMLVideoElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const onEntranceChangeRef = useRef(onEntranceChange);
  onEntranceChangeRef.current = onEntranceChange;
  const entranceArmedRef = useRef(entranceArmed);
  entranceArmedRef.current = entranceArmed;
  const inViewRef = useRef(false);
  const tryStartRef = useRef<() => void>(() => {});
  /** True for the whole stay in view — blocks restarts until a full exit. */
  const playedThisEntryRef = useRef(false);
  const [entranceVisible, setEntranceVisible] = useState(false);
  const [percent, setPercent] = useState(PERCENT_START);

  useEffect(() => {
    const banner = bannerRef.current;
    const desktopVideo = desktopVideoRef.current;
    const mobileVideo = mobileVideoRef.current;
    if (!banner || !desktopVideo || !mobileVideo) return;

    const desktopMq = window.matchMedia(DESKTOP_MQ);
    let cancelled = false;
    let raf = 0;

    const activeVideo = () => (desktopMq.matches ? desktopVideo : mobileVideo);
    const idleVideo = () => (desktopMq.matches ? mobileVideo : desktopVideo);

    const cancelTick = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const syncFromVideo = () => {
      setPercent(percentFromVideoTime(activeVideo().currentTime));
    };

    const tick = () => {
      syncFromVideo();
      const video = activeVideo();
      if (!cancelled && !video.paused && !video.ended) {
        raf = requestAnimationFrame(tick);
      }
    };

    const holdFinalFrame = () => {
      cancelTick();
      setPercent(PERCENT_END);
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
      cancelTick();
      resetVideo(desktopVideo);
      resetVideo(mobileVideo);
      setPercent(PERCENT_START);
      setEntranceVisible(false);
      onEntranceChangeRef.current?.(false);
    };

    const start = async () => {
      if (cancelled || playedThisEntryRef.current) return;
      if (!entranceArmedRef.current || !inViewRef.current) return;
      playedThisEntryRef.current = true;
      cancelTick();
      setPercent(PERCENT_START);
      setEntranceVisible(true);
      onEntranceChangeRef.current?.(true);

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
        setEntranceVisible(false);
        onEntranceChangeRef.current?.(false);
        return;
      }
      if (cancelled) {
        video.pause();
        playedThisEntryRef.current = false;
        setEntranceVisible(false);
        onEntranceChangeRef.current?.(false);
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    tryStartRef.current = () => {
      void start();
    };

    const onEnded = () => holdFinalFrame();
    desktopVideo.addEventListener('ended', onEnded);
    mobileVideo.addEventListener('ended', onEnded);
    desktopVideo.addEventListener('timeupdate', syncFromVideo);
    mobileVideo.addEventListener('timeupdate', syncFromVideo);

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting && entry.intersectionRatio >= VISIBILITY_THRESHOLD) {
          inViewRef.current = true;
          void start();
          return;
        }

        if (!entry.isIntersecting) {
          inViewRef.current = false;
          resetAfterExit();
        }
      },
      { threshold: [0, VISIBILITY_THRESHOLD, 0.75, 1] },
    );
    observer.observe(banner);

    const onBreakpoint = () => {
      // Keep playback scoped to the visible breakpoint asset.
      resetVideo(idleVideo());
      if (inViewRef.current && entranceArmedRef.current && playedThisEntryRef.current) {
        playedThisEntryRef.current = false;
        void start();
      }
    };
    desktopMq.addEventListener('change', onBreakpoint);

    return () => {
      cancelled = true;
      cancelTick();
      observer.disconnect();
      desktopMq.removeEventListener('change', onBreakpoint);
      desktopVideo.removeEventListener('ended', onEnded);
      mobileVideo.removeEventListener('ended', onEnded);
      desktopVideo.removeEventListener('timeupdate', syncFromVideo);
      mobileVideo.removeEventListener('timeupdate', syncFromVideo);
      desktopVideo.pause();
      mobileVideo.pause();
      playedThisEntryRef.current = false;
      tryStartRef.current = () => {};
    };
  }, []);

  // Heading finished after the banner was already in view — start now.
  useEffect(() => {
    if (!entranceArmed) return;
    tryStartRef.current();
  }, [entranceArmed]);

  return (
    <div
      className={styles.banner}
      ref={bannerRef}
      data-visible={entranceVisible}
    >
      <div className={styles.imageReveal}>
        <video
          ref={desktopVideoRef}
          className={styles.desktopVideo}
          src={bigBannerDesktopVideo}
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
          src={bigBannerMobileVideo}
          muted
          playsInline
          preload="auto"
          controls={false}
          disablePictureInPicture
          aria-hidden="true"
        />
        <div className={styles.ringMetric} aria-hidden="true">
          <span className={styles.ringValue}>
            <span className={styles.ringValueNumber}>{percent}</span>
            <span className={styles.ringValuePercent}>%</span>
          </span>
        </div>
      </div>

      <div className={styles.overlay} />

      <div className={styles.text}>
        <p className={styles.title}>Biometric Foundation</p>
        <p className={styles.description}>
          Monitors deep sleep architecture and real-time HRV to score your baseline mental clarity
          from 0 to 100%. No guesswork
        </p>
      </div>
    </div>
  );
}
