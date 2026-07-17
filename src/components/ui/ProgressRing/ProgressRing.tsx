import styles from './ProgressRing.module.css';

type ProgressRingProps = {
  /** 0-100 */
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
};

/**
 * Circular progress ring used by the floating "Sharpness" / "Recovery" /
 * "Strain" metric cards. Built with SVG (not a static image) so the fill
 * value can be transitioned/animated later without swapping assets.
 */
export function ProgressRing({ value, size = 78, strokeWidth = 6, color = 'var(--color-cream)', className }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(value, 0), 100) / 100);

  return (
    <svg
      className={[styles.ring, className].filter(Boolean).join(' ')}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${value}%`}
    >
      <circle className={styles.track} cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />
      <circle
        className={styles.value}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        stroke={color}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}
