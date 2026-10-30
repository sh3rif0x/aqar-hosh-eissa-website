"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const L = { owner: "مالك مباشر", broker: "مكتب / سمسار", seeker: "باحث عن عقار" };

export default function AccountTypeBadge() {
  const [t, setT] = useState(null);
  useEffect(() => {
    supabase.rpc("get_my_profile").then(({ data }) => setT(data?.account_type || null));
  }, []);
  if (!t) return null;
  return (
    <div dir="rtl" style={{ display: "flex", gap: ".5rem", alignItems: "center", padding: ".7rem 1rem", border: "1px solid #e4e0d6", borderRadius: 12, background: "#faf8f3", width: "fit-content" }}>
      <span style={{ color: "#6b7a76", fontSize: ".85rem" }}>نوع الحساب:</span>
      <b>{L[t] || t}</b>
    </div>
  );
}
