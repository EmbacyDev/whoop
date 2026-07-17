import heroBg from '../../assets/images/hero-bg.jpg';
import { ScrollIndicator } from './ScrollIndicator/ScrollIndicator';
import styles from './Hero.module.css';

type HeroProps = {
  /** True once the intro video has finished — fades the title/indicator in. */
  revealed: boolean;
};

/**
 * Figma "Scroll 1" — the initial Hero state, shown right after the intro
 * video. "Scroll 2" through "Scroll 6" describe one continuous
 * scroll-driven sequence (an iPhone growing in and animating) that isn't
 * implemented yet; see `PhoneMockup` for the reusable piece already built
 * for that future work, and `.stageSlot` below for where it will attach.
 */
export function Hero({ revealed }: HeroProps) {
  return (
    <section id="hero" className={[styles.hero, revealed && styles.revealed].filter(Boolean).join(' ')}>
      <div className={styles.background}>
        <img className={styles.backgroundImage} src={heroBg} alt="" />
      </div>

      <h1 className={styles.title}>Whoop Your Calendar</h1>

      {/* Future pinned-scroll phone (PhoneMockup) mounts here, driven by
          scroll progress through Scroll 2-6. Intentionally empty for now. */}
      <div className={styles.stageSlot} aria-hidden="true" />

      <ScrollIndicator targetId="banners" className={styles.indicator} />
    </section>
  );
}
