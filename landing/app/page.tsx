import Image from "next/image";
import LottiePlayer from "./LottiePlayer";
import styles from "./page.module.css";

// TODO: replace with the real App Store link once available.
const APP_STORE_URL = "#download";

const features = [
  {
    eyebrow: "Track",
    title: "Log every naira, dollar or euro in seconds.",
    body: "A clean keypad, smart categories and receipt photos make adding a transaction almost effortless. See income, expenses and your balance trend at a glance.",
    bullets: [
      "Income & expense tracking",
      "Receipt attachments",
      "Multi-currency support",
    ],
    shot: "/screenshots/IMG_2426.PNG",
    alt: "Pockito home screen with balance chart and weekly budget",
  },
  {
    eyebrow: "Build wealth",
    title: "Know your real net worth.",
    body: "Add assets and liabilities, then watch your balance sheet come together. Pockito can even fold your cash balance in automatically.",
    bullets: [
      "Assets & liabilities",
      "Net worth gauge",
      "Auto-synced cash balance",
    ],
    shot: "/screenshots/IMG_2422.PNG",
    alt: "Pockito wealth screen showing total net worth",
  },
  {
    eyebrow: "Understand",
    title: "See exactly where it all goes.",
    body: "Beautiful reports break down your spending by category over 7, 30 or 90 days, with daily and monthly averages. Export whenever you need.",
    bullets: ["Category breakdowns", "Spending insights", "Exportable reports"],
    shot: "/screenshots/IMG_2424.PNG",
    alt: "Pockito report screen with category donut chart",
  },
];

const perks = [
  {
    title: "Smart budgets",
    body: "Weekly or monthly limits with a live progress ring.",
  },
  {
    title: "Cloud sync",
    body: "Your data is backed up and ready on every sign-in.",
  },
  { title: "Reminders", body: "Gentle nudges so you never forget to log." },
  {
    title: "Private by design",
    body: "Your finances stay yours. Sign in with Apple.",
  },
];

function Phone({
  src,
  alt,
  priority,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <div className={styles.phone}>
      <Image
        src={src}
        alt={alt}
        width={924}
        height={2000}
        sizes="(max-width: 800px) 70vw, 340px"
        priority={priority}
        className={styles.phoneImg}
      />
    </div>
  );
}

function AppStoreButton() {
  return (
    <a
      href={APP_STORE_URL}
      className={styles.storeBtn}
      aria-label="Download on the App Store"
    >
      <svg
        viewBox="0 0 384 512"
        width="22"
        height="22"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
      </svg>
      <span>
        <small>Download on the</small>
        App Store
      </span>
    </a>
  );
}

export default function Home() {
  return (
    <>
      <header className={styles.nav}>
        <a href="#top" className={styles.brand}>
          <Image
            src="/brand/icon.png"
            alt=""
            width={32}
            height={32}
            className={styles.brandIcon}
          />
          Pockito
        </a>
        <a href={APP_STORE_URL} className={styles.navCta}>
          Get the app
        </a>
      </header>

      <main id="top">
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.glow} aria-hidden="true" />
          <div className={styles.heroText}>
            <span className={styles.pill}>Now on the App Store</span>
            <h1>
              Your money,
              <br />
              <em>beautifully simple.</em>
            </h1>
            <p>
              Pockito helps you track spending, stick to budgets and watch your
              net worth grow — all in one calm, focused app.
            </p>
            <AppStoreButton />
          </div>
          <div className={styles.heroVisual}>
            <LottiePlayer
              src="/lottie/coin.json"
              className={`${styles.float} ${styles.coin}`}
            />
            <Phone
              src="/screenshots/IMG_2428.PNG"
              alt="Pockito transactions list"
              priority
            />
            <LottiePlayer
              src="/lottie/money.json"
              className={`${styles.float} ${styles.money}`}
            />
          </div>
        </section>

        {/* Features */}
        {features.map((f, i) => (
          <section
            key={f.eyebrow}
            className={`${styles.feature} ${i % 2 ? styles.reverse : ""}`}
          >
            <div className={styles.featureText}>
              <span className={styles.eyebrow}>{f.eyebrow}</span>
              <h2>{f.title}</h2>
              <p>{f.body}</p>
              <ul>
                {f.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
            <div className={styles.featureVisual}>
              <Phone src={f.shot} alt={f.alt} />
            </div>
          </section>
        ))}

        {/* Perks */}
        <section className={styles.perks}>
          <h2>Everything you need. Nothing you don&apos;t.</h2>
          <div className={styles.perkGrid}>
            {perks.map((p) => (
              <div key={p.title} className={styles.perk}>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className={styles.cta} id="download">
          <LottiePlayer src="/lottie/piggy.json" className={styles.piggy} />
          <h2>Take control of your pocket.</h2>
          <p>Download Pockito today and make every spend count.</p>
          <AppStoreButton />
        </section>
      </main>

      <footer className={styles.footer}>
        <span>© 2026 Lawjun labs</span>
        <span>Available on iPhone</span>
      </footer>
    </>
  );
}
