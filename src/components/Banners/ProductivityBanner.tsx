import productivityDesktop from '../../assets/images/banners/productivity-desktop.jpg';
import productivityMobile from '../../assets/images/banners/productivity-mobile.jpg';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';
import shared from './SmallBanner.module.css';
import styles from './ProductivityBanner.module.css';

/**
 * "Productivity Windows" — the beige gradient card; the deep-work timer
 * widget is baked into the photo, "Productivity Windows" copy stays real
 * HTML/CSS underneath it.
 */
export function ProductivityBanner() {
  const { ref: revealRef, isVisible } = useRevealOnScroll<HTMLDivElement>();

  return (
    <div className={styles.card}>
      <div className={styles.imageArea} ref={revealRef} data-visible={isVisible}>
        <picture>
          <source media="(min-width: 768px)" srcSet={productivityDesktop} />
          <img
            className={styles.image}
            src={productivityMobile}
            alt="A widget showing the best time for deep work, counting down 1:45:30 until the next work cycle"
          />
        </picture>
      </div>

      <div className={[shared.text, styles.text].join(' ')}>
        <p className={shared.titleDark}>Productivity Windows</p>
        <p className={shared.descriptionDark}>Translates your 8-week physiological trends into shifting daily intervals tailored for deep focus and essential recovery. Move past rigid hourly grids</p>
      </div>
    </div>
  );
}
