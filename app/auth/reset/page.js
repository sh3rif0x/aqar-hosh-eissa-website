"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { auth } from "@/lib/api";

export default function ResetPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const { data } = auth.onChange((event) => { if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true); });
    auth.session().then(({ data: d }) => { if (d.session) setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (e) => {
    e.preventDefault(); setErr("");
    if (pw !== pw2) return setErr("كلمتا المرور غير متطابقتين");
    setBusy(true);
    const { error } = await auth.updatePassword(pw);
    setBusy(false);
    if (error) return setErr(error.message);
    setDone(true);
    setTimeout(() => router.push("/"), 1500);
  };

  return (
    <main className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <h1>تعيين كلمة مرور جديدة</h1>
        {!ready && !done && <p className="err">الرابط غير صالح أو منتهي. اطلب رابطاً جديداً من صفحة تسجيل الدخول.</p>}
        {done && <p className="ok">تم تغيير كلمة المرور بنجاح، جارٍ تحويلك...</p>}
        {ready && !done && (<>
          <label className="in"><Lock size={16} />
            <input required minLength={6} type={show ? "text" : "password"} placeholder="كلمة المرور الجديدة" value={pw} onChange={(e) => setPw(e.target.value)} />
            <button type="button" onClick={() => setShow(!show)}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </label>
          <label className="in"><Lock size={16} />
            <input required minLength={6} type={show ? "text" : "password"} placeholder="تأكيد كلمة المرور" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </label>
          {err && <p className="err">{err}</p>}
          <button className="btn full" disabled={busy}>{busy ? <Loader2 size={16} className="spin" /> : "حفظ كلمة المرور"}</button>
        </>)}
      </form>
    </main>
  );
}
