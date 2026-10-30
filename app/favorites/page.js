"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { favorites } from "@/lib/api";
import { normalize, items } from "@/lib/normalize";
import { useAuth } from "@/lib/AuthContext";
import PropertyCard from "@/components/PropertyCard";

export default function Favorites() {
  const { user, loading } = useAuth();
  const [list, setList] = useState(null);
  useEffect(() => {
    if (user) favorites.mine({ limit: 50 }).then((d) => setList(items(d).map(normalize))).catch(() => setList([]));
  }, [user]);

  if (loading) return null;
  if (!user) return (
    <section className="section" style={{ minHeight: "60vh" }}><div className="container gate">
      <h2>العقارات المحفوظة</h2>
      <p>سجّل مجاناً واحفظ العقارات اللي عجبتك واحصل على إشعار عند نزول عقار بالمواصفات اللي بتدور عليها.</p>
      <Link href="/auth?reason=favorite" className="btn">تسجيل / دخول</Link>
    </div></section>
  );
  return (
    <section className="section" style={{ minHeight: "60vh" }}><div className="container">
      <header className="sec-head"><h2>المحفوظة</h2></header>
      {!list && <div className="grid"><div className="card skel" /></div>}
      {list?.length === 0 && <p className="empty">لا توجد عقارات محفوظة.</p>}
      {list?.length > 0 && <div className="grid">{list.map((p) => <PropertyCard key={p.id} property={{ ...p, isFavorite: true }} />)}</div>}
    </div></section>
  );
}
