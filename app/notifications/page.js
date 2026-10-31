"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import styles from "./notifications.module.css";

const PAGE = 20;

function ago(d) {
  const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "الآن";
  const m = Math.floor(s / 60);
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  return `منذ ${Math.floor(h / 24)} يوم`;
}

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [user, loading, router]);

  const load = useCallback(async (offset = 0) => {
    setBusy(true);
    setErr("");
    const { data, error } = await supabase.rpc("get_my_notifications", { p_limit: PAGE, p_offset: offset });
    if (error) setErr(error.message);
    else {
      setItems((prev) => (offset ? [...prev, ...data.items] : data.items));
      setTotal(data.total);
      setUnread(data.unread);
    }
    setBusy(false);
  }, []);

  useEffect(() => {
    if (user) load(0);
  }, [user, load]);

  const markOne = async (n) => {
    if (n.read_at) return;
    setItems((p) => p.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));
    setUnread((u) => Math.max(0, u - 1));
    await supabase.rpc("mark_notifications_read", { p_id: n.id });
  };

  const markAll = async () => {
    const now = new Date().toISOString();
    setItems((p) => p.map((x) => ({ ...x, read_at: x.read_at || now })));
    setUnread(0);
    await supabase.rpc("mark_notifications_read");
  };

  if (!user) return <div className={styles.wrap} />;

  return (
    <main className={styles.wrap} dir="rtl">
      <div className={styles.head}>
        <h1>الإشعارات {unread > 0 && <span className={styles.badge}>{unread}</span>}</h1>
        {unread > 0 && (
          <button type="button" className={styles.link} onClick={markAll}>
            تحديد الكل كمقروء
          </button>
        )}
      </div>

      {err && <p className={styles.err}>{err}</p>}
      {!busy && !err && items.length === 0 && <p className={styles.empty}>لا توجد إشعارات بعد.</p>}

      <ul className={styles.list}>
        {items.map((n) => (
          <li key={n.id} className={`${styles.item} ${n.read_at ? "" : styles.unread}`} onClick={() => markOne(n)}>
            <div className={styles.top}>
              {n.sender ? (
                <Link href={`/profile/${n.sender.id}`} className={styles.sender} onClick={(e) => e.stopPropagation()}>
                  <span className={styles.av} style={n.sender.avatar_url ? { backgroundImage: `url(${n.sender.avatar_url})` } : undefined}>
                    {!n.sender.avatar_url && (n.sender.name || "؟")[0]}
                  </span>
                  <b>{n.sender.name || "مستخدم"}</b>
                </Link>
              ) : (
                <span className={styles.sys}>إدارة الموقع</span>
              )}
              <time>{ago(n.created_at)}</time>
            </div>
            <h3>{n.title}</h3>
            <p>{n.body}</p>
            {n.listing_id && (
              <Link href={`/listing/${n.listing_id}`} className={styles.link} onClick={(e) => e.stopPropagation()}>
                عرض الإعلان ←
              </Link>
            )}
          </li>
        ))}
      </ul>

      {busy && <p className={styles.empty}>جارٍ التحميل...</p>}
      {!busy && items.length < total && (
        <button type="button" className={styles.more} onClick={() => load(items.length)}>
          عرض المزيد
        </button>
      )}
    </main>
  );
}
