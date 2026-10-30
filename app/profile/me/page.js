"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Me() {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.replace("/auth");
      const { data } = await supabase.rpc("get_my_profile");
      if (data?.username) router.replace(`/profile/${data.username}`);
      else router.replace("/");
    })();
  }, [router]);
  return <main dir="rtl" style={{ padding: "2rem", textAlign: "center" }}>جارٍ التحميل...</main>;
}
