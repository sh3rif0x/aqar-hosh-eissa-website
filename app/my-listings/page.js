"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2, Pencil, UserCog } from "lucide-react";
import { listings, profile } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { normalize, items } from "@/lib/normalize";
import AccountTypeBadge from "@/components/AccountTypeBadge";
import FeatureModal from "@/components/FeatureModal";

const STATUS = { pending: "قيد المراجعة", published: "منشور", rejected: "مرفوض" };

export default function Page() { return <Suspense><MyListings /></Suspense>; }

function MyListings() {
  const { user, me, loading } = useAuth();
  const router = useRouter();
  const edited = useSearchParams().get("edited");
  const [list, setList] = useState(null);
  const [quota, setQuota] = useState(null);
  const [office, setOffice] = useState("");
  const [err, setErr] = useState("");
  const [feat, setFeat] = useState(null);

  const load = () => {
    listings.mine({ limit: 50 }).then((d) => setList(items(d))).catch(() => setList([]));
    profile.quota().then(setQuota).catch(() => {});
  };
  useEffect(() => { if (!loading && !user) router.push("/auth?reason=add"); else if (user) load(); }, [user, loading]);

  const remove = async (id) => { if (confirm("حذف الإعلان؟")) { await listings.remove(id); load(); } };

  if (!user || !quota) return <section className="section"><div className="container"><div className="card skel" /></div></section>;

  return (
    <section className="section" style={{ minHeight: "70vh" }}><div className="container">
      <header className="sec-head">
        <h2>إعلاناتي</h2>
        <Link href="/add-listing" className="btn"><Plus size={15} /> إعلان جديد</Link>
      </header>

      <div className="acct">
        <AccountTypeBadge />
        <input className="office" placeholder="اسم المكتب العقاري (للمكاتب والسماسرة)" value={office || me?.office_name || ""} onChange={(e) => setOffice(e.target.value)} />
        {err && <p className="err">{err}</p>}

        {quota.unlimited ? (
          <p className="ok">🟢 حساب مالك — الإعلانات مجانية وبدون حد. (استخدمت {quota.used})</p>
        ) : (
          <div className="quota">
            <p>{quota.account_type === "broker" ? "🔵 مكتب/سمسار" : "🟢 حساب عادي"} — استخدمت <b>{quota.used}</b> من <b>{quota.limit}</b> إعلان (المجاني {quota.free_limit}{quota.extra_ads ? ` + مشترى ${quota.extra_ads}` : ""})</p>
            <div className="bar-q"><i style={{ width: `${Math.min(100, (quota.used / quota.limit) * 100)}%` }} /></div>
            {quota.remaining <= 0 && (
              <div className="plans">
                <p className="err">انتهت إعلاناتك المجانية. اشترك لإضافة المزيد:</p>
                <div><strong>10 إعلانات</strong><span>100 ج.م</span></div>
                <div><strong>30 إعلان</strong><span>250 ج.م / شهر</span></div>
                {quota.account_type === "broker" && <Link href="/pricing" className="btn">اشترك في باقة</Link>}
              </div>
            )}
          </div>
        )}
      </div>

      {edited && <p className="warn">تم حفظ التعديلات. الإعلان الآن «قيد المراجعة» وسيظهر للزوار بعد موافقة الإدارة.</p>}
      <Link href="/profile" className="btn btn-outline"><UserCog size={15} /> تعديل بيانات الحساب</Link>
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
            {l.status !== "rejected" && <button onClick={() => setFeat(l)} aria-label="ميّز إعلانك" title="ميّز إعلانك الآن">⭐</button>}
            <Link href={`/my-listings/edit/${l.id}`} className="icon-btn" aria-label="تعديل"><Pencil size={16} /></Link>
            <button onClick={() => remove(l.id)} aria-label="حذف"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
      <FeatureModal open={!!feat} onClose={() => setFeat(null)} listing={feat} />
    </div></section>
  );
}
