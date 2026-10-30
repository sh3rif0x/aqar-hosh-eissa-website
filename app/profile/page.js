"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import styles from "./profile.module.css";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [f, setF] = useState({ full_name: "", phone: "", email: "" });
  const [orig, setOrig] = useState(null);
  const [pw, setPw] = useState({ current: "", next: "" });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState("");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/auth");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("full_name, phone, avatar_url").eq("id", user.id).maybeSingle();
      setAvatar(data?.avatar_url || "");
      const v = { full_name: data?.full_name || "", phone: data?.phone || "", email: user.email || "" };
      setF(v); setOrig(v);
    })();
  }, [user]);

  const flash = (text, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 4000); };

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return flash("الصور المسموحة: JPG أو PNG أو WEBP", false);
    if (file.size > 2 * 1024 * 1024) return flash("حجم الصورة يجب ألا يتجاوز 2 ميجا", false);
    setBusy("avatar");
    try {
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      const { error: e2 } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
      if (e2) throw e2;
      setAvatar(url);
      flash("تم تحديث الصورة");
    } catch (err) { flash(err.message || "فشل رفع الصورة", false); }
    setBusy("");
  };

  const removeAvatar = async () => {
    if (!confirm("حذف صورة البروفايل؟")) return;
    setBusy("avatar");
    const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
    if (error) flash(error.message, false); else { setAvatar(""); flash("تم حذف الصورة"); }
    setBusy("");
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    const phone = f.phone.replace(/\s+/g, "");
    if (phone && !/^\+?[0-9]{8,15}$/.test(phone)) return flash("رقم الموبايل غير صحيح", false);
    setBusy("profile");
    try {
      const { error } = await supabase.from("profiles").update({ full_name: f.full_name.trim(), phone: phone || null }).eq("id", user.id);
      if (error) throw error;
      if (f.email.trim() !== orig.email) {
        const { error: e2 } = await supabase.auth.updateUser({ email: f.email.trim() });
        if (e2) throw e2;
        flash("تم حفظ البيانات. أرسلنا رابط تأكيد على الإيميل الجديد، لن يتغير قبل تأكيده");
      } else flash("تم حفظ التغييرات");
      setOrig({ ...f, phone });
    } catch (err) { flash(err.message || "حدث خطأ", false); }
    setBusy("");
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pw.next.length < 8) return flash("كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف", false);
    setBusy("pw");
    try {
      const { error: e1 } = await supabase.auth.signInWithPassword({ email: user.email, password: pw.current });
      if (e1) throw new Error("كلمة المرور الحالية غير صحيحة");
      const { error } = await supabase.auth.updateUser({ password: pw.next });
      if (error) throw error;
      setPw({ current: "", next: "" });
      flash("تم تغيير كلمة المرور");
    } catch (err) { flash(err.message || "حدث خطأ", false); }
    setBusy("");
  };

  if (!user || !orig) return <div className={styles.wrap} />;

  return (
    <div className={styles.wrap} dir="rtl">
      <h1>الحساب الشخصي</h1>

      <form className={styles.card} onSubmit={saveProfile}>
        <div className={styles.head}>
          <label className={styles.avatarBox} title="تغيير الصورة">
            <div className={styles.avatar} style={avatar ? { backgroundImage: `url(${avatar})` } : undefined}>
              {!avatar && (f.full_name || f.email)[0]?.toUpperCase()}
            </div>
            <span className={styles.cam}>{busy === "avatar" ? "…" : "📷"}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={uploadAvatar} disabled={busy === "avatar"} />
          </label>
          <div>
            <strong>{orig.full_name || "—"}</strong><small>{orig.email}</small>
            {avatar && <button type="button" className={styles.link} onClick={removeAvatar}>حذف الصورة</button>}
          </div>
        </div>
        <label>الاسم</label>
        <input required minLength={2} value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} />
        <label>البريد الإلكتروني</label>
        <input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <label>رقم الموبايل</label>
        <input type="tel" inputMode="tel" dir="ltr" placeholder="01XXXXXXXXX" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        <button className={styles.btn} disabled={busy === "profile"}>{busy === "profile" ? "جارٍ الحفظ..." : "حفظ التغييرات"}</button>
      </form>

      <form className={styles.card} onSubmit={changePassword}>
        <h3>تغيير كلمة المرور</h3>
        <label>كلمة المرور الحالية</label>
        <input required type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
        <label>كلمة المرور الجديدة</label>
        <input required type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
        <button className={styles.btn} disabled={busy === "pw"}>{busy === "pw" ? "جارٍ التغيير..." : "تغيير"}</button>
      </form>

      {msg && <div className={`${styles.toast} ${msg.ok ? styles.ok : styles.bad}`}>{msg.text}</div>}
    </div>
  );
}
