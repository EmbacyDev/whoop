import { Button } from '../../ui/Button/Button';
import styles from './ScrollIndicator.module.css';

type ScrollIndicatorProps = {
  targetId: string;
  className?: string;
};

/** The "SCROLL ↓" pill from Scroll 1. Scrolls to the next section on click. */
export function ScrollIndicator({ targetId, className }: ScrollIndicatorProps) {
  const handleClick = () => {
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Button variant="ghost" className={className} onClick={handleClick}>
      Scroll
      <span className={styles.arrow} aria-hidden="true">
        ↓
      </span>
    </Button>
  );
}
