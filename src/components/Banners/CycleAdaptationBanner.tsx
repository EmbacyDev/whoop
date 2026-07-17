import cycleDesktop from '../../assets/images/banners/cycle-adaptation-desktop.jpg';
import cycleMobile from '../../assets/images/banners/cycle-adaptation-mobile.jpg';
import { useParallax } from '../../hooks/useParallax';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';
import shared from './SmallBanner.module.css';
import styles from './CycleAdaptationBanner.module.css';

/**
 * "Cycle Adaptation" — wrist photo card; the HRV/Deep Sleep tags and the AI
 * Assessment status are baked into the photo, "Cycle Adaptation" copy stays
 * real HTML/CSS on top.
 */
export function CycleAdaptationBanner() {
  const { ref: revealRef, isVisible } = useRevealOnScroll<HTMLDivElement>();
  const parallaxRef = useParallax<HTMLImageElement>(12);

  return (
    <div className={styles.card}>
      <div className={shared.imageReveal} ref={revealRef} data-visible={isVisible}>
        <picture>
          <source media="(min-width: 768px)" srcSet={cycleDesktop} />
          <img
            ref={parallaxRef}
            className={shared.image}
            src={cycleMobile}
            alt="A hand reaching down from a wrist wearing WHOOP, with HRV and Deep Sleep readings and an AI Assessment of Well Recovered"
          />
        </picture>
      </div>
      <div className={shared.overlay} />

      <div className={shared.text}>
        <p className={shared.titleLight}>Cycle Adaptation</p>
        <p className={shared.descriptionLight}>Automatically cross-references your long-term baselines to adjust readiness expectations around your body's natural, hidden cycles</p>
      </div>
    </div>
  );
}
