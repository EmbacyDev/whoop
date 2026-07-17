import ctaDesktop from '../../assets/images/cta/cta-banner-desktop.jpg';
import ctaMobile from '../../assets/images/cta/cta-banner-mobile.jpg';
import { Container } from '../ui/Container/Container';
import { Button } from '../ui/Button/Button';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';
import styles from './CTA.module.css';

/**
 * Figma "CTA" — closing "Own your output. Protect your recovery." panel.
 * Fades/lifts in as one composed block when it enters the viewport.
 */
export function CTA() {
  const { ref, isVisible } = useRevealOnScroll<HTMLDivElement>();

  return (
    <section id="cta" className={styles.section}>
      <Container>
        <div className={styles.reveal} ref={ref} data-visible={isVisible}>
          <div className={styles.panel}>
            <picture>
              <source media="(min-width: 768px)" srcSet={ctaDesktop} />
              <img className={styles.image} src={ctaMobile} alt="" />
            </picture>
            <div className={styles.overlay} />

            <div className={styles.text}>
              <div className={styles.copy}>
                <h2 className={styles.title}>Own your output. Protect your recovery.</h2>
                <p className={styles.description}>Connect your calendar to WHOOP. Start operating at peak cognitive capacity.</p>
              </div>
              <Button variant="solid">Activate now</Button>
            </div>

            <span className={styles.label}>
              Hustle on your
              <br />
              body's terms
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
}
