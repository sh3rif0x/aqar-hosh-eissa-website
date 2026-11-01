"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

// رابط «الأسعار» يظهر للسماسر والمكاتب العقارية فقط
export default function PricingNav() {
  const { user } = useAuth();
  const path = usePathname();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!user) return setOk(false);
    supabase.rpc("get_my_quota").then(({ data }) => setOk(data?.account_type === "broker"));
  }, [user]);
  if (!ok) return null;
  return <Link href="/pricing" className={path === "/pricing" ? "active" : ""}>الأسعار</Link>;
}
