"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Phone, Eye, EyeOff, Loader2 } from "lucide-react";
import { auth, profile } from "@/lib/api";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.5 17.7 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/>
    <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"/>
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/>
  </svg>
);

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ full_name: "", phone: "", email: "", password: "" });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const google = async () => {
    setErr("");
    const { error } = await auth.signInWithGoogle();
    if (error) setErr(error.message);
  };

  const submit = async (e) => {
    e.preventDefault(); setErr(""); setMsg(""); setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await auth.signIn(f.email, f.password);
        if (error) throw error;
        router.push("/"); router.refresh();
      } else {
        const { data, error } = await auth.signUp(f.email, f.password, { full_name: f.full_name, phone: f.phone });
        if (error) throw error;
        if (data.session) {
          try { await profile.update({ full_name: f.full_name, phone: f.phone }); } catch {}
          router.push("/"); router.refresh();
        } else setMsg("تم إنشاء الحساب. تحقق من بريدك الإلكتروني لتأكيده ثم سجّل الدخول.");
      }
    } catch (x) {
      setErr(x.message?.includes("Invalid login") ? "البريد أو كلمة المرور غير صحيحة" : x.message);
    } finally { setBusy(false); }
  };

  return (
    <main className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <h1>{mode === "login" ? "تسجيل الدخول" : "إنشاء حساب جديد"}</h1>

        <button type="button" className="google-btn" onClick={google}>
          <GoogleIcon /> المتابعة باستخدام Google
        </button>
        <div className="or"><span>أو</span></div>

        <div className="auth-tabs">
          <button type="button" className={mode === "login" ? "on" : ""} onClick={() => setMode("login")}>دخول</button>
          <button type="button" className={mode === "signup" ? "on" : ""} onClick={() => setMode("signup")}>حساب جديد</button>
        </div>

        {mode === "signup" && (
          <>
            <label className="in"><User size={16} /><input required placeholder="الاسم الكامل" value={f.full_name} onChange={set("full_name")} /></label>
            <label className="in"><Phone size={16} /><input placeholder="رقم الهاتف" value={f.phone} onChange={set("phone")} /></label>
          </>
        )}
        <label className="in"><Mail size={16} /><input required type="email" placeholder="البريد الإلكتروني" value={f.email} onChange={set("email")} /></label>
        <label className="in"><Lock size={16} />
          <input required minLength={6} type={show ? "text" : "password"} placeholder="كلمة المرور" value={f.password} onChange={set("password")} />
          <button type="button" onClick={() => setShow(!show)} aria-label="إظهار">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
        </label>

        {err && <p className="err">{err}</p>}
        {msg && <p className="ok">{msg}</p>}
        <button className="btn full" disabled={busy}>{busy ? <Loader2 size={16} className="spin" /> : mode === "login" ? "دخول" : "إنشاء الحساب"}</button>
      </form>
    </main>
  );
}
