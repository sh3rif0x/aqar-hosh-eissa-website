"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const PAGE = 30;
const FILTERS = [["all", "الكل"], ["paid", "مدفوعة"], ["free", "مجانية"], ["expired", "منتهية"]];
const BADGE = { paid: ["مدفوعة", "#0a7d4f"], free: ["مجانية", "#666"], expired: ["منتهية", "#c0392b"] };
const PRESETS = [["مجانية", 0, null], ["10 إعلانات / 30 يوم", 10, 30], ["30 إعلان / 30 يوم", 30, 30]];
const ERR = {
  forbidden: "هذه العملية للسوبر أدمن فقط",
  expiry_required: "حدد تاريخ انتهاء الباقة",
  invalid_quota: "الحصة غير صحيحة",
  user_not_found: "المستخدم غير موجود",
};
const pad = (n) => String(n).padStart(2, "0");
const toInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const inDays = (n) => toInput(new Date(Date.now() + n * 864e5).toISOString());
const fmt = (iso) => (iso ? new Date(iso).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" }) : "—");

export default function Subscribers() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [isSuper, setIsSuper] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ ads: 0, until: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    supabase.rpc("get_my_profile").then(({ data }) => setIsSuper(data?.role === "super_admin"));
  }, []);

  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("q");
    if (v) { setQ(v); setSearch(v); }
  }, []);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("admin_list_subscribers", {
      p_search: search || null, p_filter: filter, p_limit: PAGE, p_offset: page * PAGE,
    });
    if (error) { setErr("غير مصرح أو حدث خطأ"); return; }
    setErr(""); setItems(data.items); setTotal(data.total);
  }, [search, filter, page]);
  useEffect(() => { load(); }, [load]);

  const open = (r) => { setEdit(r); setForm({ ads: r.extra_ads, until: toInput(r.plan_expires_at) }); setErr(""); };
  const preset = (ads, days) => setForm({ ads, until: days ? inDays(days) : "" });

  async function save() {
    const ads = Number(form.ads);
    if (!Number.isInteger(ads) || ads < 0) return setErr("الحصة لازم تكون رقم صحيح من صفر وأكثر");
    if (ads > 0 && !form.until) return setErr("حدد تاريخ انتهاء الباقة");
    setBusy(true);
    const { error } = await supabase.rpc("admin_set_user_plan", {
      p_user_id: edit.id, p_extra_ads: ads, p_expires_at: ads > 0 ? new Date(form.until).toISOString() : null,
    });
    setBusy(false);
    if (error) return setErr(ERR[error.message] || "تعذر الحفظ");
    setEdit(null); load();
  }

  const daysLeft = (iso) => (iso ? Math.ceil((new Date(iso) - Date.now()) / 864e5) : null);
  const copy = (t) => { try { navigator.clipboard.writeText(t); } catch (_) {} };
  const TYPE = { broker: "مكتب / سمسار", owner: "مالك مباشر", seeker: "باحث" };
  const th = { padding: "10px 12px", textAlign: "right", fontSize: 13, fontWeight: 700, color: "#555", background: "#f3f1ea", whiteSpace: "nowrap" };
  const td = { padding: "12px", borderTop: "1px solid #eee", verticalAlign: "middle", fontSize: 14 };

  return (
    <div dir="rtl" style={{ padding: 16 }}>
      <h1>المشتركون والباقات</h1>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0", alignItems: "center" }}>
        {FILTERS.map(([k, l]) => (
          <button key={k} onClick={() => { setFilter(k); setPage(0); }} style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #ccc", fontWeight: filter === k ? 700 : 400, background: filter === k ? "#0a7d4f" : "#fff", color: filter === k ? "#fff" : "#111" }}>{l}</button>
        ))}
        <form onSubmit={(e) => { e.preventDefault(); setSearch(q.trim()); setPage(0); }} style={{ display: "flex", gap: 6, marginInlineStart: "auto" }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث برقم الحساب أو الاسم أو الموبايل أو الإيميل" style={{ padding: 8, borderRadius: 10, border: "1px solid #ccc", minWidth: 300 }} />
          <button style={{ padding: "8px 14px", borderRadius: 10, border: 0, background: "#0a7d4f", color: "#fff" }}>بحث</button>
          {search && <button type="button" onClick={() => { setQ(""); setSearch(""); setPage(0); }} style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #ccc", background: "#fff" }}>مسح</button>}
        </form>
      </div>
      <p style={{ opacity: .6, margin: "0 0 8px" }}>{total} مستخدم{search ? ` — نتائج «${search}»` : ""}</p>
      {err && !edit && <p style={{ color: "#c0392b" }}>{err}</p>}

      <div style={{ overflowX: "auto", border: "1px solid #e3e7eb", borderRadius: 14, background: "#fff" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
          <thead>
            <tr>
              <th style={th}>المستخدم</th>
              <th style={th}>رقم الحساب</th>
              <th style={th}>النوع</th>
              <th style={th}>الباقة</th>
              <th style={th}>الحصة</th>
              <th style={th}>تنتهي</th>
              {isSuper && <th style={th}></th>}
            </tr>
          </thead>
          <tbody>
            {items.map((r) => {
              const [bl, bc] = BADGE[r.plan];
              const x = r.quota;
              const pct = x && x.limit ? Math.min(100, Math.round((x.used / x.limit) * 100)) : 0;
              const dl = r.plan === "paid" ? daysLeft(r.plan_expires_at) : null;
              return (
                <tr key={r.id} style={{ opacity: r.is_blocked ? .55 : 1 }}>
                  <td style={td}>
                    <div style={{ fontWeight: 700 }}><a href={`/profile/${r.id}`} target="_blank" rel="noreferrer" style={{ color: "inherit" }}>{r.full_name || "مستخدم"}</a>{r.is_blocked && <span style={{ color: "#c0392b", fontWeight: 400 }}> • محظور</span>}</div>
                    {r.office_name && <div style={{ fontSize: 13, opacity: .7 }}>{r.office_name}</div>}
                    <a href={`/profile/${r.id}`} target="_blank" rel="noreferrer" style={{ display: "block", fontSize: 13, color: "#0a7d4f", textDecoration: "none" }} dir="ltr">{r.email || r.phone || "بدون بيانات تواصل"}</a>
                    {r.email && r.phone && <div style={{ fontSize: 13, opacity: .7 }} dir="ltr">{r.phone}</div>}
                  </td>
                  <td style={td}>
                    <a href={`/profile/${r.id}`} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "inherit" }}><code style={{ background: "#f3f1ea", padding: "3px 8px", borderRadius: 6, letterSpacing: 1 }}>{r.account_id}</code></a>
                    <button title="نسخ" onClick={() => copy(r.account_id)} style={{ border: 0, background: "none", cursor: "pointer" }}>📋</button>
                  </td>
                  <td style={td}>{TYPE[r.account_type] || r.account_type}</td>
                  <td style={td}>
                    <span style={{ background: bc, color: "#fff", borderRadius: 8, padding: "3px 12px", fontSize: 13 }}>{bl}</span>
                    {r.plan === "paid" && <div style={{ fontSize: 13, marginTop: 4 }}>+{r.extra_ads} إعلان</div>}
                  </td>
                  <td style={{ ...td, minWidth: 150 }}>
                    {x ? (<>
                      <div style={{ fontSize: 13 }}><b>{x.used}</b> / {x.limit} • متبقي <b>{x.remaining}</b>{x.period === "month" ? " (شهريًا)" : ""}</div>
                      <div style={{ height: 6, background: "#eee", borderRadius: 6, marginTop: 6, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: pct >= 100 ? "#c0392b" : "#0a7d4f" }} />
                      </div>
                    </>) : "—"}
                  </td>
                  <td style={td}>
                    {r.plan_expires_at ? (<>
                      <div style={{ fontSize: 13 }}>{fmt(r.plan_expires_at)}</div>
                      {dl != null && <div style={{ fontSize: 12, color: dl <= 3 ? "#c0392b" : "#0a7d4f" }}>{dl > 0 ? `باقي ${dl} يوم` : "ينتهي اليوم"}</div>}
                    </>) : "—"}
                  </td>
                  {isSuper && <td style={td}><button onClick={() => open(r)} style={{ padding: "6px 14px", borderRadius: 10, border: "1px solid #0a7d4f", background: "#fff", color: "#0a7d4f", whiteSpace: "nowrap" }}>تعديل الباقة</button></td>}
                </tr>
              );
            })}
            {!items.length && <tr><td colSpan={7} style={{ ...td, textAlign: "center", opacity: .6 }}>لا توجد نتائج</td></tr>}
          </tbody>
        </table>
      </div>

      {total > PAGE && (
        <div style={{ display: "flex", gap: 12, justifyContent: "center", margin: 16 }}>
          <button disabled={page === 0} onClick={() => setPage(page - 1)}>السابق</button>
          <span>{page + 1} / {Math.ceil(total / PAGE)}</span>
          <button disabled={(page + 1) * PAGE >= total} onClick={() => setPage(page + 1)}>التالي</button>
        </div>
      )}

      {edit && (
        <div onClick={() => setEdit(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "grid", placeItems: "center", zIndex: 50 }}>
          <div onClick={(e) => e.stopPropagation()} dir="rtl" style={{ background: "#fff", borderRadius: 16, padding: 20, width: "min(440px, 92vw)", display: "grid", gap: 12 }}>
            <h3 style={{ margin: 0 }}>تعديل باقة: {edit.full_name || "مستخدم"}</h3>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {PRESETS.map(([l, a, d]) => <button key={l} onClick={() => preset(a, d)} style={{ padding: "6px 12px", borderRadius: 10, border: "1px solid #ccc", background: "#f6f7f8" }}>{l}</button>)}
            </div>
            <label>عدد إعلانات الباقة (فوق الحصة المجانية)
              <input type="number" min="0" value={form.ads} onChange={(e) => setForm({ ...form, ads: e.target.value })} style={{ width: "100%", padding: 8, borderRadius: 10, border: "1px solid #ccc" }} />
            </label>
            <label>تاريخ ووقت الانتهاء
              <input type="datetime-local" value={form.until} disabled={Number(form.ads) === 0} onChange={(e) => setForm({ ...form, until: e.target.value })} style={{ width: "100%", padding: 8, borderRadius: 10, border: "1px solid #ccc" }} />
            </label>
            <small style={{ opacity: .6 }}>الحصة صفر = باقة مجانية. أي تعديل بيتسجل في سجل النشاط.</small>
            {err && <p style={{ color: "#c0392b", margin: 0 }}>{err}</p>}
            <div style={{ display: "flex", gap: 8 }}>
              <button disabled={busy} onClick={save} style={{ background: "#0a7d4f", color: "#fff", border: 0, borderRadius: 10, padding: "8px 20px" }}>{busy ? "..." : "حفظ"}</button>
              <button onClick={() => setEdit(null)} style={{ borderRadius: 10, padding: "8px 20px", border: "1px solid #ccc", background: "#fff" }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
