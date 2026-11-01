"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import FeatureModal from "./FeatureModal";

// الاستخدام: <FeatureButton listingId={id} title={listing.title} />
// يظهر لصاحب الإعلان فقط، ولا يظهر لغيره.
export default function FeatureButton({ listingId, title, style }) {
  const [st, setSt] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!listingId) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase.rpc("get_my_listing_feature", { p_id: listingId }).then(({ data }) => setSt(data || null));
    });
  }, [listingId]);

  if (!st?.is_owner || st.status === "rejected") return null;
  const until = st.is_featured && st.featured_until ? new Date(st.featured_until) : null;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={{
        width: "100%", padding: "13px 16px", border: 0, borderRadius: 14, cursor: "pointer", fontWeight: 800, fontSize: "1rem", color: "#fff",
        background: "linear-gradient(135deg,#b8741a,#d9942e)", boxShadow: "0 8px 20px rgba(184,116,26,.3)", ...style }}>
        {until ? `⭐ مميز حتى ${until.toLocaleDateString("ar-EG")} — جدّد` : "⭐ ميّز إعلانك الآن"}
      </button>
      <FeatureModal open={open} onClose={() => setOpen(false)} listing={{ id: listingId, title }} />
    </>
  );
}
