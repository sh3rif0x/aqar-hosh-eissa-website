"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
