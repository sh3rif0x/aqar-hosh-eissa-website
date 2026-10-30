"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listings } from "@/lib/api";
import { normalize } from "@/lib/normalize";
import PropertyCard from "./PropertyCard";

export default function DbSection({ eyebrow, title, filters = {}, href = "/browse", alt = false }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    listings.list({ limit: 6, ...filters })
      .then((d) => setItems((Array.isArray(d) ? d : d?.items ?? d?.data ?? []).map(normalize)))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <section className={`section ${alt ? "alt" : ""}`}>
      <div className="container">
        <header className="sec-head">
          <div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>
          <Link href={href} className="more">عرض الكل <ArrowLeft size={14} /></Link>
        </header>
        {error && <p className="err">{error}</p>}
        {!items && !error && <div className="grid">{[0, 1, 2].map((i) => <div key={i} className="card skel" />)}</div>}
        {items && items.length === 0 && <p className="empty">لا توجد إعلانات حالياً.</p>}
        {items && items.length > 0 && <div className="grid">{items.map((p) => <PropertyCard key={p.id} property={p} />)}</div>}
      </div>
    </section>
  );
}
