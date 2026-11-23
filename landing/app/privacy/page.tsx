import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy — Pockito",
  description:
    "How Pockito collects, stores, and protects your account and personal finance data.",
};

export default function PrivacyPage() {
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
        <h1>Privacy Policy</h1>
        <p className={styles.updated}>Pockito · Lawjun labs · Last updated November 2026</p>

        <p className={styles.lead}>
          Pockito respects your privacy. This Privacy Policy explains what information is collected
          when you use the Pockito mobile app and website, how it is used, and how you can delete
          your data at any time.
        </p>

        <div className={styles.article}>
          <section className={styles.section}>
            <h2>1. Account &amp; Financial Data</h2>
            <p>
              When you sign in with Apple or Google, we store your name, email address, and
              authentication identifier to identify your account.
            </p>
            <p>
              The transactions, receipt photos, budgets, assets, and liabilities you enter are
              stored securely in your private cloud account solely to sync your data across your
              devices and power your reports. We do not sell your financial data or share it with
              advertisers.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. Purchases &amp; Subscriptions</h2>
            <p>
              All subscription and lifetime purchases are processed by the Apple App Store and
              managed via RevenueCat. Pockito never receives or stores your credit card or payment
              credentials.
            </p>
          </section>

          <section className={styles.section}>
            <h2>3. Notifications &amp; Reminders</h2>
            <p>
              If you enable notifications, we store your push notification token and timezone to
              deliver optional spending reminders, weekly wealth summaries, and a reminder 2 days
              before a free trial ends. You can disable notifications at any time in iOS Settings.
            </p>
          </section>

          <section className={styles.section}>
            <h2>4. Your Rights &amp; Data Deletion</h2>
            <p>
              You may permanently delete your account and all stored transactions, receipt photos,
              budgets, and wealth records at any time inside the app via{" "}
              <strong>Profile → Delete Account</strong>.
            </p>
            <p>
              Please note that deleting your Pockito account removes your cloud data, but does not
              automatically cancel an active App Store subscription. Manage or cancel active
              subscriptions in your Apple ID Account Settings.
            </p>
          </section>

          <section className={styles.section}>
            <h2>5. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time as Pockito evolves. Any updates
              will be reflected on this page with an updated revision date.
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
