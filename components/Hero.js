"use client";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import styles from "./Hero.module.css";

/* الصور داخل public/hero — غيّر الامتداد هنا لو صورك jpg أو webp */
const SLIDES = [1, 2, 3, 4].map((n) => `/hero/hero-img${n}.png`);

const INTERVAL = 5000;

const TITLE = "ابحث عن عقارك في حوش عيسى";
const BADGES = ["نشر مجاني", "تواصل مباشر مع المالك", "حوش عيسى والمناطق المحيطة"];
const TEXT = "شقق وفلل ومحلات ومبانٍ وأراضٍ زراعية وأراضي بناء للبيع والإيجار في حوش عيسى والمناطق المحيطة.";

export default function Hero() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    SLIDES.forEach((src) => { const img = new Image(); img.src = src; });
  }, []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((c) => (c + 1) % SLIDES.length), INTERVAL);
    return () => clearInterval(t);
  }, [paused, i]);

  return (
    <section className={styles.hero} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} dir="rtl">
      {SLIDES.map((src, n) => (
        <div key={src} className={`${styles.slide} ${n === i ? styles.active : ""}`} style={{ backgroundImage: `url(${src})` }} aria-hidden="true" />
      ))}
      <div className={styles.shade} />

      <div className={styles.content}>
        <h1 className={styles.title}>{TITLE}</h1>
        <ul className={styles.badges}>
          {BADGES.map((b) => <li key={b}><CheckCircle2 size={16} /> {b}</li>)}
        </ul>
        <p className={styles.subtitle}>{TEXT}</p>
      </div>

      <div className={styles.dots} role="tablist" aria-label="صور الهيرو">
        {SLIDES.map((_, n) => (
          <button key={n} role="tab" aria-selected={n === i} aria-label={`صورة ${n + 1}`} className={`${styles.dot} ${n === i ? styles.dotOn : ""}`} onClick={() => setI(n)} />
        ))}
      </div>
    </section>
  );
}
