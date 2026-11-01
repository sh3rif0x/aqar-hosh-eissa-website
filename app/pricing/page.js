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
  const [copied, setCopied] = useState("");
  const [sent, setSent] = useState(false);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace("/auth"); return; }
    const { data, error } = await supabase.rpc("get_my_billing");
    if (error) setErr("تعذر تحميل البيانات، حاول مرة أخرى"); else { setB(data); setSent(!!data.pending?.transferred_at); }
  }, [router]);
  useEffect(() => { load(); }, [load]);

  async function choose(credits) {
    setErr(""); setBusy(credits);
    const { error } = await supabase.rpc("request_payment", { p_credits: credits });
    setBusy(null);
    if (error) return setErr("تعذر إنشاء الطلب، حاول مرة أخرى");
    load();
  }
  async function markSent() {
    const { error } = await supabase.rpc("mark_payment_sent", { p_id: b.pending.id });
    if (error) return setErr("تعذر تسجيل التحويل"); setSent(true);
  }
  function copy(key, text) {
    navigator.clipboard?.writeText(String(text));
    setCopied(key); setTimeout(() => setCopied(""), 1500);
  }

  if (!b) return <main className={s.page}><p className={s.muted}>{err || "جارٍ التحميل..."}</p></main>;
  const p = b.pending;
  const isBroker = b.account_type === "broker";
  const wa = p && `https://wa.me/${b.whatsapp}?text=` + encodeURIComponent(
`السلام عليكم، أودّ تأكيد عملية الدفع عبر ${b.method}:
• رقم الفاتورة: #${p.invoice_no}
• المبلغ: EGP ${p.amount}
• رقم حسابي على الموقع: ${b.account_id}
• الباقة: ${p.plan_credits} ${isBroker ? "إعلان مميز" : "تمييز إعلان"}
ومرفق صورة إيصال التحويل. برجاء تفعيل الباقة على حسابي.`);

  if (p) return (
    <main className={s.page} dir="rtl">
      <div className={s.sheet}>
        <div className={s.hourglass}>⏳</div>
        <h1 className={s.center}>طلبك محجوز — تبقّت خطوة واحدة</h1>
        <p className={s.center}>رقم الفاتورة: <b className={s.red}>#{p.invoice_no}</b></p>
        <p className={`${s.center} ${s.muted}`}>لم يُخصم منك أي مبلغ بعد. حوّل القيمة إلى الرقم الموضح أدناه وأرسل لنا صورة الإيصال، وسنفعّل طلبك بعد استلامها وتأكيد الدفع.</p>

        <div className={s.box}>
          <h3>الدفع عبر {b.method}</h3>
          <div className={s.two}>
            <div className={s.cell}><small>المبلغ المطلوب تحويله</small><b>EGP {n(p.amount)}</b></div>
            <div className={s.cell}><small>رقم {b.method}</small>
              <b className={s.red} dir="ltr">{b.phone}</b>
              <button onClick={() => copy("ph", b.phone)}>{copied === "ph" ? "تم ✓" : "نسخ"}</button></div>
          </div>
          <div className={s.inv}>رقم الفاتورة: #{p.invoice_no} • رقم حسابك: <b dir="ltr">{b.account_id}</b>
            <button onClick={() => copy("id", b.account_id)}>{copied === "id" ? "تم ✓" : "نسخ رقم الحساب"}</button></div>
          <ol>
            <li>من تطبيق {b.method} حوّل المبلغ إلى الرقم الموضح بالأعلى.</li>
            <li>التقط صورة لإيصال التحويل أو لرسالة التأكيد (لقطة شاشة).</li>
            <li>اضغط «إرسال الإيصال على واتساب» وأرسل لنا صورة التحويل (الرسالة جاهزة وتحتوي رقم حسابك).</li>
          </ol>
          <a className={s.wa} href={wa} target="_blank" rel="noopener noreferrer">إرسال الإيصال على واتساب</a>
          {!sent
            ? <button className={s.paid} onClick={markSent}>✈ حوّلت المبلغ</button>
            : <p className={s.ok}>✓ تم تسجيل التحويل — سنراجع الإيصال ونفعّل حسابك، وسيصلك إشعار.</p>}
          <p className={s.warn}>⚠ لن يتم تفعيل طلبك إلا بعد استلامنا لإثبات التحويل وتأكيد الدفع.</p>
        </div>

        <p className={s.after}>بعد التفعيل: {isBroker ? `تنشر ${n(p.plan_credits)} إعلان جديد أو تميّز ${n(p.plan_credits)} من إعلاناتك القديمة` : "يظهر إعلانك مميزًا بالأعلى"} لمدة 30 يومًا من صفحة «إعلاناتي».</p>
        <Link className={s.btn2} href="/my-listings">إعلاناتي</Link>
        <button className={s.link} onClick={async () => { await supabase.rpc("request_payment", { p_credits: p.plan_credits === b.plans[0].credits && b.plans[1] ? b.plans[1].credits : b.plans[0].credits }); load(); }}>تغيير الباقة</button>
      </div>
    </main>
  );

  return (
    <main className={s.page} dir="rtl">
      <h1>{isBroker ? "باقات الإعلانات الشهرية" : "ميّز إعلانك"}</h1>
      <p className={s.muted}>{isBroker ? "أول 3 إعلانات مجانًا. اشترك لتنشر المزيد وتميّز إعلاناتك القديمة والجديدة." : "اجعل إعلانك في أعلى النتائج بشارة «مميز»."}</p>
      <div className={s.stats}>
        <div><b>{n(b.feature_credits)}</b><span>رصيد التمييز</span></div>
        <div><b>{n(b.featured_count)}</b><span>إعلانات مميزة</span></div>
      </div>
      {b.plan_expires_at && <p className={s.muted}>باقتك سارية حتى {new Date(b.plan_expires_at).toLocaleDateString("ar-EG")}</p>}
      {err && <p className={s.err}>{err}</p>}
      <section className={s.plans}>
        {b.plans.map((pl) => (
          <div key={pl.credits} className={s.plan}>
            <h2>{pl.label}</h2>
            <div className={s.price}>{n(pl.price)} <small>جنيه</small></div>
            <ul>
              {isBroker ? (<><li>نشر {n(pl.credits)} إعلان إضافي</li><li>تمييز {n(pl.credits)} إعلان بالأعلى</li><li>تمييز إعلاناتك القديمة أيضًا</li><li>اشتراك شهري (30 يومًا)</li></>)
                        : (<><li>إعلانك في أعلى النتائج</li><li>بشارة «مميز»</li><li>مدة 30 يومًا</li></>)}
            </ul>
            <button className={s.btn} disabled={busy === pl.credits} onClick={() => choose(pl.credits)}>{busy === pl.credits ? "..." : "اشترك وادفع"}</button>
          </div>
        ))}
      </section>
      {b.history?.length > 0 && (
        <section className={s.hist}>
          <h3>طلباتي السابقة</h3>
          {b.history.map((h) => (
            <div key={h.id} className={s.row}>
              <span>#{h.invoice_no} — {n(h.plan_credits)} — {n(h.amount)} ج</span>
              <span className={s[h.status]}>{{ pending: "قيد المراجعة", approved: "مفعّلة", rejected: "مرفوضة" }[h.status]}</span>
            </div>
          ))}
        </section>
      )}
      <p><Link href="/my-listings">← إعلاناتي</Link></p>
    </main>
  );
}
