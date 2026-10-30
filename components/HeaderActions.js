"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, User, ChevronDown, UserCog, LayoutDashboard, ShieldCheck, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import styles from "./HeaderActions.module.css";

/* يغلق القائمة عند الضغط خارجها أو بزر Esc */
function useDismiss(open, setOpen) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const down = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const key = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key); };
  }, [open, setOpen]);
  return ref;
}

const ago = (d) => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  return new Date(d).toLocaleDateString("ar-EG");
};

/* ============ جرس الإشعارات ============ */
export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ unread: 0, items: [] });
  const ref = useDismiss(open, setOpen);

  const load = useCallback(async () => {
    const { data: d, error } = await supabase.rpc("get_my_notifications", { p_limit: 15, p_offset: 0 });
    if (!error && d) setData(d);
  }, []);

  useEffect(() => {
    if (!user) return;
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [user, load]);

  if (!user) return null;

  const toggle = () => { setOpen((o) => !o); if (!open) load(); };
  const readOne = async (n) => {
    if (n.read_at) return;
    setData((d) => ({ unread: Math.max(0, d.unread - 1), items: d.items.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)) }));
    await supabase.rpc("mark_notifications_read", { p_id: n.id });
  };
  const readAll = async () => {
    setData((d) => ({ unread: 0, items: d.items.map((x) => ({ ...x, read_at: x.read_at || new Date().toISOString() })) }));
    await supabase.rpc("mark_notifications_read", { p_id: null });
  };

  return (
    <div className={styles.wrap} ref={ref}>
      <button className={styles.trigger} onClick={toggle} aria-label="الإشعارات" aria-expanded={open}>
        <Bell size={19} />
        {data.unread > 0 && <span className={styles.dot}>{data.unread > 9 ? "9+" : data.unread}</span>}
      </button>
      {open && (
        <div className={`${styles.panel} ${styles.notif}`} dir="rtl">
          <div className={styles.panelHead}>
            <strong>الإشعارات</strong>
            {data.unread > 0 && <button onClick={readAll}>تعليم الكل كمقروء</button>}
          </div>
          <div className={styles.list}>
            {data.items.length === 0 && <p className={styles.empty}>لا توجد إشعارات حتى الآن</p>}
            {data.items.map((n) => (
              <button key={n.id} className={`${styles.item} ${n.read_at ? "" : styles.unread}`} onClick={() => readOne(n)}>
                <strong>{n.title}</strong>
                <span>{n.body}</span>
                <small>{ago(n.created_at)}</small>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ قائمة الحساب (بدل الدائرة) ============ */
export function UserMenu() {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState(null);
  const ref = useDismiss(open, setOpen);

  useEffect(() => {
    if (!user) { setMe(null); return; }
    supabase.rpc("get_my_profile").then(({ data }) => setMe(data));
  }, [user]);

  if (!user) return null;

  const isAdmin = me?.role === "admin" || me?.role === "super_admin";
  const logout = async () => { setOpen(false); await supabase.auth.signOut(); router.push("/"); router.refresh(); };

  return (
    <div className={styles.wrap} ref={ref}>
      <button className={`${styles.trigger} ${styles.userBtn}`} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu">
        {me?.avatar_url ? <img src={me.avatar_url} alt="" className={styles.pic} /> : <User size={19} />}
        <span className={styles.uname}>{me?.full_name || "حسابي"}</span>
        <ChevronDown size={15} className={open ? styles.flip : ""} />
      </button>
      {open && (
        <div className={`${styles.panel} ${styles.menu}`} dir="rtl" role="menu">
          <div className={styles.who}>
            <strong>{me?.full_name || "حسابي"}</strong>
            <small>{user.email}</small>
          </div>
          <Link href="/profile" onClick={() => setOpen(false)} role="menuitem"><UserCog size={16} /> الحساب الشخصي</Link>
          {isAdmin && <Link href="/dashboard/admin" onClick={() => setOpen(false)} role="menuitem"><ShieldCheck size={16} /> لوحة الإدارة</Link>}
          {(isAdmin || me?.account_type === "owner") && (
            <Link href="/dashboard" onClick={() => setOpen(false)} role="menuitem"><LayoutDashboard size={16} /> لوحة المعلن</Link>
          )}
          <button onClick={logout} role="menuitem" className={styles.out}><LogOut size={16} /> تسجيل الخروج</button>
        </div>
      )}
    </div>
  );
}

/* استخدمهما معاً في الهيدر */
export default function HeaderActions() {
  return (
    <div className={styles.row}>
      <NotificationBell />
      <UserMenu />
    </div>
  );
}
