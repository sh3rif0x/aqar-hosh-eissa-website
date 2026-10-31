"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Phone, MessageCircle, Share2, Heart, MapPin, Maximize, Building2, Flag, Pencil } from "lucide-react";
import { listings, favorites } from "@/lib/api";
import { normalize } from "@/lib/normalize";
import { useAuth } from "@/lib/AuthContext";
import { waLink } from "@/components/PropertyCard";

import { ShareTrigger, ReportTrigger, InquiryForm } from "@/components/ListingActions";
export default function ListingPage({ params }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [raw, setRaw] = useState(undefined);
  const [img, setImg] = useState(0);
  const [fav, setFav] = useState(false);

  useEffect(() => {
    listings.get(id).then((d) => { setRaw(d); setFav(!!d?.is_favorite); }).catch(() => setRaw(null));
  }, [id]);

  if (raw === undefined) return <section className="section"><div className="container"><div className="card skel" /></div></section>;
  if (!raw) return <section className="section"><div className="container"><p className="empty">الإعلان غير موجود.</p></div></section>;

  const p = normalize(raw);
  const isMine = user && raw.user_id === user.id;
  const images = (raw.images || []).map((i) => i.storage_path);
  const d = raw.details || {};

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
        </div>

        <aside className="d-side">
          <p className="price big">{p.price} {p.period && <small>{p.period}</small>}</p>
          <div className="d-adv">
            <span className="avatar">{p.agent.name[0]}</span>
            <div><strong>{p.agent.name}</strong><div><em className={p.agent.isBroker ? "tag-broker" : "tag-owner"}>{p.agent.isBroker ? "🔵" : "🟢"} {p.agent.role}</em></div></div>
          </div>
          <a className="btn full" href={`tel:${p.phone}`}><Phone size={16} /> اتصل الآن</a>
          <a className="btn btn-wa full" href={waLink(p.phone, p.title)} target="_blank" rel="noreferrer"><MessageCircle size={16} /> واتساب</a>
          {isMine && <Link href={`/my-listings/edit/${id}`} className="btn btn-outline full"><Pencil size={15} /> تعديل الإعلان</Link>}
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
