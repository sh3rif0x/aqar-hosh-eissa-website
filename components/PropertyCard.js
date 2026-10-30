import { Heart, BedDouble, Bath, Maximize, Building2, MapPin, Phone, MessageCircle, Images } from "lucide-react";

const TONES = [
  "linear-gradient(135deg,#d9cfc2,#f1ebe2)",
  "linear-gradient(135deg,#c9d2d6,#ece9e3)",
  "linear-gradient(135deg,#cdbba5,#efe5d6)",
  "linear-gradient(135deg,#bfb6a8,#e6dfd3)",
];

export default function PropertyCard({ property: p }) {
  return (
    <article className="card">
      <div className="media" style={{ background: p.image ? `url(${p.image}) center/cover` : TONES[p.tone % TONES.length] }}>
        <span className="badge">{p.badge}</span>
        <button className="heart" aria-label="حفظ"><Heart size={16} /></button>
        <span className="count"><Images size={12} /> {p.photos}</span>
      </div>
      <div className="card-body">
        <p className="price">{p.price} {p.period && <small>{p.period}</small>}</p>
        <h3>{p.title}</h3>
        <ul className="meta">
          {p.beds > 0 && <li><BedDouble size={15} /> {p.beds}</li>}
          {p.baths > 0 && <li><Bath size={15} /> {p.baths}</li>}
          <li><Maximize size={15} /> {p.area} {p.unit}</li>
          <li><Building2 size={15} /> {p.type}</li>
        </ul>
        <p className="loc"><MapPin size={14} /> {p.location}</p>
        <p className="listed">{p.listed}</p>
        <div className="card-foot">
          <div className="agent">
            <span className="avatar">{p.agent.name[0]}</span>
            <div><strong>{p.agent.name}</strong> <em>{p.agent.role}</em></div>
          </div>
          <div className="contact">
            <button aria-label="اتصال"><Phone size={14} /></button>
            <button aria-label="رسالة"><MessageCircle size={14} /></button>
            <button aria-label="واتساب" className="wa"><MessageCircle size={14} /></button>
          </div>
        </div>
      </div>
    </article>
  );
}
