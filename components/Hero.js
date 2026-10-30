"use client";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { HERO_SLIDES, HERO_BADGES } from "@/lib/data";

export default function Hero() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActive((i) => (i + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(id);
  }, []);
  return (
    <section className="hero">
      {HERO_SLIDES.map((bg, i) => (
        <div key={i} className={`slide ${i === active ? "on" : ""}`} style={{ background: bg }} />
      ))}
      <div className="hero-shade" />
      <div className="hero-content">
        <h1>ابحث عن عقارك في حوش عيسى</h1>
        <ul className="hero-badges">
          {HERO_BADGES.map((b) => <li key={b}><CheckCircle2 size={14} /> {b}</li>)}
        </ul>
        <p>شقق وفلل ومحلات ومبانٍ وأراضٍ زراعية وأراضي بناء للبيع والإيجار في حوش عيسى والمناطق المحيطة.</p>
      </div>
      <div className="dots">
        {HERO_SLIDES.map((_, i) => (
          <button key={i} aria-label={`شريحة ${i + 1}`} onClick={() => setActive(i)} className={i === active ? "on" : ""} />
        ))}
      </div>
    </section>
  );
}
