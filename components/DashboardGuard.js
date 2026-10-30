"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DashboardGuard({ children }) {
  const router = useRouter();
  const path = usePathname() || "";
  const [ok, setOk] = useState(false);
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.replace("/auth");
      if (path.startsWith("/dashboard/edit")) return setOk(true);
      const [{ data: p }, { data: adm }] = await Promise.all([supabase.rpc("get_my_profile"), supabase.rpc("is_admin")]);
      if (adm || (p && p.account_type !== "seeker")) setOk(true);
      else router.replace("/my-listings");
    })();
  }, [path, router]);
  return ok ? children : null;
}
