"use client";
import { useState } from "react";
import styles from "../../dashboard.module.css";
import { DAY_OPTIONS } from "@/lib/monitor/core";
import FeatureCard from "./FeatureCard";

export default function SectionView({ title, features }) {
  const [days, setDays] = useState(7);
  return (
    <>
      <div className={styles.pageHead}>
        <div><h2>{title}</h2></div>
        <div>
          <select className={styles.in} value={days} onChange={(e) => setDays(+e.target.value)}>
            {DAY_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>
      {features.length === 0
        ? <p className={styles.empty}>لا توجد ميزات مفعّلة في هذا القسم.</p>
        : <div className={styles.grid2}>{features.map((f) => <FeatureCard key={f.key} f={f} days={days} />)}</div>}
    </>
  );
}
