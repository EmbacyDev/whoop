import { Container } from '../../ui/Container/Container';
import { WhoopLogo } from '../../ui/WhoopLogo/WhoopLogo';
import { footerColumns } from './footerData';
import styles from './Footer.module.css';

/** Site footer, structurally modeled on whoop.com's live footer (not copied from their source). */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <Container wide>
        <div className={styles.columns}>
          {footerColumns.map((column) => (
            <div key={column.heading} className={styles.column}>
              <p className={styles.columnHeading}>{column.heading}</p>
              <div className={styles.columnLinks}>
                {column.links.map((link) => (
                  <a key={link} href="#">
                    {link}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.bottom}>
          <div className={styles.brandRow}>
            <WhoopLogo className={styles.wordmark} />
            <p className={styles.mission}>Our mission at WHOOP is to unlock human performance and Healthspan.</p>
          </div>

          <form className={styles.newsletter} onSubmit={(event) => event.preventDefault()}>
            <div className={styles.newsletterForm}>
              <input className={styles.newsletterInput} type="email" placeholder="Enter your email" aria-label="Email address" required />
              <button type="submit" className={styles.newsletterSubmit}>
                Submit
              </button>
            </div>
            <p className={styles.newsletterHint}>By signing up, I agree with the data protection policy.</p>
          </form>
        </div>

        <div className={styles.legalRow}>
          <p>© {new Date().getFullYear()} WHOOP</p>
        </div>
      </Container>
    </footer>
  );
}
