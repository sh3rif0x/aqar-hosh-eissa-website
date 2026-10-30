import Link from "next/link";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.content}>
        <h1 className={styles.title}>Find Your Perfect Property</h1>
        <p className={styles.subtitle}>
          Browse, filter and save the properties you love.
        </p>
        <div className={styles.actions}>
          <Link href="/dashboard" className={styles.primary}>
            Dashboard
          </Link>
          <Link href="/auth" className={styles.secondary}>
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
