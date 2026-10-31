"use client";
import { useCallback, useEffect, useState } from "react";
import styles from "../../dashboard.module.css";
import { callFeature, errMsg, REFRESH_EVENT } from "@/lib/monitor/core";
import { RENDERERS } from "./Widgets";

export default function FeatureCard({ f, days }) {
  const R = RENDERERS[f.type];
  const isStatic = !!R?.isStatic;
  const [st, setSt] = useState({ data: null, error: "", loading: !isStatic });
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!R || isStatic) return;
    let off = false;
    setSt((s) => ({ ...s, loading: true }));
    callFeature(f, days)
      .then((d) => !off && setSt({ data: Array.isArray(d) ? d : [], error: "", loading: false }))
      .catch((e) => !off && setSt({ data: null, error: errMsg(e), loading: false }));
    return () => { off = true; };
  }, [f, days, tick]);

  useEffect(() => {
    window.addEventListener(REFRESH_EVENT, reload);
    return () => window.removeEventListener(REFRESH_EVENT, reload);
  }, [reload]);

  useEffect(() => {
    if (!f.refresh) return;
    const t = setInterval(() => { if (!document.hidden) reload(); }, f.refresh * 1000);
    return () => clearInterval(t);
  }, [f.refresh, reload]);

  if (!R) return null;
  let body;
  if (isStatic) body = <R f={f} />;
  else if (st.loading && !st.data) body = <div className={styles.skel} style={{ height: 80 }} />;
  else if (st.error) body = <p className={styles.err}>{st.error}</p>;
  else body = <R f={f} rows={st.data || []} reload={reload} />;

  return (
    <div className={styles.card} style={f.size === "full" ? { gridColumn: "1 / -1" } : undefined}>
      <div className={styles.row} style={{ justifyContent: "space-between", marginBottom: ".8rem" }}>
        <h3 style={{ margin: 0 }}>{f.title}</h3>
        {!isStatic && <button className={styles.b} onClick={reload} aria-label="تحديث">↻</button>}
      </div>
      {body}
    </div>
  );
}
