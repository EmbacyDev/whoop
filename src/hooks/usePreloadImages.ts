import { useEffect, useState } from 'react';

/**
 * Warms the browser cache for the given image URLs once, so later swaps in
 * a scroll interaction never re-request or flash empty frames.
 */
export function usePreloadImages(urls: readonly string[]) {
  const [ready, setReady] = useState(false);
  const key = urls.join('|');

  useEffect(() => {
    let cancelled = false;
    const unique = [...new Set(key.split('|').filter(Boolean))];

    if (unique.length === 0) {
      setReady(true);
      return;
    }

    let remaining = unique.length;

    const done = () => {
      remaining -= 1;
      if (!cancelled && remaining <= 0) setReady(true);
    };

    unique.forEach((src) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = done;
      img.onerror = done;
      img.src = src;
      if (img.complete) done();
    });

    return () => {
      cancelled = true;
    };
  }, [key]);

  return ready;
}
