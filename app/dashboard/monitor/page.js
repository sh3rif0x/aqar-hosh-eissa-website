"use client";
import styles from "../dashboard.module.css";
import SectionView from "./_components/SectionView";
import { overviewFeatures } from "@/lib/monitor/registry";

export default function Page() {
  return <div className={styles.page}><SectionView title="المراقبة والتتبع · نظرة عامة" features={overviewFeatures()} /></div>;
}
