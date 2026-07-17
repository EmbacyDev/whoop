import { useState } from 'react';
import { Container } from '../../ui/Container/Container';
import { WhoopLogo } from '../../ui/WhoopLogo/WhoopLogo';
import { navLinks } from './navData';
import styles from './Header.module.css';

type HeaderProps = {
  /** Header stays hidden until the intro video finishes. */
  visible: boolean;
};

/**
 * Site header, structurally and behaviorally modeled on whoop.com's live
 * header (not copied from their source). Stays hidden/inert until the
 * intro video preloader finishes.
 */
export function Header({ visible }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={[styles.header, visible && styles.visible].filter(Boolean).join(' ')} aria-hidden={!visible}>
      <Container wide className={styles.inner}>
        <a href="#top" className={styles.logo} aria-label="Whoop home">
          <WhoopLogo className={styles.logoMark} decorative />
        </a>

        <nav className={styles.nav} aria-label="Primary">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className={styles.navLink}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className={styles.actions}>
          <a href="#gift" className={styles.giftButton}>
            Gift Whoop
          </a>
          <a href="#join" className={styles.joinButton}>
            Join Now
          </a>
          <button
            type="button"
            className={styles.menuToggle}
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </Container>

      <nav className={[styles.mobileNav, menuOpen && styles.mobileNavOpen].filter(Boolean).join(' ')} aria-label="Mobile">
        {navLinks.map((link) => (
          <a key={link.label} href={link.href} className={styles.navLink} onClick={() => setMenuOpen(false)}>
            {link.label}
          </a>
        ))}
        <a href="#gift" className={styles.navLink} onClick={() => setMenuOpen(false)}>
          Gift Whoop
        </a>
      </nav>
    </header>
  );
}
