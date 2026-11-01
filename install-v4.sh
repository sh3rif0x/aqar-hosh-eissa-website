#!/usr/bin/env bash
# bash install-v4.sh   (من داخل مجلد المشروع)
set -e
[ -d app ] || { echo "شغّل من مجلد المشروع"; exit 1; }
export SB_IMPORT='import { supabase } from "@/lib/supabase";'
mkdir -p app/pay app/pricing components app/dashboard/payments

# ───────── مودال تمييز الإعلان (3 مدد) ─────────
cat > components/FeatureModal.js <<'EOF'
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
__SB_IMPORT__

const n = (v) => Number(v).toLocaleString("ar-EG");
const css = `
@keyframes fmIn{from{opacity:0;transform:translateY(24px) scale(.96)}to{opacity:1;transform:none}}
.fm-back{position:fixed;inset:0;background:rgba(20,12,4,.65);backdrop-filter:blur(6px);z-index:9999;display:grid;place-items:center;padding:14px}
.fm-modal{width:100%;max-width:500px;max-height:94vh;overflow:auto;background:#fff;border-radius:28px;direction:rtl;animation:fmIn .35s ease;box-shadow:0 30px 80px rgba(0,0,0,.45);color:#1d1710}
.fm-head{background:linear-gradient(135deg,#b8741a,#e0a24a 55%,#f3c777);padding:28px 22px 24px;text-align:center;color:#fff;position:relative}
.fm-x{position:absolute;top:12px;left:14px;width:36px;height:36px;border-radius:50%;border:0;background:rgba(255,255,255,.25);color:#fff;font-size:1.3rem;cursor:pointer}
.fm-ico{width:70px;height:70px;border-radius:50%;background:rgba(255,255,255,.22);display:grid;place-items:center;font-size:2.1rem;margin:0 auto 8px}
.fm-head h2{margin:0;font-size:1.5rem}.fm-head p{margin:8px 0 0;font-size:.92rem;line-height:1.8;opacity:.95}
.fm-body{padding:18px}
.fm-opt{position:relative;display:flex;justify-content:space-between;align-items:center;gap:10px;border:2px solid #ecdcc3;border-radius:18px;padding:16px;margin-bottom:12px;background:#fffaf2;cursor:pointer;transition:.15s}
.fm-opt.on{border-color:#b8741a;background:linear-gradient(180deg,#fff3dc,#fff);box-shadow:0 0 0 4px rgba(184,116,26,.14)}
.fm-name{font-weight:800;font-size:1.1rem}.fm-day{font-size:.8rem;color:#7a6a55}
.fm-price{font-size:1.7rem;font-weight:900;color:#b8741a;line-height:1}.fm-price small{font-size:.8rem;font-weight:600;color:#6b5a44}
.fm-badge{position:absolute;top:-11px;right:16px;background:#16a34a;color:#fff;font-size:.75rem;font-weight:700;padding:2px 12px;border-radius:99px}
.fm-go{width:100%;padding:15px;border:0;border-radius:14px;background:linear-gradient(135deg,#b8741a,#d9942e);color:#fff;font-weight:800;font-size:1.05rem;cursor:pointer;box-shadow:0 8px 20px rgba(184,116,26,.35)}
.fm-go:disabled{opacity:.6}
.fm-feat{list-style:none;padding:0;margin:0 0 14px;font-size:.9rem;color:#4a3d2c}.fm-feat li:before{content:"✓ ";color:#16a34a;font-weight:800}
.fm-later{display:block;margin:6px auto 0;background:none;border:0;color:#7a6a55;text-decoration:underline;cursor:pointer;padding:8px}
.fm-err{color:#c0392b;text-align:center}
`;

export default function FeatureModal({ open, onClose, listing }) {
  const router = useRouter();
  const [plans, setPlans] = useState(null);
  const [sel, setSel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setErr("");
    supabase.rpc("get_my_billing").then(({ data }) => {
      const p = data?.feature_plans || [];
      setPlans(p); setSel(p.length ? p[p.length - 1].days : null);
    });
  }, [open]);
  if (!open || !listing) return null;

  async function go() {
    setBusy(true); setErr("");
    const { error } = await supabase.rpc("request_feature", { p_listing: listing.id, p_days: sel });
    setBusy(false);
    if (error) return setErr("تعذر إنشاء الطلب، حاول مرة أخرى");
    router.push("/pay");
  }
  const cur = plans?.find((p) => p.days === sel);
  const best = plans?.length ? plans[plans.length - 1].days : null;

  return (
    <div className="fm-back" onClick={onClose}>
      <style>{css}</style>
      <div className="fm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fm-head">
          <button className="fm-x" onClick={onClose} aria-label="إغلاق">×</button>
          <div className="fm-ico">⭐</div>
          <h2>ميّز إعلانك الآن</h2>
          <p>{listing.title ? `«${String(listing.title).slice(0, 60)}»` : "إعلانك"} يظهر في أعلى النتائج بشارة «مميز» ويحصل على مشاهدات أكثر.</p>
        </div>
        <div className="fm-body">
          {!plans && <p style={{ textAlign: "center" }}>جارٍ التحميل...</p>}
          {plans?.map((p) => (
            <div key={p.days} className={`fm-opt ${sel === p.days ? "on" : ""}`} onClick={() => setSel(p.days)}>
              {p.days === best && <span className="fm-badge">الأوفر</span>}
              <div><div className="fm-name">{p.label}</div><div className="fm-day">{n(Math.round(p.price / p.days))} جنيه / اليوم</div></div>
              <div className="fm-price">{n(p.price)} <small>جنيه</small></div>
            </div>
          ))}
          <ul className="fm-feat"><li>أعلى نتائج البحث</li><li>بشارة «مميز» على الإعلان</li><li>الدفع عبر إنستا باي وتفعيل بعد التأكيد</li></ul>
          {err && <p className="fm-err">{err}</p>}
          <button className="fm-go" disabled={busy || !cur} onClick={go}>{busy ? "جارٍ التجهيز..." : cur ? `تابع للدفع — ${n(cur.price)} جنيه` : "..."}</button>
          <button className="fm-later" onClick={onClose}>ليس الآن</button>
        </div>
      </div>
    </div>
  );
}
EOF

# ───────── زر «ميّز إعلانك الآن» لصاحب الإعلان ─────────
cat > components/FeatureButton.js <<'EOF'
"use client";
import { useEffect, useState } from "react";
__SB_IMPORT__
import FeatureModal from "./FeatureModal";

// الاستخدام: <FeatureButton listingId={id} title={listing.title} />
// يظهر لصاحب الإعلان فقط، ولا يظهر لغيره.
export default function FeatureButton({ listingId, title, style }) {
  const [st, setSt] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!listingId) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase.rpc("get_my_listing_feature", { p_id: listingId }).then(({ data }) => setSt(data || null));
    });
  }, [listingId]);

  if (!st?.is_owner || st.status === "rejected") return null;
  const until = st.is_featured && st.featured_until ? new Date(st.featured_until) : null;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={{
        width: "100%", padding: "13px 16px", border: 0, borderRadius: 14, cursor: "pointer", fontWeight: 800, fontSize: "1rem", color: "#fff",
        background: "linear-gradient(135deg,#b8741a,#d9942e)", boxShadow: "0 8px 20px rgba(184,116,26,.3)", ...style }}>
        {until ? `⭐ مميز حتى ${until.toLocaleDateString("ar-EG")} — جدّد` : "⭐ ميّز إعلانك الآن"}
      </button>
      <FeatureModal open={open} onClose={() => setOpen(false)} listing={{ id: listingId, title }} />
    </>
  );
}
EOF

# ───────── صفحة الدفع /pay (إنستا باي) ─────────
cat > app/pay/page.js <<'EOF'
"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
__SB_IMPORT__
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
  const what = isFeature ? `تمييز إعلان «${p.listing_title || ""}» لمدة ${p.duration_days} يومًا` : `باقة ${p.plan_credits} إعلان — شهريًا`;
  const wa = `https://wa.me/${b.whatsapp}?text=` + encodeURIComponent(
`السلام عليكم، أودّ تأكيد عملية الدفع عبر ${b.method}:
• رقم الفاتورة: #${p.invoice_no}
• المبلغ: EGP ${p.amount}
• الطلب: ${what}
• رقم حسابي على الموقع: ${b.account_id}
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
          <div className={s.inv}>رقم الفاتورة: #{p.invoice_no} • رقم حسابك: <b dir="ltr">{b.account_id}</b>
            <button onClick={() => copy("id", b.account_id)}>{copied === "id" ? "تم ✓" : "نسخ رقم الحساب"}</button></div>
          <ol>
            <li>من تطبيق {b.method} حوّل المبلغ إلى الرقم الموضح بالأعلى.</li>
            <li>التقط صورة لإيصال التحويل (لقطة شاشة).</li>
            <li>اضغط «إرسال الإيصال على واتساب» وأرسل الصورة (الرسالة جاهزة وفيها رقم حسابك).</li>
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
EOF

# ───────── صفحة الباقات /pricing (للسماسر والمكاتب فقط) ─────────
cat > app/pricing/page.js <<'EOF'
"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
__SB_IMPORT__
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
EOF
cat >> app/pricing/pricing.module.css <<'EOF'
.wide{max-width:980px;margin:0 auto;padding:20px 14px 64px;line-height:1.8}
.grid3{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px;margin:20px 0}
.plan{position:relative}.hot{border-color:#e5532d;box-shadow:0 0 0 4px rgba(229,83,45,.12)}
.tag{position:absolute;top:-12px;right:16px;background:#16a34a;color:#fff;font-size:.78rem;font-weight:700;padding:3px 12px;border-radius:99px}
EOF

# ───────── لوحة الأدمن ─────────
cat > app/dashboard/payments/page.js <<'EOF'
"use client";
import { useEffect, useState, useCallback } from "react";
__SB_IMPORT__

const TABS = [["pending", "قيد المراجعة"], ["approved", "مفعّلة"], ["rejected", "مرفوضة"]];

export default function AdminPayments() {
  const [tab, setTab] = useState("pending");
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("admin_list_payments", { p_status: tab, p_limit: 50, p_offset: 0 });
    if (error) setErr("غير مصرح أو حدث خطأ"); else { setErr(""); setItems(data.items); }
  }, [tab]);
  useEffect(() => { load(); }, [load]);

  async function review(id, approve) {
    let note = null;
    if (!approve) { note = window.prompt("سبب الرفض (يظهر للمستخدم):", ""); if (note === null) return; }
    else if (!window.confirm("تأكيد وصول التحويل وتفعيل الطلب؟")) return;
    setBusy(id);
    const { error } = await supabase.rpc("admin_review_payment", { p_id: id, p_approve: approve, p_note: note });
    setBusy("");
    if (error) setErr("تعذر تنفيذ العملية"); else load();
  }

  return (
    <div dir="rtl" style={{ padding: 16 }}>
      <h1>طلبات الدفع</h1>
      <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #ccc", fontWeight: tab === k ? 700 : 400, background: tab === k ? "#0a7d4f" : "#fff", color: tab === k ? "#fff" : "#111" }}>{l}</button>
        ))}
      </div>
      {err && <p style={{ color: "#c0392b" }}>{err}</p>}
      {!items.length && <p style={{ opacity: .6 }}>لا توجد طلبات</p>}
      <div style={{ display: "grid", gap: 12 }}>
        {items.map((r) => (
          <div key={r.id} style={{ border: "1px solid #e3e7eb", borderRadius: 14, padding: 14 }}>
            <div><b>{r.user_name || "مستخدم"}</b> — <span dir="ltr">{r.user_phone || "بدون رقم"}</span> • {r.account_type === "broker" ? "سمسار/مكتب" : "مستخدم"}</div>
            <div>فاتورة <b>#{r.invoice_no}</b> • رقم الحساب: <code>{r.account_id}</code></div>
            <div>
              {r.kind === "feature"
                ? <>⭐ <b>تمييز إعلان</b> «{r.listing_title || "—"}» لمدة <b>{r.duration_days} يوم</b>{r.listing_id && <> — <a href={`/listing/${r.listing_id}`} target="_blank" rel="noreferrer">عرض</a></>}</>
                : <>📦 <b>باقة حصة</b>: {r.plan_credits} إعلان</>}
              {" "}• المبلغ: <b>{r.amount} ج</b>
            </div>
            {r.transferred_at && r.status === "pending" && <div style={{ color: "#0a7d4f", fontWeight: 700 }}>✓ العميل ضغط «حوّلت المبلغ» — راجع واتساب</div>}
            <small style={{ opacity: .6 }}>{new Date(r.created_at).toLocaleString("ar-EG")}</small>
            {r.admin_note && <div style={{ opacity: .7 }}>ملاحظة: {r.admin_note}</div>}
            {r.status === "pending" && (
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button disabled={busy === r.id} onClick={() => review(r.id, true)} style={{ background: "#0a7d4f", color: "#fff", border: 0, borderRadius: 10, padding: "8px 16px" }}>تأكيد وتفعيل</button>
                <button disabled={busy === r.id} onClick={() => review(r.id, false)} style={{ background: "#fff", color: "#c0392b", border: "1px solid #c0392b", borderRadius: 10, padding: "8px 16px" }}>رفض</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
EOF

for f in components/FeatureModal.js components/FeatureButton.js app/pay/page.js app/pricing/page.js app/dashboard/payments/page.js; do
  perl -pi -e 's/__SB_IMPORT__/$ENV{SB_IMPORT}/' "$f"
done
# عدّل الـ import لو مسار supabase مختلف
G=$(grep -rlE "export (const|let) supabase\b" lib 2>/dev/null | head -1 || true)
if [ -n "$G" ]; then
  export P="import { supabase } from \"@/${G%.*}\";"
  for f in components/FeatureModal.js components/FeatureButton.js app/pay/page.js app/pricing/page.js app/dashboard/payments/page.js; do
    perl -pi -e 'BEGIN{$p=$ENV{P}} s|^import \{ supabase \} from "[^"]+";|$p|' "$f"
  done
fi
# مودال الحصة القديم يودّي على صفحة الدفع الجديدة
[ -f components/UpgradePopup.js ] && perl -pi -e 's|router\.push\("/pricing"\)|router.push("/pay")|' components/UpgradePopup.js
rm -f app/my-listings/FeatureToggle.js
echo "✓ تم: components/FeatureModal.js FeatureButton.js • /pay • /pricing • /dashboard/payments"
