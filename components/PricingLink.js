"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Tag } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

// يظهر للسماسر والمكاتب العقارية فقط
export default function PricingLink({ onClick }) {
  const { user } = useAuth();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!user) return setOk(false);
    supabase.rpc("get_my_quota").then(({ data }) => setOk(data?.account_type === "broker"));
  }, [user]);
  if (!ok) return null;
  return <Link href="/pricing" onClick={onClick} role="menuitem"><Tag size={16} /> باقات الإعلانات</Link>;
}
