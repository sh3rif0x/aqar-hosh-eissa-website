"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

const CHECK_MS = 60000;

export default function BlockGuard() {
  useEffect(() => {
    let off = false;
    const check = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const uid = data?.session?.user?.id;
        if (!uid) return;
        const { data: p } = await supabase.from("profiles").select("is_blocked").eq("id", uid).maybeSingle();
        if (!off && p?.is_blocked) {
          await supabase.auth.signOut();
          window.location.href = "/auth?blocked=1";
        }
      } catch {}
    };
    check();
    const t = setInterval(() => { if (!document.hidden) check(); }, CHECK_MS);
    const { data: sub } = supabase.auth.onAuthStateChange((ev) => { if (ev === "SIGNED_IN") check(); });
    return () => { off = true; clearInterval(t); sub?.subscription?.unsubscribe(); };
  }, []);
  return null;
}
