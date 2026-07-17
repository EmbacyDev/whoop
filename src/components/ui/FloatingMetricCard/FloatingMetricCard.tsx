import { ProgressRing } from '../ProgressRing/ProgressRing';
import { CheckRingIcon, InfoIcon } from './icons';
import styles from './FloatingMetricCard.module.css';

type FloatingMetricCardProps =
  | {
      /** Ring layout, e.g. the "Sharpness 38%" card. Prominent title sits above the muted metadata line. */
      variant?: 'metric';
      title: string;
      metadata: string;
      value: number;
      ringColor?: string;
      icon?: 'info' | 'check' | 'none';
      size?: 'md' | 'sm';
      className?: string;
    }
  | {
      /** Text-only layout, e.g. "AI Assessment / Well Recovered". Muted label sits above the prominent value line. */
      variant: 'status';
      label: string;
      status: string;
      icon?: 'info' | 'check' | 'none';
      size?: 'md' | 'sm';
      className?: string;
    };

/**
 * The recurring dark glass "floating UI" card seen throughout the design
 * (Sharpness score on the banners, daily loop card, AI assessment pill).
 */
export function FloatingMetricCard(props: FloatingMetricCardProps) {
  const { icon = 'none', size = 'md', className } = props;
  const isStatus = props.variant === 'status';
  const ringSize = size === 'sm' ? 78 : 128;

  const classes = [styles.card, isStatus && styles.textOnly, size === 'sm' && styles.sizeSm, className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {!isStatus && (
        <>
          <div className={styles.ringSlot}>
            <ProgressRing value={props.value} size={ringSize} color={props.ringColor ?? 'var(--color-cream)'} />
            <span className={styles.ringValue}>
              <span className={styles.ringValueNumber}>{Math.round(props.value)}</span>
              <span className={styles.ringValuePercent}>%</span>
            </span>
          </div>
          <div className={styles.textGroup}>
            <p className={styles.title}>{props.title}</p>
            <p className={styles.metadata}>{props.metadata}</p>
          </div>
        </>
      )}
      {isStatus && (
        <div className={styles.textGroup}>
          <p className={styles.metadata}>{props.label}</p>
          <p className={styles.title}>{props.status}</p>
        </div>
      )}
      {icon === 'info' && <InfoIcon className={styles.icon} />}
      {icon === 'check' && <CheckRingIcon className={styles.icon} />}
    </div>
  );
}
