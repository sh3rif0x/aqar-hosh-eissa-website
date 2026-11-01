"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { X, Link2, Send, MessageCircle, Camera, Share2, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import styles from "./ListingActions.module.css";

/* ---------- أدوات مشتركة ---------- */
function useListingId() {
  const p = useParams();
  const path = usePathname();
  return p?.id || (path || "").split("/").filter(Boolean).pop();
}
const pageTitle = () => (typeof document === "undefined" ? "" : document.title || "");
const pageUrl = () => (typeof window === "undefined" ? "" : window.location.href);
const pageImage = () => {
  if (typeof document === "undefined") return "";
  return document.querySelector('meta[property="og:image"]')?.content || "";
};
const ERR = {
  unauthenticated: "سجّل دخولك أولاً", blocked: "حسابك محظور", own_listing: "لا يمكنك مراسلة نفسك على إعلانك",
  listing_not_found: "الإعلان غير متاح", name_required: "اكتب اسمك", message_required: "اكتب رسالة لا تقل عن 5 أحرف",
  phone_required: "رقم الموبايل مطلوب", invalid_phone: "رقم الموبايل غير صحيح", rate_limited: "أرسلت رسائل كثيرة، حاول لاحقاً",
};
const errText = (e) => ERR[e?.message] || "حدث خطأ، حاول مرة أخرى";

function Modal({ title, sub, onClose, children }) {
  useEffect(() => {
    const key = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", key);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", key); document.body.style.overflow = prev; };
  }, [onClose]);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className={styles.bg} onMouseDown={onClose}>
      <div className={styles.box} dir="rtl" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <button type="button" className={styles.x} onClick={onClose} aria-label="إغلاق"><X size={18} /></button>
        <h2>{title}</h2>
        {sub && <p className={styles.sub}>{sub}</p>}
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ============ زر المشاركة + نافذة المنصات ============ */
export function ShareTrigger({ children, ...btn }) {
  const [open, setOpen] = useState(false);
  const [ctx, setCtx] = useState({ url: "", title: "", image: "" });
  const [copied, setCopied] = useState(false);

  const show = () => { setCtx({ url: pageUrl(), title: pageTitle(), image: pageImage() }); setCopied(false); setOpen(true); };
  const copy = async () => {
    try { await navigator.clipboard.writeText(ctx.url); } catch {
      const t = document.createElement("textarea"); t.value = ctx.url; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove();
    }
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  };
  const u = encodeURIComponent(ctx.url), t = encodeURIComponent(ctx.title);
  const platforms = [
    { k: "wa", label: "واتساب", bg: "#25d366", icon: <MessageCircle size={26} />, href: `https://wa.me/?text=${t}%20${u}` },
    { k: "fb", label: "فيسبوك", bg: "#1877f2", icon: <b className={styles.glyph}>f</b>, href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { k: "x", label: "إكس", bg: "#000", icon: <b className={styles.glyph}>𝕏</b>, href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
    { k: "tg", label: "تيليجرام", bg: "#229ed9", icon: <Send size={24} />, href: `https://t.me/share/url?url=${u}&text=${t}` },
    { k: "in", label: "لينكدإن", bg: "#0a66c2", icon: <b className={styles.glyph}>in</b>, href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    ...(ctx.image ? [{ k: "pi", label: "بنترست", bg: "#e60023", icon: <b className={styles.glyph}>P</b>, href: `https://pinterest.com/pin/create/button/?url=${u}&media=${encodeURIComponent(ctx.image)}&description=${t}` }] : []),
    { k: "ig", label: "انستجرام", bg: "linear-gradient(45deg,#f9a825,#e1306c,#7b3fe4)", icon: <Camera size={24} />, onClick: async () => { await copy(); window.open("https://www.instagram.com/", "_blank", "noopener"); } },
    { k: "cp", label: "نسخ الرابط", bg: "#5d6781", icon: <Link2 size={24} />, onClick: copy },
  ];
  const native = typeof navigator !== "undefined" && navigator.share;

  return (
    <>
      <button type="button" {...btn} onClick={show}>{children}</button>
      {open && (
        <Modal title="مشاركة الإعلان" sub="اختر المنصة التي تريد المشاركة عليها" onClose={() => setOpen(false)}>
          {ctx.image && <img className={styles.pic} src={ctx.image} alt="" />}
          <p className={styles.ttl}>{ctx.title}</p>
          <div className={styles.grid}>
            {platforms.map((p) => {
              const inner = (<><span className={styles.circle} style={{ background: p.bg }}>{p.icon}</span><span>{p.label}</span></>);
              return p.href
                ? <a key={p.k} className={styles.plat} href={p.href} target="_blank" rel="noopener noreferrer">{inner}</a>
                : <button key={p.k} type="button" className={styles.plat} onClick={p.onClick}>{inner}</button>;
            })}
          </div>
          {native && <button type="button" className={styles.ghost} onClick={() => navigator.share({ title: ctx.title, url: ctx.url }).catch(() => {})}><Share2 size={16} /> مشاركة عبر تطبيقات الجهاز</button>}
          <div className={styles.urlRow}>
            <button type="button" className={styles.copy} onClick={copy}>{copied ? <><Check size={15} /> تم النسخ</> : "نسخ"}</button>
            <input readOnly value={ctx.url} dir="ltr" onFocus={(e) => e.target.select()} />
          </div>
        </Modal>
      )}
    </>
  );
}

/* ============ زر الإبلاغ + نافذة النموذج ============ */
const REASONS = ["محتوى مخالف أو مضلل", "إعلان مكرر", "السعر غير حقيقي", "العقار غير متاح (تم بيعه / تأجيره)", "صور غير حقيقية", "احتيال أو نصب", "أخرى"];

export function ReportTrigger({ children, ...btn }) {
  const { user } = useAuth();
  const id = useListingId();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const show = () => { setOpen(true); setDone(false); setErr(""); };
  const close = () => { setOpen(false); setReason(""); setDetails(""); };
  const submit = async (e) => {
    e.preventDefault();
    if (!reason) return setErr("اختر سبب الإبلاغ");
    if (reason === "أخرى" && details.trim().length < 3) return setErr("اكتب تفاصيل المشكلة");
    setBusy(true); setErr("");
    const { error } = await supabase.rpc("create_report", { p_kind: "listing", p_listing_id: id, p_user_id: null, p_reason: reason, p_details: details.trim() || null });
    setBusy(false);
    if (error) return setErr(errText(error));
    setDone(true);
  };

  return (
    <>
      <button type="button" {...btn} onClick={show}>{children}</button>
      {open && (
        <Modal title="الإبلاغ عن إعلان" sub="ساعدنا في الحفاظ على جودة المنصة بالإبلاغ عن المخالفات" onClose={close}>
          {!user ? (
            <div className={styles.center}><p>سجّل دخولك لتتمكن من الإبلاغ.</p><Link className={styles.primary} href="/auth">تسجيل الدخول</Link></div>
          ) : done ? (
            <div className={styles.center}><p className={styles.okTxt}>✅ تم إرسال البلاغ، شكراً لمساعدتك. سنراجعه قريباً.</p><button type="button" className={styles.primary} onClick={close}>إغلاق</button></div>
          ) : (
            <form onSubmit={submit} className={styles.form}>
              <select value={reason} onChange={(e) => setReason(e.target.value)} className={styles.in}>
                <option value="">اختر سبب الإبلاغ</option>
                {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <textarea className={styles.in} rows={4} maxLength={500} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="تفاصيل إضافية (اختياري)" />
              {err && <p className={styles.err}>{err}</p>}
              <div className={styles.row}>
                <button type="button" className={styles.ghost} onClick={close}>إلغاء</button>
                <button className={styles.danger} disabled={busy}>{busy ? "جارٍ الإرسال..." : "إرسال الإبلاغ"}</button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}

/* ============ نموذج الرسالة المباشرة لصاحب الإعلان ============ */
export function InquiryForm() {
  const { user } = useAuth();
  const id = useListingId();
  const [f, setF] = useState({ name: "", phone: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setF((x) => ({ ...x, message: x.message || `مرحباً، أنا مهتم بهذا الإعلان: ${pageTitle().split("|")[0].trim()}` }));
  }, []);
  useEffect(() => {
    if (!user) return;
    supabase.rpc("get_my_profile").then(({ data }) => data && setF((x) => ({ ...x, name: x.name || data.full_name || "", phone: x.phone || data.phone || "" })));
  }, [user]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr("");
    const { error } = await supabase.rpc("send_listing_inquiry", { p_listing_id: id, p_name: f.name, p_phone: f.phone, p_message: f.message });
    setBusy(false);
    if (error) return setErr(errText(error));
    setSent(true);
  };

  return (
    <div className={styles.inq} dir="rtl">
      <h3>مهتم بهذا العقار؟</h3>
      {sent ? (
        <p className={styles.okTxt}>✅ تم إرسال رسالتك لصاحب الإعلان، وسيتواصل معك قريباً.</p>
      ) : !user ? (
        <p className={styles.hint}><Link href="/auth">سجّل دخولك</Link> لإرسال رسالة مباشرة لصاحب الإعلان.</p>
      ) : (
        <form onSubmit={submit} className={styles.form}>
          <label>الاسم<input required minLength={2} maxLength={80} className={styles.in} value={f.name} onChange={set("name")} /></label>
          <label>رقم الموبايل <b style={{ color: "#c0392b" }}>*</b><input type="tel" inputMode="tel" dir="ltr" required minLength={8} pattern="[+0-9 ]{8,16}" title="اكتب رقم موبايل صحيح" className={styles.in} value={f.phone} onChange={set("phone")} placeholder="01XXXXXXXXX" /></label>
          <label>الرسالة *<textarea required minLength={5} maxLength={1000} rows={3} className={styles.in} value={f.message} onChange={set("message")} /></label>
          {err && <p className={styles.err}>{err}</p>}
          <button className={styles.primary} disabled={busy}>{busy ? "جارٍ الإرسال..." : "إرسال الاستفسار"}</button>
          <small className={styles.hint}>بياناتك تصل لصاحب الإعلان فقط.</small>
        </form>
      )}
    </div>
  );
}
