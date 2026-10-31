"use client";
import { use } from "react";
import styles from "../../dashboard.module.css";
import SectionView from "../_components/SectionView";
import { getSection } from "@/lib/monitor/registry";

export default function Page({ params }) {
  const { section } = use(params);
  const s = getSection(section);
  if (!s) return <div className={styles.page}><div className={styles.card}><h3>القسم غير موجود أو معطّل</h3></div></div>;
  return <div className={styles.page}><SectionView title={s.label} features={s.features} /></div>;
}
