import { useEffect, useRef, useState } from 'react';

/**
 * Tracks whether an element has entered the viewport, once. Used to trigger
 * a one-time fade + translate entrance (e.g. Block 2 banner photos) instead
 * of a value that toggles back off on scroll-out.
 */
export function useRevealOnScroll<T extends HTMLElement>(threshold = 0.25) {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -10% 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}
