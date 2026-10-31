"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { listings, lookups } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

export default function EditListing({ params }) {
  const { id } = use(params);
  const { user, loading } = useAuth();
  const router = useRouter();
  const [lk, setLk] = useState(null);
  const [f, setF] = useState(null);
  const [status, setStatus] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => { if (!loading && !user) router.push("/auth?reason=add"); }, [user, loading]);
  useEffect(() => { lookups.all().then(setLk).catch(() => {}); }, []);
  useEffect(() => {
    if (!user) return;
    listings.get(id).then((l) => {
      if (!l || l.user_id !== user.id) return router.push("/my-listings");
      const d = l.details || {};
      setStatus(l.status);
      setF({
        deal_type: l.deal_type, category_id: l.category_id, region_id: l.region_id, title: l.title,
        description: l.description || "", price: l.price, area: l.area, area_unit: l.area_unit, contact_phone: l.contact_phone,
        rooms: d.rooms ?? 2, bathrooms: d.bathrooms ?? 1, floor: d.floor ?? 1, finishing: d.finishing || "fully_finished",
        soil_type: d.soil_type || "clay", water_source: d.water_source || "canal",
        floors_count: d.floors_count ?? 2, units_count: d.units_count ?? 4,
      });
    }).catch(() => router.push("/my-listings"));
  }, [user, id]);

  if (!f) return <main className="auth-wrap"><div className="card skel" style={{ width: 400 }} /></main>;

  const cats = lk?.categories || []; const regs = lk?.regions || [];
  const kind = cats.find((c) => String(c.id) === String(f.category_id))?.details_kind;

  const submit = async (e) => {
    e.preventDefault(); setErr("");
    if (status === "published" && !confirm("بعد التعديل سيتم إخفاء الإعلان حتى تتم مراجعته والموافقة عليه من الإدارة. هل تريد المتابعة؟")) return;
    setBusy(true);
    const details = kind === "residential" ? { rooms: +f.rooms, bathrooms: +f.bathrooms, floor: +f.floor, finishing: f.finishing }
      : kind === "agri" ? { soil_type: f.soil_type, water_source: f.water_source }
      : kind === "building" ? { floors_count: +f.floors_count, units_count: +f.units_count } : undefined;
    try {
      await listings.update(id, { deal_type: f.deal_type, category_id: +f.category_id, region_id: +f.region_id, title: f.title, description: f.description, price: +f.price, area: +f.area, area_unit: f.area_unit, contact_phone: f.contact_phone, details });
      router.push("/my-listings?edited=1");
    } catch (x) {
      setErr(x.message === "invalid_value" ? "تحقق من البيانات (رقم الموبايل المصري مثل 01012345678)." : x.message);
    } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!confirm("حذف الإعلان نهائياً؟")) return;
    try { await listings.remove(id); router.push("/my-listings"); } catch (x) { setErr(x.message); }
  };

  return (
    <main className="auth-wrap"><form className="auth-card wide" onSubmit={submit}>
      <h1>تعديل الإعلان</h1>
      {status === "published" && <p className="warn">⚠️ أي تعديل سيعيد الإعلان إلى حالة «قيد المراجعة» ولن يظهر للزوار حتى تتم الموافقة عليه.</p>}
      {status === "rejected" && <p className="warn">هذا الإعلان مرفوض. بعد التعديل سيُرسل للمراجعة من جديد.</p>}
      <div className="auth-tabs">
        <button type="button" className={f.deal_type === "sale" ? "on" : ""} onClick={() => setF({ ...f, deal_type: "sale" })}>للبيع</button>
        <button type="button" className={f.deal_type === "rent" ? "on" : ""} onClick={() => setF({ ...f, deal_type: "rent" })}>للإيجار</button>
      </div>
      <div className="row2">
        <select required className="in sel" value={f.category_id} onChange={set("category_id")}>{cats.map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}</select>
        <select required className="in sel" value={f.region_id} onChange={set("region_id")}>{regs.map((r) => <option key={r.id} value={r.id}>{r.name_ar}</option>)}</select>
      </div>
      <input required minLength={3} className="in" placeholder="عنوان الإعلان" value={f.title} onChange={set("title")} />
      <textarea className="in ta" placeholder="الوصف" value={f.description} onChange={set("description")} />
      <div className="row2">
        <input required type="number" className="in" placeholder="السعر (ج.م)" value={f.price} onChange={set("price")} />
        <input required type="number" className="in" placeholder="المساحة" value={f.area} onChange={set("area")} />
      </div>
      <select className="in sel" value={f.area_unit} onChange={set("area_unit")}>
        <option value="sqm">متر مربع</option><option value="feddan">فدان</option><option value="qirat">قيراط</option><option value="sahm">سهم</option>
      </select>
      <input required className="in" placeholder="رقم التواصل" value={f.contact_phone} onChange={set("contact_phone")} />
      {kind === "residential" && <div className="row2">
        <input type="number" className="in" placeholder="الغرف" value={f.rooms} onChange={set("rooms")} />
        <input type="number" className="in" placeholder="الحمامات" value={f.bathrooms} onChange={set("bathrooms")} />
        <input type="number" className="in" placeholder="الدور" value={f.floor} onChange={set("floor")} />
        <select className="in sel" value={f.finishing} onChange={set("finishing")}><option value="unfinished">بدون تشطيب</option><option value="semi_finished">نصف تشطيب</option><option value="fully_finished">تشطيب كامل</option><option value="super_lux">سوبر لوكس</option></select>
      </div>}
      {kind === "agri" && <div className="row2">
        <select className="in sel" value={f.soil_type} onChange={set("soil_type")}><option value="clay">طينية</option><option value="sandy">رملية</option><option value="loamy">طميية</option><option value="silty">غرينية</option><option value="rocky">صخرية</option></select>
        <select className="in sel" value={f.water_source} onChange={set("water_source")}><option value="canal">ترعة</option><option value="well">بئر</option><option value="rain">أمطار</option><option value="mixed">مختلط</option><option value="none">لا يوجد</option></select>
      </div>}
      {kind === "building" && <div className="row2">
        <input type="number" className="in" placeholder="عدد الأدوار" value={f.floors_count} onChange={set("floors_count")} />
        <input type="number" className="in" placeholder="عدد الوحدات" value={f.units_count} onChange={set("units_count")} />
      </div>}
      {err && <p className="err">{err}</p>}
      <button className="btn full" disabled={busy}>{busy ? "جارٍ الحفظ..." : "حفظ التعديلات"}</button>
      <button type="button" className="btn btn-danger full" onClick={remove}><Trash2 size={15} /> حذف الإعلان</button>
    </form></main>
  );
}
