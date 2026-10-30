"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Commercial() {
  const [cats, setCats] = useState([]);
  const [cat, setCat] = useState("");
  const [deal, setDeal] = useState("");
  const [rows, setRows] = useState(null);

  useEffect(() => {
    supabase.from("categories").select("id,name_ar").eq("group_kind", "commercial").eq("is_active", true).order("sort_order").then(({ data }) => setCats(data || []));
  }, []);

  useEffect(() => {
    if (!cats.length) return;
    setRows(null);
    let q = supabase.from("listings")
      .select("id,title,price,area,area_unit,deal_type,category_id,listing_images(storage_path,sort_order)")
      .eq("status", "published")
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order("is_featured", { ascending: false }).order("published_at", { ascending: false });
    q = cat ? q.eq("category_id", cat) : q.in("category_id", cats.map((c) => c.id));
    if (deal) q = q.eq("deal_type", deal);
    q.then(({ data }) => setRows(data || []));
  }, [cats, cat, deal]);

  const img = (r) => {
    const p = [...(r.listing_images || [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.storage_path;
    return p ? supabase.storage.from("listing-images").getPublicUrl(p).data.publicUrl : null;
  };

  return (
    <main dir="rtl" style={{ maxWidth: 1100, margin: "0 auto", padding: "1.5rem 1rem" }}>
      <h1>عقارات تجارية</h1>
      <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", margin: "1rem 0" }}>
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">كل الأنواع</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
        </select>
        <select value={deal} onChange={(e) => setDeal(e.target.value)}>
          <option value="">بيع وإيجار</option><option value="sale">للبيع</option><option value="rent">للإيجار</option>
        </select>
        <Link href="/add-listing" style={{ marginInlineStart: "auto" }}>+ أضف إعلان تجاري</Link>
      </div>
      {rows === null ? <p>جارٍ التحميل...</p> : rows.length === 0 ? <p>لا توجد إعلانات حالياً.</p> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: "1rem" }}>
          {rows.map((r) => (
            <Link key={r.id} href={`/listing/${r.id}`} style={{ border: "1px solid #e4e0d6", borderRadius: 14, overflow: "hidden", textDecoration: "none", color: "inherit", background: "#fff" }}>
              {img(r) ? <img src={img(r)} alt="" style={{ width: "100%", height: 160, objectFit: "cover" }} /> : <div style={{ height: 160, background: "#f1eee5" }} />}
              <div style={{ padding: ".8rem" }}>
                <b>{r.title}</b>
                <div>{Number(r.price).toLocaleString("ar-EG")} ج.م {r.deal_type === "rent" ? "/ شهرياً" : ""}</div>
                {r.area && <small>{r.area} {r.area_unit === "sqm" ? "م²" : r.area_unit}</small>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
