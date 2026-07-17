import type { ReactNode } from 'react';
import styles from './SectionHeading.module.css';

type SectionHeadingProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
  /** Extra class merged onto the subtitle `<p>`, for per-section width/measure overrides. */
  subtitleClassName?: string;
};

/** Centered serif title + muted subtitle, shared by "Outsmart your burnout" and "The Daily Loop". */
export function SectionHeading({ title, subtitle, className, subtitleClassName }: SectionHeadingProps) {
  return (
    <div className={[styles.heading, className].filter(Boolean).join(' ')}>
      <h2 className={styles.title}>{title}</h2>
      {subtitle ? <p className={[styles.subtitle, subtitleClassName].filter(Boolean).join(' ')}>{subtitle}</p> : null}
    </div>
  );
}
