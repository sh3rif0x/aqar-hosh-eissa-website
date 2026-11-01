"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const TABS = [["pending", "قيد المراجعة"], ["approved", "مفعّلة"], ["rejected", "مرفوضة"]];

export default function AdminPayments() {
  const [tab, setTab] = useState("pending");
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("admin_list_payments", { p_status: tab, p_limit: 50, p_offset: 0 });
    if (error) setErr("غير مصرح أو حدث خطأ"); else { setErr(""); setItems(data.items); }
  }, [tab]);
  useEffect(() => { load(); }, [load]);

  async function review(id, approve) {
    let note = null;
    if (!approve) { note = window.prompt("سبب الرفض (يظهر للمستخدم):", ""); if (note === null) return; }
    else if (!window.confirm("تأكيد وصول التحويل وتفعيل الطلب؟")) return;
    setBusy(id);
    const { error } = await supabase.rpc("admin_review_payment", { p_id: id, p_approve: approve, p_note: note });
    setBusy("");
    if (error) setErr("تعذر تنفيذ العملية"); else load();
  }

  return (
    <div dir="rtl" style={{ padding: 16 }}>
      <h1>طلبات الدفع</h1>
      <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #ccc", fontWeight: tab === k ? 700 : 400, background: tab === k ? "#0a7d4f" : "#fff", color: tab === k ? "#fff" : "#111" }}>{l}</button>
        ))}
      </div>
      {err && <p style={{ color: "#c0392b" }}>{err}</p>}
      {!items.length && <p style={{ opacity: .6 }}>لا توجد طلبات</p>}
      <div style={{ display: "grid", gap: 12 }}>
        {items.map((r) => (
          <div key={r.id} style={{ border: "1px solid #e3e7eb", borderRadius: 14, padding: 14 }}>
            <div><b>{r.user_name || "مستخدم"}</b> — <span dir="ltr">{r.user_phone || "بدون رقم"}</span> • {r.account_type === "broker" ? "سمسار/مكتب" : "مستخدم"}</div>
            <div>فاتورة <b>#{r.invoice_no}</b> • رقم الحساب: <code>{r.account_id}</code></div>
            <div>
              {r.kind === "feature"
                ? <>⭐ <b>تمييز إعلان</b> «{r.listing_title || "—"}» لمدة <b>{r.duration_days} يوم</b>{r.listing_id && <> — <a href={`/listing/${r.listing_id}`} target="_blank" rel="noreferrer">عرض</a></>}</>
                : <>📦 <b>باقة حصة</b>: {r.plan_credits} إعلان</>}
              {" "}• المبلغ: <b>{r.amount} ج</b>
            </div>
            {r.transferred_at && r.status === "pending" && <div style={{ color: "#0a7d4f", fontWeight: 700 }}>✓ العميل ضغط «حوّلت المبلغ» — راجع واتساب</div>}
            <small style={{ opacity: .6 }}>{new Date(r.created_at).toLocaleString("ar-EG")}</small>
            {r.admin_note && <div style={{ opacity: .7 }}>ملاحظة: {r.admin_note}</div>}
            {r.status === "pending" && (
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button disabled={busy === r.id} onClick={() => review(r.id, true)} style={{ background: "#0a7d4f", color: "#fff", border: 0, borderRadius: 10, padding: "8px 16px" }}>تأكيد وتفعيل</button>
                <button disabled={busy === r.id} onClick={() => review(r.id, false)} style={{ background: "#fff", color: "#c0392b", border: "1px solid #c0392b", borderRadius: 10, padding: "8px 16px" }}>رفض</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
