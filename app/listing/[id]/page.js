"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Phone, MessageCircle, Share2, Heart, MapPin, Maximize, Building2, Flag, Pencil } from "lucide-react";
import { listings, favorites } from "@/lib/api";
import { normalize } from "@/lib/normalize";
import { useAuth } from "@/lib/AuthContext";
import { waLink } from "@/components/PropertyCard";
import FeatureButton from "@/components/FeatureButton";
import AdvertiserLink from "@/components/AdvertiserLink";
import AdminFeatureButton from "@/components/AdminFeatureButton";
import { supabase } from "@/lib/supabase";
import { arErr } from "@/lib/arabic";

import { ShareTrigger, ReportTrigger, InquiryForm } from "@/components/ListingActions";
export default function ListingPage({ params }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [raw, setRaw] = useState(undefined);
  const [img, setImg] = useState(0);
  const [fav, setFav] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.rpc("get_my_profile").then(({ data }) => setIsAdmin(["admin", "super_admin"].includes(data?.role))).catch(() => {});
  }, [user]);

  useEffect(() => {
    listings.get(id).then((d) => { setRaw(d); setFav(!!d?.is_favorite); }).catch(() => setRaw(null));
  }, [id]);

  if (raw === undefined) return <section className="section"><div className="container"><div className="card skel" /></div></section>;
  if (!raw) return <section className="section"><div className="container"><p className="empty">الإعلان غير موجود.</p></div></section>;

  const p = normalize(raw);
  const isMine = user && raw.user_id === user.id;
  const images = (raw.images || []).map((i) => i.storage_path);
  const d = raw.details || {};

  const A_STATUS = { pending: "قيد المراجعة", published: "منشور", rejected: "مرفوض" };
  const fmtDT = (v) => (v ? new Date(v).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" }) : "—");
  const reloadRaw = () => listings.get(id).then((x) => setRaw(x)).catch(() => {});
  const aRun = async (fn, okMsg, confirmText, after) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    try { await fn(); alert(okMsg); if (after) after(); else await reloadRaw(); }
    catch (e) { alert(arErr(e)); }
    finally { setBusy(false); }
  };
  const aApprove = () => aRun(async () => {
    const { error } = await supabase.rpc("admin_review_listing", { p_id: id, p_decision: "approve" }); if (error) throw error;
  }, "تم نشر الإعلان");
  const aReject = () => {
    const r = window.prompt("سبب الرفض (سيظهر للمعلن):");
    if (r && r.trim()) aRun(async () => {
      const { error } = await supabase.rpc("admin_review_listing", { p_id: id, p_decision: "reject", p_reason: r.trim() }); if (error) throw error;
    }, "تم رفض الإعلان");
  };
  const aDelete = () => aRun(async () => {
    const { error } = await supabase.from("listings").delete().eq("id", id); if (error) throw error;
  }, "تم حذف الإعلان", "حذف الإعلان نهائيًا؟", () => router.push("/dashboard/admin"));

  const toggleFav = async () => {
    if (!user) return router.push("/auth?reason=favorite");
    setFav(!fav); try { await favorites.toggle(id); } catch { setFav(fav); }
  };
  const share = async () => {
    const url = location.href;
    if (navigator.share) navigator.share({ title: p.title, url }).catch(() => {});
    else { await navigator.clipboard.writeText(url); alert("تم نسخ الرابط"); }
  };

  const rows = [
    d.rooms != null && ["الغرف", d.rooms], d.bathrooms != null && ["الحمامات", d.bathrooms],
    d.floor != null && ["الدور", d.floor], d.finishing && ["التشطيب", { unfinished: "بدون تشطيب", semi_finished: "نصف تشطيب", fully_finished: "تشطيب كامل", super_lux: "سوبر لوكس" }[d.finishing]],
    d.soil_type && ["نوع التربة", { clay: "طينية", sandy: "رملية", loamy: "طميية", silty: "غرينية", rocky: "صخرية" }[d.soil_type]],
    d.water_source && ["مصدر المياه", { canal: "ترعة", well: "بئر", rain: "أمطار", mixed: "مختلط", none: "لا يوجد" }[d.water_source]],
    d.floors_count != null && ["عدد الأدوار", d.floors_count], d.units_count != null && ["عدد الوحدات", d.units_count],
  ].filter(Boolean);

  return (
    <section className="section">
      <div className="container detail">
        <div>
          <div className="gal-main" style={{ background: images[img] ? `url(${images[img]}) center/cover` : "#e6dfd3" }} />
          {images.length > 1 && (
            <div className="gal-thumbs">
              {images.map((src, i) => <button key={i} className={i === img ? "on" : ""} style={{ background: `url(${src}) center/cover` }} onClick={() => setImg(i)} />)}
            </div>
          )}
          <h2 className="d-title">{p.title}</h2>
          <ul className="meta big">
            <li><Maximize size={16} /> {p.area} {p.unit}</li>
            <li><Building2 size={16} /> {p.type}</li>
            <li><MapPin size={16} /> {p.location}</li>
          </ul>
          {raw.description && <><h3 className="d-sub">الوصف</h3><p className="d-desc">{raw.description}</p></>}
          {rows.length > 0 && (
            <><h3 className="d-sub">التفاصيل</h3>
              <div className="d-rows">{rows.map(([k, v]) => <div key={k}><span>{k}</span><strong>{v}</strong></div>)}</div></>
          )}
          {(p.location || (raw.lat != null && raw.lng != null)) && (() => {
            const has = raw.lat != null && raw.lng != null;
            const q = has ? `${raw.lat},${raw.lng}` : `${p.location}, مصر`;
            return (
              <>
                <h3 className="d-sub">الموقع</h3>
                {p.location && <p className="d-desc"><MapPin size={15} style={{ verticalAlign: "-2px" }} /> {p.location}</p>}
                <iframe title="موقع العقار" loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade"
                  style={{ width: "100%", height: 340, border: 0, borderRadius: 16, display: "block" }}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=${has ? 16 : 13}&hl=ar&output=embed`} />
                {!has && <small className="hint" style={{ display: "block", marginTop: 6 }}>الموقع تقريبي حسب المنطقة — لم يحدد المعلن العقار بدقة على الخريطة.</small>}
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`} target="_blank" rel="noopener noreferrer" className="btn full" style={{ marginTop: 10 }}>📍 افتح الموقع في خرائط جوجل</a>
              </>
            );
          })()}
        </div>

        <aside className="d-side">
          <p className="price big">{p.price} {p.period && <small>{p.period}</small>}</p>
          <AdvertiserLink side />
          {isAdmin && (
            <div style={{ border: "2px solid #0a7d4f", borderRadius: 14, padding: 12, margin: "10px 0", display: "grid", gap: 8, background: "#f4fbf7" }}>
              <b style={{ color: "#0a7d4f" }}>🛡️ لوحة الإدارة</b>
              <div style={{ fontSize: 13, display: "grid", gap: 4 }}>
                <div>الحالة: <b>{A_STATUS[raw.status] || raw.status}</b></div>
                <div>رقم الإعلان: <code dir="ltr" style={{ fontSize: 11, wordBreak: "break-all" }}>{raw.id}</code></div>
                <div>صاحب الإعلان: <Link href={`/profile/${raw.user_id}`} target="_blank" rel="noreferrer"><b>فتح الملف الشخصي ↗</b></Link></div>
                <div>تاريخ الإنشاء: {fmtDT(raw.created_at)}</div>
                {raw.published_at && <div>تاريخ النشر: {fmtDT(raw.published_at)}</div>}
                {raw.expires_at && <div>ينتهي الإعلان: {fmtDT(raw.expires_at)}</div>}
                {raw.is_featured && <div>⭐ مميز {raw.featured_until ? `حتى ${fmtDT(raw.featured_until)}` : "(دائم)"}</div>}
                {raw.status === "rejected" && raw.rejection_reason && <div style={{ color: "#c0392b" }}>سبب الرفض: {raw.rejection_reason}</div>}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {raw.status !== "published" && <button disabled={busy} onClick={aApprove} className="btn" style={{ background: "#0a7d4f", color: "#fff" }}>✓ قبول ونشر</button>}
                {raw.status !== "rejected" && <button disabled={busy} onClick={aReject} className="btn btn-outline" style={{ color: "#c0392b", borderColor: "#c0392b" }}>رفض</button>}
                <button disabled={busy} onClick={aDelete} className="btn btn-outline" style={{ color: "#c0392b", borderColor: "#c0392b" }}>حذف</button>
              </div>
              {raw.status === "published" && <AdminFeatureButton l={raw} className="btn btn-outline full" onDone={(m) => { alert(m); reloadRaw(); }} />}
            </div>
          )}
          <a className="btn full" href={`tel:${p.phone}`}><Phone size={16} /> اتصل الآن</a>
          <a className="btn btn-wa full" href={waLink(p.phone, p.title)} target="_blank" rel="noreferrer"><MessageCircle size={16} /> واتساب</a>
          {isMine && <Link href={`/my-listings/edit/${id}`} className="btn btn-outline full"><Pencil size={15} /> تعديل الإعلان</Link>}
          {isMine && raw.status !== "rejected" && <FeatureButton listingId={id} title={p.title} style={{ marginTop: 8 }} />}
          {isMine && raw.status !== "published" && <p className="warn">هذا الإعلان {raw.status === "pending" ? "قيد المراجعة" : "مرفوض"} ولا يظهر للزوار.</p>}
          <InquiryForm />
<div className="d-actions">
            <button onClick={toggleFav}><Heart size={16} fill={fav ? "#e8743b" : "none"} /> {fav ? "محفوظ" : "حفظ"}</button>
            <ShareTrigger><Share2 size={16} /> مشاركة</ShareTrigger>
            <ReportTrigger><Flag size={16} /> إبلاغ</ReportTrigger>
          </div>
          {!user && <p className="hint">سجّل مجاناً لحفظ العقارات واستلام تنبيه عند نزول عقار بمواصفاتك.</p>}
        </aside>
      </div>
    </section>
  );
}
