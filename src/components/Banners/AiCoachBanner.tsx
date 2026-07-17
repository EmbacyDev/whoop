import coachDesktop from '../../assets/images/banners/ai-coach-desktop.jpg';
import coachMobile from '../../assets/images/banners/ai-coach-mobile.jpg';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';
import shared from './SmallBanner.module.css';
import styles from './AiCoachBanner.module.css';

/** "AI Performance Coach" — photo-only card, no floating UI in the source design. */
export function AiCoachBanner() {
  const { ref: revealRef, isVisible } = useRevealOnScroll<HTMLDivElement>();

  return (
    <div className={[shared.card, shared.cardTight].join(' ')}>
      <div className={shared.imageReveal} ref={revealRef} data-visible={isVisible}>
        <picture>
          <source media="(min-width: 768px)" srcSet={coachDesktop} />
          <img
            className={styles.image}
            src={coachMobile}
            alt="A phone with a calendar app open, resting on a table"
          />
        </picture>
      </div>
      <div className={shared.overlay} />

      <div className={shared.text}>
        <p className={shared.titleLight}>AI Performance Coach</p>
        <p className={shared.descriptionLight}>Adaptive advising that proactively calculates meeting load and flags potential strain windows before burnout hits your calendar</p>
      </div>
    </div>
  );
}
