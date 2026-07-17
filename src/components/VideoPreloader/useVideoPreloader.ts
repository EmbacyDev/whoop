import { useCallback, useEffect, useState } from 'react';

const FADE_OUT_MS = 900;

/**
 * Drives the intro video preloader lifecycle:
 *   playing -> ended (crossfade starts) -> removed (unmounted after the fade).
 *
 * `hasEnded` flips the moment the video finishes (or fails to load/play,
 * which is treated as an immediate graceful skip) so the header/hero can
 * start revealing in the same frame the video starts fading \u2014 producing a
 * crossfade rather than a cut. `isRemoved` flips after the fade transition
 * finishes so the layer can be unmounted instead of sitting invisibly on
 * top of the page.
 */
export function useVideoPreloader() {
  const [hasEnded, setHasEnded] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);

  const finish = useCallback(() => setHasEnded(true), []);

  useEffect(() => {
    document.body.dataset.preloader = hasEnded ? 'inactive' : 'active';
  }, [hasEnded]);

  useEffect(() => {
    if (!hasEnded) return;
    const timeout = window.setTimeout(() => setIsRemoved(true), FADE_OUT_MS);
    return () => window.clearTimeout(timeout);
  }, [hasEnded]);

  return { hasEnded, isRemoved, finish };
}
