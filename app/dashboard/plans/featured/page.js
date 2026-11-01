"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const ERR = {
  forbidden: "هذه العملية للسوبر أدمن فقط",
  date_in_past: "التاريخ لازم يكون في المستقبل",
  listing_not_published: "يمكن تمييز الإعلانات المنشورة فقط",
  listing_not_found: "الإعلان غير موجود",
};
const pad = (n) => String(n).padStart(2, "0");
const toInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const inDays = (n) => toInput(new Date(Date.now() + n * 864e5).toISOString());
const fmt = (iso) => (iso ? new Date(iso).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" }) : "—");

export default function FeaturedAdmin() {
  const [items, setItems] = useState([]);
  const [onlyFeat, setOnlyFeat] = useState(false);
  const [q, setQ] = useState("");
  const [isSuper, setIsSuper] = useState(false);
  const [edit, setEdit] = useState(null);
  const [until, setUntil] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => { supabase.rpc("get_my_profile").then(({ data }) => setIsSuper(data?.role === "super_admin")); }, []);

  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("q");
    if (v) setQ(v);
  }, []);

  const load = useCallback(async () => {
    let query = supabase.from("listings").select("id,title,status,is_featured,featured_until,feature_paid")
      .eq("status", "published").order("is_featured", { ascending: false }).order("featured_until", { ascending: false, nullsFirst: false }).limit(100);
    if (onlyFeat) query = query.eq("is_featured", true);
    const t = q.trim();
    if (t) {
      const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const ors = [`title.ilike.%${t.replace(/[,()%*]/g, " ")}%`];
      if (UUID.test(t)) ors.push(`id.eq.${t}`, `user_id.eq.${t}`);
      const bf = [`ref_code.ilike.%${t.replace(/[,()%*]/g, " ")}%`];
      if (/^\d{1,15}$/.test(t)) bf.push(`invoice_no.eq.${t}`);
      if (UUID.test(t)) bf.push(`id.eq.${t}`);
      try {
        const { data: bills } = await supabase.from("payment_requests").select("listing_id,user_id").or(bf.join(",")).limit(50);
        const lids = [...new Set((bills || []).map((b) => b.listing_id).filter(Boolean))];
        const uids = [...new Set((bills || []).filter((b) => !b.listing_id).map((b) => b.user_id).filter(Boolean))];
        if (lids.length) ors.push(`id.in.(${lids.join(",")})`);
        if (uids.length) ors.push(`user_id.in.(${uids.join(",")})`);
      } catch (_) {}
      query = query.or(ors.join(","));
    }
    const { data, error } = await query;
    if (error) setErr("حدث خطأ في التحميل"); else { setErr(""); setItems(data || []); }
  }, [onlyFeat, q]);
  useEffect(() => { load(); }, [load]);

  const open = (l) => { setEdit(l); setUntil(toInput(l.featured_until)); setErr(""); };

  async function save(clear) {
    if (!clear && !until) return setErr("حدد تاريخ الانتهاء");
    setBusy(true);
    const { error } = await supabase.rpc("admin_set_listing_feature", { p_listing: edit.id, p_until: clear ? null : new Date(until).toISOString() });
    setBusy(false);
    if (error) return setErr(ERR[error.message] || "تعذر الحفظ");
    setEdit(null); load();
  }

  return (
    <div dir="rtl" style={{ padding: 16 }}>
      <h1>تمييز الإعلانات</h1>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" }}>
        <button onClick={() => setOnlyFeat(false)} style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #ccc", background: !onlyFeat ? "#0a7d4f" : "#fff", color: !onlyFeat ? "#fff" : "#111" }}>كل المنشورة</button>
        <button onClick={() => setOnlyFeat(true)} style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #ccc", background: onlyFeat ? "#0a7d4f" : "#fff", color: onlyFeat ? "#fff" : "#111" }}>المميزة فقط</button>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث: عنوان / رقم الإعلان / رقم الفاتورة / رقم الحساب" style={{ padding: 8, borderRadius: 10, border: "1px solid #ccc", marginInlineStart: "auto", minWidth: 280 }} />
      </div>
      {err && !edit && <p style={{ color: "#c0392b" }}>{err}</p>}
      <div style={{ display: "grid", gap: 10 }}>
        {items.map((l) => (
          <div key={l.id} style={{ border: "1px solid #e3e7eb", borderRadius: 14, padding: 14, display: "grid", gap: 4 }}>
            <div><Link href={`/listing/${l.id}`} target="_blank"><b>{l.title}</b></Link> {l.is_featured && <span style={{ background: "#b8731f", color: "#fff", borderRadius: 8, padding: "2px 10px", fontSize: 13 }}>⭐ مميز</span>}</div>
            <div>ينتهي التمييز: <b>{l.is_featured ? (l.featured_until ? fmt(l.featured_until) : "بدون تاريخ (دائم)") : "—"}</b>{l.feature_paid ? " • مدفوع" : ""}</div>
            <div dir="ltr" style={{ fontSize: 12, opacity: .55, textAlign: "right" }}>ID: {l.id}</div>
            {isSuper && <div><button onClick={() => open(l)} style={{ marginTop: 6, padding: "6px 16px", borderRadius: 10, border: "1px solid #0a7d4f", background: "#fff", color: "#0a7d4f" }}>تعديل التمييز</button></div>}
          </div>
        ))}
        {!items.length && <p style={{ opacity: .6 }}>لا توجد إعلانات</p>}
      </div>

      {edit && (
        <div onClick={() => setEdit(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "grid", placeItems: "center", zIndex: 50 }}>
          <div onClick={(e) => e.stopPropagation()} dir="rtl" style={{ background: "#fff", borderRadius: 16, padding: 20, width: "min(440px, 92vw)", display: "grid", gap: 12 }}>
            <h3 style={{ margin: 0 }}>تمييز: {edit.title}</h3>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[[7, "أسبوع"], [14, "14 يوم"], [30, "شهر"]].map(([d, l]) => <button key={d} onClick={() => setUntil(inDays(d))} style={{ padding: "6px 12px", borderRadius: 10, border: "1px solid #ccc", background: "#f6f7f8" }}>{l} من الآن</button>)}
            </div>
            <label>تاريخ ووقت انتهاء التمييز
              <input type="datetime-local" value={until} onChange={(e) => setUntil(e.target.value)} style={{ width: "100%", padding: 8, borderRadius: 10, border: "1px solid #ccc" }} />
            </label>
            {err && <p style={{ color: "#c0392b", margin: 0 }}>{err}</p>}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button disabled={busy} onClick={() => save(false)} style={{ background: "#0a7d4f", color: "#fff", border: 0, borderRadius: 10, padding: "8px 20px" }}>{busy ? "..." : "حفظ"}</button>
              {edit.is_featured && <button disabled={busy} onClick={() => save(true)} style={{ background: "#fff", color: "#c0392b", border: "1px solid #c0392b", borderRadius: 10, padding: "8px 20px" }}>إلغاء التمييز</button>}
              <button onClick={() => setEdit(null)} style={{ borderRadius: 10, padding: "8px 20px", border: "1px solid #ccc", background: "#fff" }}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
