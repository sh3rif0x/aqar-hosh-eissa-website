"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./AdvertiserLink.module.css";

const TYPES = { owner: "مالك مباشر", broker: "سمسار / مكتب عقارات", seeker: "مستخدم" };

export default function AdvertiserLink({ side = false }) {
  const { id } = useParams();
  const [a, setA] = useState(null);

  useEffect(() => {
    let off = false;
    (async () => {
      const { data: l } = await supabase.rpc("get_listing", { p_id: id });
      if (off || !l?.user_id) return;
      const { data: p } = await supabase.rpc("get_public_profile_by_id", { p_id: l.user_id });
      const row = Array.isArray(p) ? p[0] : p;
      if (!off && row) setA(row);
    })();
    return () => { off = true; };
  }, [id]);

  if (!a) return null;
  const name = a.office_name || a.full_name || "المعلن";

  return (
    <section className={styles.wrap} dir="rtl" style={side ? { padding: 0, margin: "14px 0", maxWidth: "none", width: "100%" } : undefined}>
      <div className={styles.card} style={side ? { flexWrap: "wrap", gap: 12, width: "100%", margin: 0, boxSizing: "border-box" } : undefined}>
        <div className={styles.av} style={a.avatar_url ? { backgroundImage: `url(${a.avatar_url})` } : undefined}>
          {!a.avatar_url && name[0]}
        </div>
        <div className={styles.info}>
          <strong>{name}</strong>
          <small>{TYPES[a.account_type] || "معلن"} · {a.listings_count} إعلان منشور</small>
        </div>
        <Link href={`/profile/${a.id}`} className={styles.btn} style={side ? { flexBasis: "100%", width: "100%", textAlign: "center", boxSizing: "border-box" } : undefined}>
          عرض كل إعلانات المعلن
        </Link>
      </div>
    </section>
  );
}
