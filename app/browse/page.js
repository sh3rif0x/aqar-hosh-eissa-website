"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { listings } from "@/lib/api";
import { normalize } from "@/lib/normalize";
import PropertyCard from "@/components/PropertyCard";

function Browse() {
  const sp = useSearchParams();
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    setItems(null);
    listings.list({
      deal_type: sp.get("deal") || null,
      search: sp.get("search") || null,
      min_price: sp.get("min") ? Number(sp.get("min")) : null,
      max_price: sp.get("max") ? Number(sp.get("max")) : null,
      sort, limit: 30,
    })
      .then((d) => setItems((Array.isArray(d) ? d : d?.items ?? d?.data ?? []).map(normalize)))
      .catch((e) => setError(e.message));
  }, [sp, sort]);

  return (
    <section className="section" style={{ minHeight: "70vh" }}>
      <div className="container">
        <header className="sec-head">
          <h2>تصفح العقارات</h2>
          <select className="sortsel" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">الأحدث</option>
            <option value="price_asc">الأقل سعراً</option>
            <option value="price_desc">الأعلى سعراً</option>
          </select>
        </header>
        {error && <p className="err">{error}</p>}
        {!items && !error && <div className="grid">{[0, 1, 2].map((i) => <div key={i} className="card skel" />)}</div>}
        {items && items.length === 0 && <p className="empty">لا توجد نتائج.</p>}
        {items && <div className="grid">{items.map((p) => <PropertyCard key={p.id} property={p} />)}</div>}
      </div>
    </section>
  );
}
export default function Page() { return <Suspense><Browse /></Suspense>; }
