"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import s from "./pricing.module.css";

const n = (v) => Number(v).toLocaleString("ar-EG");

export default function Pricing() {
  const router = useRouter();
  const [b, setB] = useState(null);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace("/auth"); return; }
    const { data, error } = await supabase.rpc("get_my_billing");
    if (error) return setErr("تعذر تحميل البيانات");
    if (data.account_type !== "broker") { router.replace("/"); return; }
    setB(data);
  }, [router]);
  useEffect(() => { load(); }, [load]);

  async function choose(credits) {
    setErr(""); setBusy(credits);
    const { error } = await supabase.rpc("request_payment", { p_credits: credits });
    setBusy(null);
    if (error) return setErr("تعذر إنشاء الطلب، حاول مرة أخرى");
    router.push("/pay");
  }
  if (!b) return <main className={s.page}><p className={s.muted}>{err || "جارٍ التحميل..."}</p></main>;
  const q = b.quota || {};
  const best = b.plans.length ? b.plans[b.plans.length - 1].credits : null;

  return (
    <main className={s.wide} dir="rtl">
      <h1 className={s.center}>باقات الإعلانات</h1>
      <p className={`${s.center} ${s.muted}`}>للسماسر والمكاتب العقارية — انشر عددًا أكبر من الإعلانات.</p>
      <div className={s.stats}>
        <div><b>{n(q.used || 0)} / {n(q.limit || 0)}</b><span>إعلاناتك المستخدمة</span></div>
        <div><b>{n(q.remaining || 0)}</b><span>المتبقي للنشر</span></div>
      </div>
      {b.plan_expires_at && <p className={`${s.center} ${s.muted}`}>باقتك سارية حتى {new Date(b.plan_expires_at).toLocaleDateString("ar-EG")}</p>}
      {err && <p className={s.err}>{err}</p>}
      <section className={s.grid3}>
        <div className={s.plan}>
          <h2>مجانية</h2>
          <div className={s.price}>0 <small>جنيه</small></div>
          <ul><li>{n(b.free_limit)} إعلانات مجانًا</li><li>مراجعة قبل النشر</li></ul>
          <button className={s.btn} disabled style={{ background: "#9aa4ad" }}>{b.extra_ads > 0 ? "الباقة الأساسية" : "باقتك الحالية"}</button>
        </div>
        {b.plans.map((pl) => (
          <div key={pl.credits} className={`${s.plan} ${pl.credits === best ? s.hot : ""}`}>
            {pl.credits === best && <span className={s.tag}>الأكثر توفيرًا</span>}
            <h2>{pl.label}</h2>
            <div className={s.price}>{n(pl.price)} <small>جنيه</small></div>
            <ul><li>{n(b.free_limit)} مجانًا + {n(pl.credits)} إعلان إضافي</li><li>اشتراك شهري (30 يومًا)</li><li>دعم عبر واتساب</li></ul>
            <button className={s.btn} disabled={busy === pl.credits} onClick={() => choose(pl.credits)}>{busy === pl.credits ? "..." : "اشترك وادفع"}</button>
          </div>
        ))}
      </section>
      <p className={`${s.center} ${s.muted}`}>تريد إبراز إعلان معيّن؟ افتح إعلانك واضغط «ميّز إعلانك الآن» (أسبوع / 14 يوم / شهر).</p>
      <p className={s.center}><Link href="/my-listings">← إعلاناتي</Link></p>
    </main>
  );
}
