"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const DAYS = [[7, "أسبوع", 150], [14, "14 يوم", 210], [30, "شهر", 380]];
const ERR = {
  forbidden: "ليس لديك صلاحية",
  listing_not_published: "يمكن تمييز الإعلانات المنشورة فقط",
  invalid_plan: "باقة غير صحيحة",
  listing_not_found: "الإعلان غير موجود",
};
const fmt = (d) => d.toLocaleString("ar-EG", { dateStyle: "full", timeStyle: "short" });

export default function AdminFeatureButton({ l, onDone, className }) {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(7);
  const [prices, setPrices] = useState({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    supabase.from("site_settings").select("value").eq("key", "payment").maybeSingle().then(({ data }) => {
      const m = {}; (data?.value?.feature_plans || []).forEach((p) => { m[p.days] = p.price; }); setPrices(m);
    });
  }, [open]);

  const active = l.is_featured && l.featured_until && new Date(l.featured_until) > new Date();
  const base = active ? new Date(l.featured_until) : new Date();
  const until = new Date(base.getTime() + days * 864e5);

  async function apply(d) {
    setBusy(true); setErr("");
    const { error } = await supabase.rpc("admin_set_feature_plan", { p_id: l.id, p_days: d });
    setBusy(false);
    if (error) return setErr(ERR[error.message] || "تعذر التنفيذ");
    setOpen(false); onDone && onDone(d == null ? "أُلغي التمييز" : "تم التمييز");
  }
  const remove = () => { if (window.confirm("إلغاء تمييز هذا الإعلان؟")) apply(null); };

  return (
    <>
      <button className={className} onClick={() => setOpen(true)}>{l.is_featured ? "تمديد التمييز" : "تمييز"}</button>
      {l.is_featured && <button className={className} onClick={remove}>إلغاء التمييز</button>}
      {open && (
        <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "grid", placeItems: "center", zIndex: 100 }}>
          <div onClick={(e) => e.stopPropagation()} dir="rtl" style={{ background: "#fff", borderRadius: 16, padding: 20, width: "min(440px, 92vw)", display: "grid", gap: 12, textAlign: "right" }}>
            <h3 style={{ margin: 0 }}>{l.is_featured ? "تمديد تمييز" : "تمييز"}: {l.title}</h3>
            <p style={{ margin: 0, opacity: .7 }}>
              {!l.is_featured ? "الإعلان غير مميز حاليًا." : l.featured_until ? `مميز حاليًا حتى ${fmt(new Date(l.featured_until))}.` : "مميز حاليًا بدون تاريخ انتهاء (دائم). التمييز الجديد هيبدأ من الآن وينتهي في التاريخ المحدد."}
            </p>
            <div style={{ display: "grid", gap: 8 }}>
              {DAYS.map(([d, label, price]) => (
                <button key={d} onClick={() => setDays(d)} style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", borderRadius: 12, border: days === d ? "2px solid #0a7d4f" : "1px solid #ccc", background: days === d ? "#eaf6f0" : "#fff", fontWeight: days === d ? 700 : 400 }}>
                  <span>{label}</span><span>{prices[d] ?? price} ج.م</span>
                </button>
              ))}
            </div>
            <p style={{ margin: 0 }}>ينتهي التمييز: <b>{fmt(until)}</b></p>
            {err && <p style={{ color: "#c0392b", margin: 0 }}>{err}</p>}
            <div style={{ display: "flex", gap: 8 }}>
              <button disabled={busy} onClick={() => apply(days)} style={{ background: "#0a7d4f", color: "#fff", border: 0, borderRadius: 10, padding: "8px 20px" }}>{busy ? "..." : "تأكيد التمييز"}</button>
              <button onClick={() => setOpen(false)} style={{ borderRadius: 10, padding: "8px 20px", border: "1px solid #ccc", background: "#fff" }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
