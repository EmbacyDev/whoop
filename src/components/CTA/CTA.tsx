import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ctaDesktop from '../../assets/images/cta/cta-banner-desktop.jpg';
import ctaMobile from '../../assets/images/cta/cta-banner-mobile.jpg';
import { Container } from '../ui/Container/Container';
import { Button } from '../ui/Button/Button';
import styles from './CTA.module.css';

gsap.registerPlugin(ScrollTrigger);

/**
 * Figma "CTA" — closing "Own your output. Protect your recovery." panel.
 * Scales and settles into place as one composed block with scroll progress.
 */
type CTAProps = {
  revealed: boolean;
};

export function CTA({ revealed }: CTAProps) {
  const revealRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const reveal = revealRef.current;
    if (!reveal) return;

    let frame = 0;
    const context = gsap.context(() => {
      gsap.set(reveal, { scale: 0.8, y: 0 });

      if (!revealed) return;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(reveal, { scale: 1, y: 0 });
        return;
      }

      frame = window.requestAnimationFrame(() => {
        context.add(() => {
          const timeline = gsap.timeline({ paused: true }).to(reveal, {
            scale: 1,
            y: 0,
            ease: 'none',
          });

          ScrollTrigger.create({
            trigger: reveal.parentElement,
            animation: timeline,
            start: 'top 90%',
            end: 'center 45%',
            scrub: 1.5,
            invalidateOnRefresh: true,
          });

          ScrollTrigger.refresh();
        });
      });
    }, reveal);

    return () => {
      window.cancelAnimationFrame(frame);
      context.revert();
    };
  }, [revealed]);

  return (
    <section id="cta" className={styles.section}>
      <Container>
        <div className={styles.reveal} ref={revealRef}>
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
