"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Building2, Home, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import styles from "./AccountTypeGate.module.css";

const OPTIONS = [
  { key: "broker", icon: Building2, title: "مكتب عقاري / سمسار", sub: "أول 3 إعلانات مجاناً" },
  { key: "owner", icon: Home, title: "مالك (بائع / مؤجر)", sub: "إعلانات مجانية بلا حد" },
  { key: "seeker", icon: Search, title: "أبحث عن عقار (شراء / إيجار)", sub: "تصفّح العقارات واحفظ ما يعجبك" },
];

/* نافذة تظهر مباشرة بعد التسجيل ولا تُغلق إلا باختيار نوع الحساب — لا يمكن تغييره لاحقاً */
export default function AccountTypeGate() {
  const { user } = useAuth();
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [pick, setPick] = useState(null);
  const [office, setOffice] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!user) { setShow(false); return; }
    let off = false;
    supabase.rpc("get_my_profile").then(({ data }) => { if (!off && data && data.account_type_set === false) setShow(true); });
    return () => { off = true; };
  }, [user]);

  useEffect(() => {
    if (!show) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [show]);

  if (!show || typeof document === "undefined") return null;

  const confirm = async () => {
    if (!pick) return;
    setBusy(true); setErr("");
    const { error } = await supabase.rpc("set_my_account_type", { p_type: pick, p_office: pick === "broker" ? office : null });
    setBusy(false);
    if (error) { setErr(error.message === "account_type_locked" ? "تم تحديد نوع حسابك من قبل" : "حدث خطأ، حاول مرة أخرى"); if (error.message === "account_type_locked") setShow(false); return; }
    setShow(false);
    window.dispatchEvent(new Event("profile-updated"));
    router.refresh();
    if (pick !== "seeker") router.push("/dashboard");
  };

  return createPortal(
    <div className={styles.bg} role="dialog" aria-modal="true" aria-labelledby="atg-title" dir="rtl">
      <div className={styles.box}>
        <h2 id="atg-title">أهلاً بك! من أنت؟</h2>
        <p className={styles.lead}>اختر نوع حسابك لنهيّئ لك التجربة المناسبة.</p>

        <div className={styles.list}>
          {OPTIONS.map((o) => (
            <button key={o.key} type="button" className={`${styles.opt} ${pick === o.key ? styles.on : ""}`} onClick={() => setPick(o.key)} aria-pressed={pick === o.key}>
              <span className={styles.ico}><o.icon size={22} /></span>
              <span className={styles.txt}><strong>{o.title}</strong><small>{o.sub}</small></span>
            </button>
          ))}
        </div>

        {pick === "broker" && (
          <input className={styles.in} value={office} onChange={(e) => setOffice(e.target.value)} maxLength={80} placeholder="اسم المكتب (اختياري)" />
        )}

        <p className={styles.warn}>⚠️ لا يمكن تغيير نوع الحساب بعد التأكيد.</p>
        {err && <p className={styles.err}>{err}</p>}
        <button type="button" className={styles.go} disabled={!pick || busy} onClick={confirm}>{busy ? "جارٍ الحفظ..." : "تأكيد ومتابعة"}</button>
      </div>
    </div>,
    document.body
  );
}
