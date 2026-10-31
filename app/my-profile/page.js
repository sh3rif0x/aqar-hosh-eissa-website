"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

export default function Profile() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && !user) router.push("/auth"); }, [user, loading]);
  useEffect(() => {
    if (!user) return;
    setEmail(user.email || "");
    setName(user.user_metadata?.full_name || "");
  }, [user]);

  const save = async (e) => {
    e.preventDefault(); setErr(""); setMsg(""); setBusy(true);
    try {
      const upd = { data: { full_name: name } };
      if (email && email !== user.email) upd.email = email;
      if (pass) {
        if (pass.length < 8) throw new Error("كلمة المرور لازم 8 حروف على الأقل");
        upd.password = pass;
      }
      const { error } = await supabase.auth.updateUser(upd);
      if (error) throw error;
      await supabase.from("profiles").update({ full_name: name }).eq("id", user.id);
      setPass("");
      setMsg("تم حفظ التعديلات");
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };

  return (
    <main className="auth-wrap"><form className="auth-card" onSubmit={save}>
      <h1>تعديل الحساب</h1>
      <input required className="in" placeholder="الاسم" value={name} onChange={(e) => setName(e.target.value)} />
      <input required type="email" className="in" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" className="in" placeholder="كلمة مرور جديدة (اختياري)" value={pass} onChange={(e) => setPass(e.target.value)} />
      {msg && <p className="warn">{msg}</p>}
      {err && <p className="err">{err}</p>}
      <button className="btn full" disabled={busy}>{busy ? "جارٍ الحفظ..." : "حفظ"}</button>
      <Link href="/my-listings" className="btn btn-outline full">← إعلاناتي</Link>
    </form></main>
  );
}
