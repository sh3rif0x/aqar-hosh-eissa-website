"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Plus, User, LogOut, LayoutDashboard, Shield, LogIn } from "lucide-react";
import { NAV_LINKS } from "@/lib/data";
import { APP_NAME } from "@/lib/config";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/api";

import HeaderActions from "@/components/HeaderActions";
export default function Navbar() {
  const { user, me, isAdmin, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const name = me?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0];

  const logout = async () => { await auth.signOut(); setOpen(false); router.push("/"); };

  return (
    <header className="nav-header">
      <div className="nav-inner">
        <Link href="/" className="logo">{APP_NAME}</Link>
        <nav className="nav-links">
          {NAV_LINKS.map((l, i) => <Link key={l.href} href={l.href} className={i === 0 ? "active" : ""}>{l.label}</Link>)}
        </nav>
        <div className="nav-actions">
          <Link href="/favorites" className="ghost"><Heart size={16} /> المحفوظة</Link>
          {!loading && !user && <Link href="/auth" className="ghost"><LogIn size={16} /> دخول</Link>}
          <Link href={user ? "/dashboard" : "/auth"} className="btn"><Plus size={15} /> أضف إعلانك</Link>
          {user && (
            <HeaderActions />
          )}
        </div>
      </div>
    </header>
  );
}
