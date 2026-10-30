"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, User, Phone, Eye, EyeOff, Loader2 } from "lucide-react";
import { auth, profile } from "@/lib/api";

const REASONS = {
  favorite: "سجّل مجاناً واحفظ العقارات اللي عجبتك واحصل على إشعار عند نزول عقار بالمواصفات اللي بتدور عليها.",
  add: "سجّل مجاناً لنشر عقارك وإدارة إعلاناتك.",
};

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.5 17.7 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/>
    <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"/>
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/>
  </svg>
);

function AuthPage() {
  const router = useRouter();
  const reason = useSearchParams().get("reason");
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ full_name: "", phone: "", email: "", password: "" });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const goNext = () => { router.push(reason === "add" ? "/dashboard" : "/"); router.refresh(); };

  const google = async () => {
    setErr("");
    const { error } = await auth.signInWithGoogle();
    if (error) setErr(error.message);
  };

  const submit = async (e) => {
    e.preventDefault(); setErr(""); setInfo(""); setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await auth.resetPassword(f.email);
        if (error) throw error;
        setInfo("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك. افتح الرسالة واتبع الرابط.");
        return;
      }
      if (mode === "signup") {
        const { error } = await auth.signUp(f.email, f.password, { full_name: f.full_name, phone: f.phone });
        if (error && !/already registered/i.test(error.message)) throw error;
      }
      const { data, error } = await auth.signIn(f.email, f.password);
      if (error) throw error;
      if (mode === "signup" && data.session) {
        try { await profile.update({ full_name: f.full_name, phone: f.phone }); } catch {}
      }
      goNext();
    } catch (x) {
      const m = x.message || "";
      setErr(/invalid login/i.test(m) ? "البريد أو كلمة المرور غير صحيحة" : /not confirmed/i.test(m) ? "الحساب غير مفعّل، جرّب مرة أخرى بعد لحظات." : m);
    } finally { setBusy(false); }
  };

  return (
    <main className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <h1>{mode === "login" ? "تسجيل الدخول" : mode === "signup" ? "إنشاء حساب جديد" : "نسيت كلمة المرور"}</h1>
        {REASONS[reason] && <p className="ok">{REASONS[reason]}</p>}

        {mode !== "forgot" && <><button type="button" className="google-btn" onClick={google}><GoogleIcon /> المتابعة باستخدام Google</button>
        <div className="or"><span>أو</span></div></>}

        {mode !== "forgot" && <div className="auth-tabs">
          <button type="button" className={mode === "login" ? "on" : ""} onClick={() => setMode("login")}>دخول</button>
          <button type="button" className={mode === "signup" ? "on" : ""} onClick={() => setMode("signup")}>حساب جديد</button>
        </div>}

        {mode === "signup" && (
          <>
            <label className="in"><User size={16} /><input required placeholder="الاسم الكامل" value={f.full_name} onChange={set("full_name")} /></label>
            <label className="in"><Phone size={16} /><input placeholder="رقم الهاتف (اختياري)" value={f.phone} onChange={set("phone")} /></label>
          </>
        )}
        <label className="in"><Mail size={16} /><input required type="email" placeholder="البريد الإلكتروني" value={f.email} onChange={set("email")} /></label>
        {mode !== "forgot" && <label className="in"><Lock size={16} />
          <input required minLength={6} type={show ? "text" : "password"} placeholder="كلمة المرور" value={f.password} onChange={set("password")} />
          <button type="button" onClick={() => setShow(!show)} aria-label="إظهار">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
        </label>}

        {mode === "login" && <button type="button" className="linkbtn start" onClick={() => { setMode("forgot"); setErr(""); }}>نسيت كلمة المرور؟</button>}
        {err && <p className="err">{err}</p>}
        {info && <p className="ok">{info}</p>}
        <button className="btn full" disabled={busy}>{busy ? <Loader2 size={16} className="spin" /> : mode === "login" ? "دخول" : mode === "signup" ? "إنشاء الحساب" : "إرسال رابط الاستعادة"}</button>
        {mode === "forgot" && <button type="button" className="linkbtn" onClick={() => { setMode("login"); setInfo(""); }}>الرجوع لتسجيل الدخول</button>}
      </form>
    </main>
  );
}

export default function Page() { return <Suspense><AuthPage /></Suspense>; }
