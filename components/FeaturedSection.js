"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listings } from "@/lib/api";
import { normalize, items as toItems } from "@/lib/normalize";
import PropertyCard from "@/components/PropertyCard";

export default function FeaturedSection({ limit = 4 }) {
  const [list, setList] = useState(null);

  useEffect(() => {
    listings.list({
      category_id: null, region_id: null, deal_type: null, min_price: null, max_price: null, search: null,
      min_area: null, max_area: null, area_unit: null, min_rooms: null, min_baths: null, finishing: null,
      advertiser_type: null, featured_only: true, sort: "newest", limit, offset: 0,
    })
      .then((d) => setList(toItems(d).map(normalize)))
      .catch(() => setList([]));
  }, [limit]);

  if (!list || list.length === 0) return null; // مفيش مميز = القسم مش بيظهر

  return (
    <section className="section">
      <div className="container">
        <header className="sec-head">
          <div><h2>⭐ إعلانات مميزة</h2></div>
          <Link href="/browse?featured=1" className="btn btn-outline">عرض الكل</Link>
        </header>
        <div className="grid g2">
          {list.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
      </div>
    </section>
  );
}
