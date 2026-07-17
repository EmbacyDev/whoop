import { useEffect, useRef } from 'react';

/**
 * Applies a small, continuous vertical parallax offset to an element as its
 * containing block moves through the viewport — used for the Block 2 banner
 * background photos. `strength` is the max offset in pixels in either
 * direction; kept deliberately small for a calm, premium feel. No-ops under
 * prefers-reduced-motion.
 */
export function useParallax<T extends HTMLElement>(strength = 16) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const track = el.parentElement ?? el;
    let ticking = false;
    let inView = false;

    const apply = () => {
      ticking = false;
      if (!inView) return;
      const rect = track.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const elementCenter = rect.top + rect.height / 2;
      const progress = Math.max(-1, Math.min(1, (viewportCenter - elementCenter) / viewportCenter));
      el.style.transform = `translate3d(0, ${(progress * strength).toFixed(2)}px, 0)`;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        inView = entry?.isIntersecting ?? false;
        if (inView) onScroll();
      },
      { rootMargin: '25% 0px 25% 0px' },
    );
    observer.observe(track);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [strength]);

  return ref;
}
