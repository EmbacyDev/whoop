import bigBannerDesktop from '../../assets/images/banners/big-banner-desktop.jpg';
import bigBannerMobile from '../../assets/images/banners/big-banner-mobile.jpg';
import { useParallax } from '../../hooks/useParallax';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';
import styles from './BigBanner.module.css';

/**
 * "Outsmart your burnout" — big banner photo (the Sharpness card is baked
 * into the image) with "Biometric Foundation" copy layered on top as real
 * HTML/CSS.
 */
export function BigBanner() {
  const { ref: revealRef, isVisible } = useRevealOnScroll<HTMLDivElement>();
  const parallaxRef = useParallax<HTMLImageElement>(14);

  return (
    <div className={styles.banner}>
      <div className={styles.imageReveal} ref={revealRef} data-visible={isVisible}>
        <picture>
          <source media="(min-width: 768px)" srcSet={bigBannerDesktop} />
          <img
            ref={parallaxRef}
            className={styles.image}
            src={bigBannerMobile}
            alt="Man resting in a chair with a laptop, eyes closed, with his Sharpness score floating beside him"
          />
        </picture>
      </div>
      <div className={styles.overlay} />

      <div className={styles.text}>
        <p className={styles.title}>Biometric Foundation</p>
        <p className={styles.description}>Monitors deep sleep architecture and real-time HRV to score your baseline mental clarity from 0 to 100%. No guesswork</p>
      </div>
    </div>
  );
}
