import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

type CommonProps = {
  variant?: 'solid' | 'ghost';
  size?: 'md' | 'sm';
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type ButtonAsAnchor = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

type ButtonProps = ButtonAsButton | ButtonAsAnchor;

/** Pill/rounded-rect button matching the Figma "button" component. Renders an `<a>` when `href` is passed, otherwise a `<button>`. */
export function Button({ variant = 'solid', size = 'md', className, children, ...rest }: ButtonProps) {
  const classes = [styles.button, styles[variant], size === 'sm' && styles.sizeSm, className].filter(Boolean).join(' ');

  if ('href' in rest && rest.href !== undefined) {
    return (
      <a className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
