"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

const ST = { pending: ["قيد المراجعة", "#b45309"], published: ["منشور", "#166534"], rejected: ["مرفوض", "#b91c1c"] };

export default function MyListings() {
  const { user } = useAuth();
  const [rows, setRows] = useState(null);

  const load = () =>
    supabase.from("listings")
      .select("id,title,price,status,rejection_reason,expires_at,deal_type,listing_images(storage_path,sort_order)")
      .eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setRows(data || []));

  useEffect(() => { if (user) load(); }, [user]);

  const del = async (id) => {
    if (!confirm("حذف الإعلان نهائياً؟")) return;
    await supabase.from("listings").delete().eq("id", id);
    load();
  };
  const img = (r) => {
    const p = [...(r.listing_images || [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.storage_path;
    return p ? supabase.storage.from("listing-images").getPublicUrl(p).data.publicUrl : null;
  };

  if (!user) return <main dir="rtl" style={{ padding: "2rem", textAlign: "center" }}><p>سجّل دخولك لعرض إعلاناتك.</p><Link href="/auth">تسجيل الدخول</Link></main>;

  return (
    <main dir="rtl" style={{ maxWidth: 900, margin: "0 auto", padding: "1.5rem 1rem 4rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>إعلاناتي</h1>
        <Link href="/add-listing" style={{ background: "#b8731f", color: "#fff", padding: ".6rem 1.1rem", borderRadius: 10, textDecoration: "none", fontWeight: 700 }}>+ أضف إعلان</Link>
      </div>
      {rows === null ? <p>جارٍ التحميل...</p> : rows.length === 0 ? <p style={{ marginTop: "1.5rem" }}>ما عندكش إعلانات لسه.</p> : (
        <div style={{ display: "grid", gap: ".8rem", marginTop: "1rem" }}>
          {rows.map((r) => {
            const [label, color] = ST[r.status] || [r.status, "#555"];
            return (
              <div key={r.id} style={{ display: "flex", gap: ".9rem", background: "#fff", border: "1px solid #e4e0d6", borderRadius: 14, padding: ".7rem", alignItems: "center" }}>
                {img(r) ? <img src={img(r)} alt="" style={{ width: 96, height: 76, objectFit: "cover", borderRadius: 10 }} /> : <div style={{ width: 96, height: 76, background: "#f1eee5", borderRadius: 10 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</b>
                  <div>{Number(r.price).toLocaleString("ar-EG")} ج.م</div>
                  <small style={{ color, fontWeight: 700 }}>{label}</small>
                  {r.status === "rejected" && r.rejection_reason && <small style={{ display: "block", color: "#b91c1c" }}>السبب: {r.rejection_reason}</small>}
                  {r.expires_at && r.status === "published" && <small style={{ display: "block", color: "#6b7a76" }}>ينتهي: {new Date(r.expires_at).toLocaleDateString("ar-EG")}</small>}
                </div>
                <div style={{ display: "flex", gap: ".4rem", flexDirection: "column" }}>
                  {r.status === "published" && <Link href={`/listing/${r.id}`}>عرض</Link>}
                  <Link href={`/dashboard/edit/${r.id}`}>تعديل</Link>
                  <button onClick={() => del(r.id)} style={{ color: "#b91c1c", background: "none", border: 0, cursor: "pointer", font: "inherit" }}>حذف</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
