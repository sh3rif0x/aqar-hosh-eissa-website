"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Plus, User, LogOut, LayoutDashboard, Shield, LogIn } from "lucide-react";
import { NAV_LINKS } from "@/lib/data";
import { APP_NAME } from "@/lib/config";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/api";

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
            <div className="profile">
              <button className="profile-btn" onClick={() => setOpen(!open)} aria-label="الحساب">
                {me?.avatar_url ? <img src={me.avatar_url} alt="" /> : <User size={18} />}
              </button>
              {open && (
                <div className="menu" onMouseLeave={() => setOpen(false)}>
                  <div className="menu-head"><strong>{name}</strong><small>{user.email}</small></div>
                  <Link href="/profile" onClick={() => setOpen(false)}><User size={15} /> حسابي</Link>
                  <Link href="/dashboard" onClick={() => setOpen(false)}><LayoutDashboard size={15} /> إعلاناتي</Link>
                  <Link href="/favorites" onClick={() => setOpen(false)}><Heart size={15} /> المحفوظة</Link>
                  {isAdmin && <Link href="/admin" onClick={() => setOpen(false)}><Shield size={15} /> لوحة الإدارة</Link>}
                  <button onClick={logout}><LogOut size={15} /> تسجيل الخروج</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
