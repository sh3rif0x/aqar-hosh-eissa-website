"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function FeatureToggle({ listing, onDone }) {
  const [credits, setCredits] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    supabase.rpc("get_my_quota").then(({ data }) => setCredits(data?.feature_credits ?? 0));
  }, [listing.is_featured]);

  async function toggle(on) {
    setBusy(true); setErr("");
    const { error } = await supabase.rpc("feature_my_listing", { p_id: listing.id, p_on: on });
    setBusy(false);
    if (error) return setErr(error.message.includes("no_credits") ? "لا يوجد رصيد تمييز" : "تعذر تنفيذ العملية");
    onDone?.();
  }

  if (credits === null || listing.status === "rejected") return null;
  if (listing.is_featured)
    return <span><b>⭐ مميز</b> <button type="button" disabled={busy} onClick={() => toggle(false)}>إلغاء التمييز</button>{err && <small> {err}</small>}</span>;
  if (credits > 0)
    return <span><button type="button" disabled={busy} onClick={() => toggle(true)}>⭐ ميّز الإعلان ({credits})</button>{err && <small> {err}</small>}</span>;
  return <Link href="/pricing">⭐ ميّز الإعلان</Link>;
}
