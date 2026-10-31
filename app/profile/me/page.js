"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Me() {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      router.replace(user ? `/profile/${user.id}` : "/auth");
    })();
  }, [router]);
  return <main dir="rtl" style={{ padding: "2rem", textAlign: "center" }}>جارٍ التحميل...</main>;
}
