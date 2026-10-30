"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Maximize, Building2, MapPin, Phone, MessageCircle, Images, Share2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { favorites } from "@/lib/api";

const TONES = [
  "linear-gradient(135deg,#d9cfc2,#f1ebe2)",
  "linear-gradient(135deg,#c9d2d6,#ece9e3)",
  "linear-gradient(135deg,#cdbba5,#efe5d6)",
  "linear-gradient(135deg,#bfb6a8,#e6dfd3)",
];
export const waLink = (phone, title) => {
  const n = String(phone || "").replace(/\D/g, "").replace(/^0/, "20");
  return `https://wa.me/${n}?text=${encodeURIComponent("مرحباً، بخصوص إعلان: " + title)}`;
};

export default function PropertyCard({ property: p }) {
  const { user } = useAuth();
  const router = useRouter();
  const [fav, setFav] = useState(p.isFavorite);

  const toggleFav = async (e) => {
    e.preventDefault();
    if (!user) return router.push("/auth?reason=favorite");
    setFav(!fav);
    try { await favorites.toggle(p.id); } catch { setFav(fav); }
  };
  const share = async (e) => {
    e.preventDefault();
    const url = `${location.origin}/listing/${p.id}`;
    if (navigator.share) navigator.share({ title: p.title, url }).catch(() => {});
    else { await navigator.clipboard.writeText(url); alert("تم نسخ الرابط"); }
  };

  return (
    <article className="card">
      <Link href={`/listing/${p.id}`}>
        <div className="media" style={{ background: p.image ? `url(${p.image}) center/cover` : TONES[0] }}>
          <span className="badge">{p.badge}</span>
          <button className="heart" onClick={toggleFav} aria-label="حفظ"><Heart size={16} fill={fav ? "#e8743b" : "none"} color={fav ? "#e8743b" : "currentColor"} /></button>
          {p.photos > 0 && <span className="count"><Images size={12} /> {p.photos}</span>}
        </div>
      </Link>
      <div className="card-body">
        <Link href={`/listing/${p.id}`}>
          <p className="price">{p.price} {p.period && <small>{p.period}</small>}</p>
          <h3>{p.title}</h3>
        </Link>
        <ul className="meta">
          <li><Maximize size={15} /> {p.area} {p.unit}</li>
          <li><Building2 size={15} /> {p.type}</li>
        </ul>
        <p className="loc"><MapPin size={14} /> {p.location}</p>
        <p className="listed">{p.listed}</p>
        <div className="card-foot">
          <div className="agent">
            <span className="avatar">{p.agent.name[0]}</span>
            <div>
              <strong>{p.agent.name}</strong>
              <div><em className={p.agent.isBroker ? "tag-broker" : "tag-owner"}>{p.agent.isBroker ? "🔵" : "🟢"} {p.agent.role}</em></div>
            </div>
          </div>
          <div className="contact">
            <a href={`tel:${p.phone}`} aria-label="اتصال"><Phone size={14} /></a>
            <a href={waLink(p.phone, p.title)} target="_blank" rel="noreferrer" aria-label="واتساب" className="wa"><MessageCircle size={14} /></a>
            <button onClick={share} aria-label="مشاركة"><Share2 size={14} /></button>
          </div>
        </div>
      </div>
    </article>
  );
}
