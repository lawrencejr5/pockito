import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Terms & Conditions — Pockito",
  description:
    "Terms of Use and Conditions for the Pockito mobile application and subscriptions.",
};

export default function TermsPage() {
  return (
    <>
      <header className={styles.nav}>
        <Link href="/" className={styles.brand}>
          <Image
            src="/brand/icon.png"
            alt=""
            width={34}
            height={34}
            className={styles.brandIcon}
          />
          <span className={styles.brandText}>
            Pockito
            <small className={styles.brandSub}>by lawjun labs</small>
          </span>
        </Link>
        <nav className={styles.navLinks} aria-label="Primary">
          <Link href="/#faq">FAQ</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
        <Link href="/" className={styles.backLink}>
          Back to home
        </Link>
      </header>

      <main className={styles.main}>
        <span className={styles.eyebrow}>Legal</span>
        <h1>Terms &amp; Conditions</h1>
        <p className={styles.updated}>Pockito · Lawjun labs · Last updated November 2026</p>

        <p className={styles.lead}>
          By downloading, accessing, or using Pockito, you agree to be bound by these Terms &amp;
          Conditions. If you do not agree, please do not use the application.
        </p>

        <div className={styles.article}>
          <section className={styles.section}>
            <h2>1. Subscriptions, 7-Day Trial &amp; Lifetime Access</h2>
            <ul>
              <li>
                <strong>Monthly Pro ($1.99/month):</strong> Eligible new subscribers receive a
                7-day free trial. Unless cancelled at least 24 hours before the end of the trial
                period, your Apple ID account will automatically be charged $1.99 per month (or
                local App Store equivalent) upon trial completion and on each monthly renewal.
              </li>
              <li>
                <strong>Trial Reminder:</strong> If notifications are enabled, Pockito sends a
                reminder 2 days before your 7-day free trial ends.
              </li>
              <li>
                <strong>Lifetime Pro ($34.99 one-time):</strong> A single non-consumable in-app
                purchase granting ongoing access to Pockito Pro with no recurring fees.
              </li>
              <li>
                <strong>Manage or Cancel:</strong> You can manage or cancel your subscription at any
                time in your Apple ID Account Settings or from Profile → Manage Subscription inside
                Pockito.
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>2. Financial Information Disclaimer</h2>
            <p>
              Pockito is a personal budgeting, expense tracking, and net worth management tool.
              Nothing in the app or on this website constitutes financial, investment, tax, or legal
              advice. You are solely responsible for your financial decisions.
            </p>
          </section>

          <section className={styles.section}>
            <h2>3. Acceptable Use</h2>
            <p>
              You agree to use Pockito only for lawful personal finance tracking and not to misuse,
              reverse engineer, or disrupt the service or its cloud infrastructure.
            </p>
          </section>

          <section className={styles.section}>
            <h2>4. Account Deletion</h2>
            <p>
              Deleting your Pockito account permanently removes your cloud data, but does not
              automatically cancel an active App Store subscription. Please cancel active
              subscriptions in your Apple ID settings before deleting your account.
            </p>
          </section>

          <section className={styles.section}>
            <h2>5. Limitation of Liability</h2>
            <p>
              Pockito is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis.
              To the fullest extent permitted by law, Lawjun labs shall not be liable for any
              indirect, incidental, or consequential damages arising from your use of the app.
            </p>
          </section>
        </div>
      </main>

      <footer className={styles.footer}>
        <span>© 2026 Lawjun labs</span>
        <div className={styles.footerLinks}>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms &amp; Conditions</Link>
        </div>
      </footer>
    </>
  );
}
