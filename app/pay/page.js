"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import s from "../pricing/pricing.module.css";

const n = (v) => Number(v).toLocaleString("ar-EG");

export default function Pay() {
  const router = useRouter();
  const [b, setB] = useState(null);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState("");
  const [sent, setSent] = useState(false);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace("/auth"); return; }
    const { data, error } = await supabase.rpc("get_my_billing");
    if (error) return setErr("تعذر تحميل البيانات");
    if (!data.pending) { router.replace(data.account_type === "broker" ? "/pricing" : "/my-listings"); return; }
    setB(data); setSent(!!data.pending.transferred_at);
  }, [router]);
  useEffect(() => { load(); }, [load]);

  async function markSent() {
    const { error } = await supabase.rpc("mark_payment_sent", { p_id: b.pending.id });
    if (error) return setErr("تعذر تسجيل التحويل"); setSent(true);
  }
  function copy(k, t) { navigator.clipboard?.writeText(String(t)); setCopied(k); setTimeout(() => setCopied(""), 1500); }

  if (!b) return <main className={s.page}><p className={s.muted}>{err || "جارٍ التحميل..."}</p></main>;
  const p = b.pending, isFeature = p.kind === "feature";
  const link = isFeature && p.listing_id ? `${window.location.origin}/listing/${p.listing_id}` : "";
  const what = isFeature ? `تمييز إعلان «${p.listing_title || ""}» لمدة ${p.duration_days} يومًا` : `باقة ${p.plan_credits} إعلان — شهريًا`;
  const wa = `https://wa.me/${b.whatsapp}?text=` + encodeURIComponent(
`السلام عليكم، أودّ تأكيد عملية الدفع عبر ${b.method}:
• رقم الفاتورة: #${p.invoice_no}
• المبلغ: EGP ${p.amount}
• الطلب: ${what}
${isFeature ? `• رابط الإعلان: ${link}` : `• رقم حسابي على الموقع: ${b.account_id}`}
ومرفق صورة إيصال التحويل. برجاء التفعيل.`);

  return (
    <main className={s.page} dir="rtl">
      <div className={s.sheet}>
        <div className={s.hourglass}>⏳</div>
        <h1 className={s.center}>طلبك محجوز — تبقّت خطوة واحدة</h1>
        <p className={s.center}>رقم الفاتورة: <b className={s.red}>#{p.invoice_no}</b></p>
        <p className={`${s.center} ${s.muted}`}>{what}. لم يُخصم منك أي مبلغ بعد. حوّل القيمة إلى الرقم الموضح وأرسل لنا صورة الإيصال، وسنفعّل طلبك بعد التأكيد.</p>
        <div className={s.box}>
          <h3>الدفع عبر {b.method}</h3>
          <div className={s.two}>
            <div className={s.cell}><small>المبلغ المطلوب تحويله</small><b>EGP {n(p.amount)}</b></div>
            <div className={s.cell}><small>رقم {b.method}</small><b className={s.red} dir="ltr">{b.phone}</b>
              <button onClick={() => copy("ph", b.phone)}>{copied === "ph" ? "تم ✓" : "نسخ"}</button></div>
          </div>
          {isFeature ? (
            <div className={s.inv}>رقم الفاتورة: #{p.invoice_no} • الإعلان: <b>{p.listing_title || "—"}</b>
              <button onClick={() => copy("ln", link)}>{copied === "ln" ? "تم ✓" : "نسخ رابط الإعلان"}</button>
              <button onClick={() => copy("lid", p.listing_id)}>{copied === "lid" ? "تم ✓" : "نسخ رقم الإعلان"}</button></div>
          ) : (
            <div className={s.inv}>رقم الفاتورة: #{p.invoice_no} • رقم حسابك: <b dir="ltr">{b.account_id}</b>
              <button onClick={() => copy("id", b.account_id)}>{copied === "id" ? "تم ✓" : "نسخ رقم الحساب"}</button></div>
          )}
          <ol>
            <li>من تطبيق {b.method} حوّل المبلغ إلى الرقم الموضح بالأعلى.</li>
            <li>التقط صورة لإيصال التحويل (لقطة شاشة).</li>
            <li>اضغط «إرسال الإيصال على واتساب» وأرسل الصورة (الرسالة جاهزة وفيها {isFeature ? "رابط إعلانك" : "رقم حسابك"}).</li>
          </ol>
          <a className={s.wa} href={wa} target="_blank" rel="noopener noreferrer">إرسال الإيصال على واتساب</a>
          {!sent ? <button className={s.paid} onClick={markSent}>✈ حوّلت المبلغ</button>
                 : <p className={s.ok}>✓ تم تسجيل التحويل — سنراجع الإيصال ونفعّل طلبك، وسيصلك إشعار.</p>}
          <p className={s.warn}>⚠ لن يتم التفعيل إلا بعد استلامنا لإثبات التحويل وتأكيد الدفع.</p>
        </div>
        {err && <p className={s.err}>{err}</p>}
        <Link className={s.btn2} href="/my-listings">إعلاناتي</Link>
      </div>
    </main>
  );
}
