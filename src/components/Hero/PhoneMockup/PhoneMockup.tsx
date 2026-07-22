import type { ReactNode } from 'react';
import styles from './PhoneMockup.module.css';

type PhoneMockupProps = {
  children?: ReactNode;
  className?: string;
};

/**
 * Device-frame shell for the Hero camera pull-back.
 * Parent sets the outer box; this frame fills it so GSAP can drive size alone.
 * Always fully opaque — Scroll 1 hides the bezel via scale/clip, not opacity.
 */
export function PhoneMockup({ children, className }: PhoneMockupProps) {
  return (
    <div className={[styles.frame, className].filter(Boolean).join(' ')}>
      <div className={styles.notch} />
      <div className={styles.screen}>{children}</div>
    </div>
  );
}
