"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const n = (v) => Number(v).toLocaleString("ar-EG");
const css = `
@keyframes upIn{from{opacity:0;transform:translateY(24px) scale(.96)}to{opacity:1;transform:none}}
.up-back{position:fixed;inset:0;background:rgba(20,12,4,.65);backdrop-filter:blur(6px);z-index:9999;display:grid;place-items:center;padding:14px}
.up-modal{width:100%;max-width:520px;max-height:94vh;overflow:auto;background:#fff;border-radius:28px;direction:rtl;animation:upIn .35s ease;box-shadow:0 30px 80px rgba(0,0,0,.45);color:#1d1710}
.up-head{background:linear-gradient(135deg,#b8741a 0%,#e0a24a 55%,#f3c777 100%);padding:30px 22px 26px;text-align:center;color:#fff;position:relative}
.up-x{position:absolute;top:12px;left:14px;width:36px;height:36px;border-radius:50%;border:0;background:rgba(255,255,255,.25);color:#fff;font-size:1.3rem;cursor:pointer}
.up-ico{width:72px;height:72px;border-radius:50%;background:rgba(255,255,255,.22);display:grid;place-items:center;font-size:2.2rem;margin:0 auto 10px}
.up-head h2{margin:0;font-size:1.55rem}
.up-head p{margin:8px 0 0;opacity:.95;font-size:.95rem;line-height:1.8}
.up-body{padding:20px 18px 22px}
.up-plan{position:relative;border:2px solid #ecdcc3;border-radius:20px;padding:18px;margin-bottom:14px;background:#fffaf2;transition:.2s}
.up-plan:hover{border-color:#b8741a;transform:translateY(-2px)}
.up-plan.best{border-color:#b8741a;background:linear-gradient(180deg,#fff6e6,#fff)}
.up-badge{position:absolute;top:-12px;right:18px;background:#16a34a;color:#fff;font-size:.78rem;font-weight:700;padding:3px 12px;border-radius:99px}
.up-row{display:flex;justify-content:space-between;align-items:center;gap:10px}
.up-name{font-weight:800;font-size:1.1rem}
.up-price{font-size:2rem;font-weight:900;color:#b8741a;line-height:1}
.up-price small{font-size:.85rem;font-weight:600;color:#6b5a44}
.up-list{margin:12px 0 14px;padding:0;list-style:none;font-size:.9rem;color:#4a3d2c}
.up-list li:before{content:"✓ ";color:#16a34a;font-weight:800}
.up-go{width:100%;padding:14px;border:0;border-radius:14px;background:linear-gradient(135deg,#b8741a,#d9942e);color:#fff;font-weight:800;font-size:1.05rem;cursor:pointer;box-shadow:0 8px 20px rgba(184,116,26,.35)}
.up-go:disabled{opacity:.6}
.up-later{display:block;margin:6px auto 0;background:none;border:0;color:#7a6a55;text-decoration:underline;cursor:pointer;padding:8px}
.up-err{color:#c0392b;text-align:center}
`;

// mode="quota": السمسار استهلك الـ 3 المجانية  |  mode="owner": تمييز إعلان بـ 50 جنيه
export default function UpgradePopup({ open, onClose, mode = "quota" }) {
  const router = useRouter();
  const [b, setB] = useState(null);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setErr("");
    supabase.rpc("get_my_billing").then(({ data }) => setB(data));
  }, [open]);
  if (!open) return null;

  async function choose(credits) {
    setBusy(credits); setErr("");
    const { error } = await supabase.rpc("request_payment", { p_credits: credits });
    setBusy(null);
    if (error) return setErr("تعذر إنشاء الطلب، حاول مرة أخرى");
    router.push("/pricing");
  }
  const q = mode === "quota";
  const best = b?.plans?.length > 1 ? b.plans[b.plans.length - 1].credits : null;

  return (
    <div className="up-back" onClick={onClose}>
      <style>{css}</style>
      <div className="up-modal" onClick={(e) => e.stopPropagation()}>
        <div className="up-head">
          <button className="up-x" onClick={onClose} aria-label="إغلاق">×</button>
          <div className="up-ico">{q ? "🚀" : "⭐"}</div>
          <h2>{q ? "استخدمت إعلاناتك المجانية الـ 3" : "ميّز إعلانك واظهر في الأعلى"}</h2>
          <p>{q ? "اشترك في باقة شهرية لتنشر المزيد من الإعلانات وتميّز إعلاناتك القديمة والجديدة." : "إعلانك يظهر أولًا بشارة «مميز» لمدة 30 يومًا."}</p>
        </div>
        <div className="up-body">
          {!b && <p style={{ textAlign: "center" }}>جارٍ التحميل...</p>}
          {b?.plans?.map((pl) => (
            <div key={pl.credits} className={`up-plan ${pl.credits === best ? "best" : ""}`}>
              {pl.credits === best && <span className="up-badge">الأكثر توفيرًا</span>}
              <div className="up-row">
                <span className="up-name">{pl.label}</span>
                <span className="up-price">{n(pl.price)} <small>جنيه</small></span>
              </div>
              <ul className="up-list">
                {q ? (<><li>نشر {n(pl.credits)} إعلان إضافي</li><li>تمييز {n(pl.credits)} إعلان بالأعلى</li><li>تمييز إعلاناتك القديمة أيضًا</li><li>اشتراك شهري 30 يومًا</li></>)
                   : (<><li>أعلى نتائج البحث</li><li>بشارة «مميز»</li><li>مدة 30 يومًا</li></>)}
              </ul>
              <button className="up-go" disabled={busy === pl.credits} onClick={() => choose(pl.credits)}>
                {busy === pl.credits ? "جارٍ التجهيز..." : "اشترك وادفع الآن"}
              </button>
            </div>
          ))}
          {err && <p className="up-err">{err}</p>}
          <button className="up-later" onClick={onClose}>{q ? "لاحقًا" : "ليس الآن"}</button>
        </div>
      </div>
    </div>
  );
}
