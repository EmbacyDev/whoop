import type { Ref } from 'react';
import { Button } from '../../ui/Button/Button';
import styles from './ScrollIndicator.module.css';

type ScrollIndicatorProps = {
  targetId: string;
  className?: string;
  /** Optional root ref for GSAP scrub (fade out on scroll). */
  rootRef?: Ref<HTMLDivElement>;
};

/** The "SCROLL ↓" pill from Scroll 1. Scrolls to the next section on click. */
export function ScrollIndicator({ targetId, className, rootRef }: ScrollIndicatorProps) {
  const handleClick = () => {
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div ref={rootRef} className={className}>
      <Button variant="ghost" className={styles.root} onClick={handleClick}>
        Scroll
        <span className={styles.arrow} aria-hidden="true">
          ↓
        </span>
      </Button>
    </div>
  );
}
