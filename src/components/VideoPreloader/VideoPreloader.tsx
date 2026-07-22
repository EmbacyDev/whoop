import { useEffect, useRef, useState, type CSSProperties } from 'react';
import videoPoster from '../../assets/images/video-poster.jpg';
import { useVideoPreloader } from './useVideoPreloader';
import styles from './VideoPreloader.module.css';

// TODO(video): the real intro video could not be exported from Figma (the
// frame only contains a static reference still). Drop the final file at
// `public/videos/intro.mp4` \u2014 this path just starts working, nothing else
// to change. Until then this component shows a clearly labeled placeholder
// and auto-advances after a few seconds so the rest of the flow is testable.
const PLACEHOLDER_VIDEO_SRC = `${import.meta.env.BASE_URL}videos/intro.mp4`;
const PLACEHOLDER_HOLD_MS = 3200;

type VideoPreloaderProps = {
  onFinish: () => void;
};

/**
 * Full-screen intro video that plays once (no loop) and acts as a
 * preloader. The header stays hidden the whole time this is mounted.
 * Structured so a future "Skip" control only needs to call `finish()` \u2014
 * see the reserved `.controls` slot in the stylesheet.
 */
export function VideoPreloader({ onFinish }: VideoPreloaderProps) {
  const { hasEnded, isRemoved, finish } = useVideoPreloader();
  const [videoFailed, setVideoFailed] = useState(false);
  const fallbackTimeoutRef = useRef<number | null>(null);
  const finishedRef = useRef(false);

  const handleFinish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    finish();
    onFinish();
  };

  const handleError = () => {
    if (fallbackTimeoutRef.current !== null) return;
    setVideoFailed(true);
    fallbackTimeoutRef.current = window.setTimeout(handleFinish, PLACEHOLDER_HOLD_MS);
  };

  // Vite SPA fallback can return index.html (200) for a missing intro.mp4.
  // That often never fires video `error`/`ended`, so probe the asset and
  // also hard-cap how long the preloader may block the page.
  useEffect(() => {
    let cancelled = false;

    fetch(PLACEHOLDER_VIDEO_SRC, { method: 'GET', headers: { Range: 'bytes=0-0' } })
      .then((res) => {
        if (cancelled) return;
        const type = res.headers.get('content-type') ?? '';
        if (!res.ok || type.includes('text/html') || !type.includes('video')) {
          handleError();
        }
      })
      .catch(() => {
        if (!cancelled) handleError();
      });

    const safety = window.setTimeout(handleFinish, PLACEHOLDER_HOLD_MS + 5000);
    return () => {
      cancelled = true;
      window.clearTimeout(safety);
    };
    // handleError/handleFinish are stable for this mount lifecycle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isRemoved) return null;

  return (
    <div className={[styles.preloader, hasEnded && styles.ended].filter(Boolean).join(' ')} role="presentation">
      {!videoFailed && (
        <video
          className={styles.video}
          src={PLACEHOLDER_VIDEO_SRC}
          poster={videoPoster}
          autoPlay
          muted
          playsInline
          onEnded={handleFinish}
          onError={handleError}
        />
      )}

      {videoFailed && (
        <PlaceholderNotice poster={videoPoster} onSkip={handleFinish} />
      )}

      {/* Reserved slot for a future Skip control, e.g.:
          <div className={styles.controls}><SkipButton onClick={handleFinish} /></div> */}
    </div>
  );
}

function PlaceholderNotice({ poster, onSkip }: { poster: string; onSkip: () => void }) {
  return (
    <button type="button" onClick={onSkip} aria-label="Skip placeholder intro" style={placeholderButtonStyle}>
      <img src={poster} alt="" style={placeholderImageStyle} />
      <span style={placeholderBadgeStyle}>Placeholder — add the real file at public/videos/intro.mp4</span>
    </button>
  );
}

const placeholderButtonStyle: CSSProperties = {
  position: 'relative',
  display: 'block',
  width: '100%',
  height: '100%',
  padding: 0,
};

const placeholderImageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const placeholderBadgeStyle: CSSProperties = {
  position: 'absolute',
  bottom: '1.25rem',
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'rgba(0,0,0,0.7)',
  color: '#f9f3ec',
  fontSize: '0.75rem',
  padding: '0.5rem 0.9rem',
  borderRadius: '999px',
  whiteSpace: 'nowrap',
  fontFamily: 'sans-serif',
};
