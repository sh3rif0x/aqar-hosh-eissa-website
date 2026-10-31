"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import styles from "./public.module.css";

const PAGE = 12;
const TYPES = { owner: "مالك", broker: "سمسار / مكتب عقارات", seeker: "باحث عن عقار" };
const UNITS = { sqm: "م²", feddan: "فدان", qirat: "قيراط", sahm: "سهم" };
const DEALS = { sale: "بيع", rent: "إيجار" };

const coverUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return supabase.storage.from("listing-images").getPublicUrl(path).data.publicUrl;
};

export default function PublicProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [p, setP] = useState(undefined); // undefined = loading, null = not found
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);

  const loadListings = async (offset) => {
    setBusy(true);
    const { data } = await supabase.rpc("get_user_listings", { p_user_id: id, p_limit: PAGE, p_offset: offset });
    if (data) {
      setItems((prev) => (offset ? [...prev, ...data.items] : data.items));
      setTotal(data.total);
    }
    setBusy(false);
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("get_public_profile_by_id", { p_id: id });
      const row = Array.isArray(data) ? data[0] : data;
      setP(row || null);
      if (row) loadListings(0);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (p === undefined) return <main className={styles.wrap} dir="rtl"><p className={styles.muted}>جارٍ التحميل...</p></main>;
  if (p === null) return <main className={styles.wrap} dir="rtl"><h1>المستخدم غير موجود</h1><Link href="/browse" className={styles.btn}>تصفح العقارات</Link></main>;

  const isMe = user?.id === p.id;
  const since = new Date(p.created_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long" });
  const display = p.office_name || p.full_name || p.username;

  return (
    <main className={styles.wrap} dir="rtl">
      <section className={styles.card}>
        <div className={styles.avatar} style={p.avatar_url ? { backgroundImage: `url(${p.avatar_url})` } : undefined}>
          {!p.avatar_url && (display || "؟")[0]}
        </div>
        <div className={styles.info}>
          <h1>{display}</h1>
          {p.office_name && p.full_name && <p className={styles.muted}>{p.full_name}</p>}
          <p className={styles.meta}>
            <span className={styles.tag}>{TYPES[p.account_type] || "مستخدم"}</span>
            <span>عضو منذ {since}</span>
            <span>{p.listings_count} إعلان منشور</span>
          </p>
          {p.bio && <p className={styles.bio}>{p.bio}</p>}
          {isMe && <Link href="/profile" className={styles.btn}>تعديل حسابي</Link>}
        </div>
      </section>

      <h2>إعلانات {display}</h2>
      {!busy && items.length === 0 && <p className={styles.muted}>لا توجد إعلانات منشورة حالياً.</p>}

      <div className={styles.grid}>
        {items.map((l) => {
          const img = coverUrl(l.cover_path);
          return (
            <Link key={l.id} href={`/listing/${l.id}`} className={styles.listing}>
              <div className={styles.cover} style={img ? { backgroundImage: `url(${img})` } : undefined}>
                <span className={styles.deal}>{DEALS[l.deal_type]}</span>
              </div>
              <div className={styles.lbody}>
                <strong>{l.title}</strong>
                <span className={styles.muted}>{[l.category_name_ar, l.region_name_ar].filter(Boolean).join(" • ")}</span>
                <span className={styles.price}>
                  {Number(l.price).toLocaleString("ar-EG")} جنيه · {Number(l.area).toLocaleString("ar-EG")} {UNITS[l.area_unit]}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {items.length < total && (
        <button type="button" className={styles.more} disabled={busy} onClick={() => loadListings(items.length)}>
          {busy ? "جارٍ التحميل..." : "عرض المزيد"}
        </button>
      )}
    </main>
  );
}
