import { Container } from '../ui/Container/Container';
import { SectionHeading } from '../ui/SectionHeading/SectionHeading';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';
import { BigBanner } from './BigBanner';
import { ProductivityBanner } from './ProductivityBanner';
import { CycleAdaptationBanner } from './CycleAdaptationBanner';
import { AiCoachBanner } from './AiCoachBanner';
import styles from './Banners.module.css';

/**
 * Figma "Block 2" — the "Outsmart your burnout" banner grid.
 *
 * Entrance is one composed reveal for the section (heading + big banner
 * together), with the small-banner row staggered slightly behind rather
 * than each card animating independently — the existing per-photo parallax
 * inside each banner is untouched.
 */
export function Banners() {
  const { ref, isVisible } = useRevealOnScroll<HTMLDivElement>();

  return (
    <section id="banners" className={styles.section}>
      <Container>
        <div className={styles.group} ref={ref} data-visible={isVisible}>
          <SectionHeading
            className={styles.heading}
            subtitleClassName={styles.subtitle}
            title="Outsmart your burnout"
            subtitle="Stop letting back-to-back meetings dictate your energy. Own your life-work balance by syncing your daily schedule with your biology."
          />

          <div className={styles.content}>
            <div className={styles.bigBannerStage}>
              <BigBanner />
            </div>
            <div className={styles.smallBannersStage}>
              <div className={styles.smallBanners}>
                <ProductivityBanner />
                <CycleAdaptationBanner />
                <AiCoachBanner />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
