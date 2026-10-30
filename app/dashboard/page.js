"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2, Pencil, Building, User } from "lucide-react";
import { listings, profile } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { normalize, items } from "@/lib/normalize";

const STATUS = { pending: "قيد المراجعة", published: "منشور", rejected: "مرفوض" };

export default function Page() { return <Suspense><Dashboard /></Suspense>; }

function Dashboard() {
  const { user, me, loading } = useAuth();
  const router = useRouter();
  const edited = useSearchParams().get("edited");
  const [list, setList] = useState(null);
  const [quota, setQuota] = useState(null);
  const [office, setOffice] = useState("");
  const [err, setErr] = useState("");

  const load = () => {
    listings.mine({ limit: 50 }).then((d) => setList(items(d))).catch(() => setList([]));
    profile.quota().then(setQuota).catch(() => {});
  };
  useEffect(() => { if (!loading && !user) router.push("/auth?reason=add"); else if (user) load(); }, [user, loading]);

  const choose = async (type) => {
    setErr("");
    try { await profile.setAccountType(type, type === "broker" ? office : null); location.reload(); }
    catch (e) { setErr(e.message === "office_name_required" ? "اكتب اسم المكتب" : e.message); }
  };
  const remove = async (id) => { if (confirm("حذف الإعلان؟")) { await listings.remove(id); load(); } };

  if (!user || !quota) return <section className="section"><div className="container"><div className="card skel" /></div></section>;

  return (
    <section className="section" style={{ minHeight: "70vh" }}><div className="container">
      <header className="sec-head">
        <h2>لوحة المعلن</h2>
        <Link href="/add-listing" className="btn"><Plus size={15} /> إعلان جديد</Link>
      </header>

      <div className="acct">
        <div className="acct-types">
          <button className={quota.account_type === "owner" ? "on" : ""} onClick={() => choose("owner")}><User size={18} /> مالك مباشر<small>إعلانات مجانية بلا حد</small></button>
          <button className={quota.account_type === "broker" ? "on" : ""} onClick={() => office.trim() || quota.account_type === "broker" ? choose("broker") : setErr("اكتب اسم المكتب أولاً")}><Building size={18} /> مكتب / سمسار<small>أول 3 إعلانات مجاناً</small></button>
        </div>
        {quota.account_type !== "owner" || true ? (
          <input className="office" placeholder="اسم المكتب العقاري (للمكاتب والسماسرة)" value={office || me?.office_name || ""} onChange={(e) => setOffice(e.target.value)} />
        ) : null}
        {err && <p className="err">{err}</p>}

        {quota.unlimited ? (
          <p className="ok">🟢 حساب مالك — الإعلانات مجانية وبدون حد. (استخدمت {quota.used})</p>
        ) : (
          <div className="quota">
            <p>🔵 مكتب — استخدمت <b>{quota.used}</b> من <b>{quota.limit}</b> إعلان (المجاني {quota.free_limit}{quota.extra_ads ? ` + مشترى ${quota.extra_ads}` : ""})</p>
            <div className="bar-q"><i style={{ width: `${Math.min(100, (quota.used / quota.limit) * 100)}%` }} /></div>
            {quota.remaining <= 0 && (
              <div className="plans">
                <p className="err">انتهت إعلاناتك المجانية. اشترك لإضافة المزيد:</p>
                <div><strong>10 إعلانات</strong><span>100 ج.م</span></div>
                <div><strong>30 إعلان</strong><span>250 ج.م / شهر</span></div>
                <small>الدفع الإلكتروني سيُفعّل قريباً.</small>
              </div>
            )}
          </div>
        )}
      </div>

      {edited && <p className="warn">تم حفظ التعديلات. الإعلان الآن «قيد المراجعة» وسيظهر للزوار بعد موافقة الإدارة.</p>}
      <Link href="/dashboard/profile" className="btn btn-outline">تعديل بيانات الحساب</Link>
      <h3 className="d-sub">إعلاناتي</h3>
      {!list && <div className="card skel" />}
      {list?.length === 0 && <p className="empty">لا توجد إعلانات بعد.</p>}
      <div className="my-list">
        {list?.map((l) => (
          <div key={l.id} className="my-item">
            <div className="thumb" style={{ background: l.cover_path ? `url(${l.cover_path}) center/cover` : "#e6dfd3" }} />
            <div className="grow"><Link href={`/listing/${l.id}`}><strong>{l.title}</strong></Link>
              <small>{normalize(l).price}</small>{l.status === "rejected" && l.rejection_reason && <small className="rej">سبب الرفض: {l.rejection_reason}</small>}</div>
            <span className={`st st-${l.status}`}>{STATUS[l.status]}</span>
            <Link href={`/dashboard/edit/${l.id}`} className="icon-btn" aria-label="تعديل"><Pencil size={16} /></Link>
            <button onClick={() => remove(l.id)} aria-label="حذف"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div></section>
  );
}
