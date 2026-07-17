import type { ReactNode } from 'react';
import styles from './PhoneMockup.module.css';

type PhoneMockupProps = {
  children?: ReactNode;
  className?: string;
};

/**
 * Device-frame shell matching the "iphone" groups in Figma's Scroll 2-6
 * frames. Accepts arbitrary screen content via `children`, so the future
 * pinned-scroll Hero can swap what's rendered inside as the user scrolls
 * without touching the frame markup.
 */
export function PhoneMockup({ children, className }: PhoneMockupProps) {
  return (
    <div className={[styles.frame, className].filter(Boolean).join(' ')}>
      <div className={styles.notch} />
      <div className={styles.screen}>{children}</div>
    </div>
  );
}
