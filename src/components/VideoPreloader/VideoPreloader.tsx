import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import promoVideo from '../../assets/images/whoop promo_1.mp4';
import { Button } from '../ui/Button/Button';
import { useVideoPreloader } from './useVideoPreloader';
import styles from './VideoPreloader.module.css';

type VideoPreloaderProps = {
  onFinish: () => void;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const whole = Math.floor(seconds);
  const m = Math.floor(whole / 60);
  const s = whole % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Full-screen intro preloader (Figma "Video preloader").
 * Plays `whoop promo_1` once, muted, with a custom scrub bar + Skip.
 * Fades into the existing Hero when the clip ends or Skip is pressed.
 */
export function VideoPreloader({ onFinish }: VideoPreloaderProps) {
  const { hasEnded, isRemoved, finish } = useVideoPreloader();
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const finishedRef = useRef(false);
  const wasPlayingRef = useRef(true);
  const scrubbingRef = useRef(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);

  const handleFinish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const video = videoRef.current;
    if (video) {
      video.pause();
    }
    finish();
    onFinish();
  }, [finish, onFinish]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const syncDuration = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        setDuration(video.duration);
      }
    };

    const onTimeUpdate = () => {
      if (scrubbingRef.current) return;
      setCurrentTime(video.currentTime);
      if (video.duration > 0) {
        setProgress(video.currentTime / video.duration);
      }
    };

    video.addEventListener('loadedmetadata', syncDuration);
    video.addEventListener('durationchange', syncDuration);
    video.addEventListener('timeupdate', onTimeUpdate);

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        /* Autoplay may be blocked until a gesture; muted + playsInline usually ok. */
      });
    }

    return () => {
      video.removeEventListener('loadedmetadata', syncDuration);
      video.removeEventListener('durationchange', syncDuration);
      video.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, []);

  const seekFromClientX = (clientX: number) => {
    const track = trackRef.current;
    const video = videoRef.current;
    if (!track || !video || !Number.isFinite(video.duration) || video.duration <= 0) return;

    const rect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    video.currentTime = ratio * video.duration;
    setProgress(ratio);
    setCurrentTime(video.currentTime);
  };

  const onTrackPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;

    event.preventDefault();
    scrubbingRef.current = true;
    wasPlayingRef.current = !video.paused;
    video.pause();
    event.currentTarget.setPointerCapture(event.pointerId);
    seekFromClientX(event.clientX);
  };

  const onTrackPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!scrubbingRef.current) return;
    seekFromClientX(event.clientX);
  };

  const onTrackPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!scrubbingRef.current) return;
    scrubbingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const video = videoRef.current;
    if (video && wasPlayingRef.current && !finishedRef.current) {
      video.play().catch(() => {});
    }
  };

  if (isRemoved) return null;

  const progressPercent = `${(progress * 100).toFixed(2)}%`;

  return (
    <div
      className={[styles.preloader, hasEnded && styles.ended].filter(Boolean).join(' ')}
      role="presentation"
    >
      <video
        ref={videoRef}
        className={styles.video}
        src={promoVideo}
        autoPlay
        muted
        playsInline
        preload="auto"
        controls={false}
        disablePictureInPicture
        onEnded={handleFinish}
        onError={handleFinish}
        aria-hidden="true"
      />

      <div className={styles.controls}>
        <div
          className={styles.progressPill}
          role="group"
          aria-label="Video progress"
        >
          <span className={styles.time}>{formatTime(currentTime)}</span>
          <div
            ref={trackRef}
            className={styles.track}
            role="slider"
            tabIndex={0}
            aria-valuemin={0}
            aria-valuemax={Math.max(1, Math.floor(duration))}
            aria-valuenow={Math.floor(currentTime)}
            aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
            aria-label="Scrub video"
            onPointerDown={onTrackPointerDown}
            onPointerMove={onTrackPointerMove}
            onPointerUp={onTrackPointerUp}
            onPointerCancel={onTrackPointerUp}
            onKeyDown={(event) => {
              const video = videoRef.current;
              if (!video || !video.duration) return;
              const step = Math.max(video.duration * 0.05, 0.5);
              if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
                event.preventDefault();
                video.currentTime = Math.min(video.duration, video.currentTime + step);
              } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
                event.preventDefault();
                video.currentTime = Math.max(0, video.currentTime - step);
              } else if (event.key === 'Home') {
                event.preventDefault();
                video.currentTime = 0;
              } else if (event.key === 'End') {
                event.preventDefault();
                video.currentTime = video.duration;
              }
            }}
          >
            <div className={styles.trackBase} aria-hidden="true" />
            <div
              className={styles.trackFill}
              style={{ width: progressPercent }}
              aria-hidden="true"
            />
          </div>
          <span className={styles.time}>{formatTime(duration)}</span>
        </div>

        <Button
          variant="ghost"
          className={styles.skip}
          onClick={handleFinish}
          aria-label="Skip intro"
        >
          Skip
          <span className={styles.skipArrow} aria-hidden="true">
            →
          </span>
        </Button>
      </div>
    </div>
  );
}
