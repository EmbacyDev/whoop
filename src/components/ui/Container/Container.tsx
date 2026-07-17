import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import styles from './Container.module.css';

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  as?: ElementType;
  wide?: boolean;
  children: ReactNode;
};

/** Centers content and caps its width so large screens (up to ~1920px) keep the original composition instead of stretching edge-to-edge. */
export function Container({ as: Tag = 'div', wide = false, className, children, ...rest }: ContainerProps) {
  const classes = [styles.container, wide && styles.wide, className].filter(Boolean).join(' ');
  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
