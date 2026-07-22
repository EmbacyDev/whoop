import { useEffect, useRef, useState } from 'react';
import bigBannerDesktopVideo from '../../assets/images/banners/big banner_desktop.mp4';
import bigBannerMobile from '../../assets/images/banners/big-banner-mobile.jpg';
import { useParallax } from '../../hooks/useParallax';
import styles from './BigBanner.module.css';

const PERCENT_START = 100;
const PERCENT_END = 38;
/** Require ~half the banner in view before starting (avoids hero cover flash). */
const VISIBILITY_THRESHOLD = 0.5;

/**
 * Desktop MP4 graph interval (seconds) — sampled from ring-pixel change in
 * `big banner_desktop.mp4` (duration ≈ 1.667s). Countdown maps 100→38 across
 * this window only; outside it the number holds.
 */
const GRAPH_ANIM_START_S = 0.2;
const GRAPH_ANIM_END_S = 1.4;

function percentFromVideoTime(currentTime: number) {
  if (currentTime <= GRAPH_ANIM_START_S) return PERCENT_START;
  if (currentTime >= GRAPH_ANIM_END_S) return PERCENT_END;
  const t =
    (currentTime - GRAPH_ANIM_START_S) / (GRAPH_ANIM_END_S - GRAPH_ANIM_START_S);
  return Math.round(PERCENT_START - t * (PERCENT_START - PERCENT_END));
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
 * "Outsmart your burnout" — desktop plays the exported MP4 whenever the
 * banner enters the viewport (and is armed); HTML overlays the sharp
 * percentage synced to the progress-ring graph interval. Mobile keeps the
 * static photo. Exit / full-exit replay behavior is unchanged.
 */
export function BigBanner({
  entranceArmed = true,
  onEntranceChange,
}: BigBannerProps = {}) {
  const parallaxRef = useParallax<HTMLImageElement>(14);
  const videoRef = useRef<HTMLVideoElement>(null);
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
    const video = videoRef.current;
    if (!banner || !video) return;

    let cancelled = false;
    let raf = 0;

    const cancelTick = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const syncFromVideo = () => {
      setPercent(percentFromVideoTime(video.currentTime));
    };

    const tick = () => {
      syncFromVideo();
      if (!cancelled && !video.paused && !video.ended) {
        raf = requestAnimationFrame(tick);
      }
    };

    const holdFinalFrame = () => {
      cancelTick();
      setPercent(PERCENT_END);
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
      cancelTick();
      video.pause();
      try {
        video.currentTime = 0;
      } catch {
        /* ignore */
      }
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

    video.addEventListener('ended', holdFinalFrame);
    video.addEventListener('timeupdate', syncFromVideo);

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

    return () => {
      cancelled = true;
      cancelTick();
      observer.disconnect();
      video.removeEventListener('ended', holdFinalFrame);
      video.removeEventListener('timeupdate', syncFromVideo);
      video.pause();
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
          ref={videoRef}
          className={styles.desktopVideo}
          src={bigBannerDesktopVideo}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        <img
          ref={parallaxRef}
          className={styles.mobileImage}
          src={bigBannerMobile}
          alt="Man resting in a chair with a laptop, eyes closed, with his Sharpness score floating beside him"
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
