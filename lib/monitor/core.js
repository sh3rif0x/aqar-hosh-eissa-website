import { supabase } from "@/lib/supabase";

export const cls = (...a) => a.filter(Boolean).join(" ");
export const REFRESH_EVENT = "monitor:refresh";
export const refreshAll = () => { try { window.dispatchEvent(new Event(REFRESH_EVENT)); } catch {} };
export const DAY_OPTIONS = [[1, "اليوم"], [7, "7 أيام"], [30, "30 يوم"], [90, "90 يوم"]];

export const FORMATS = {
  text: (v) => (v === null || v === undefined || v === "" ? "—" : String(v)),
  num: (v) => (v === null || v === undefined ? "—" : Number(v).toLocaleString("ar-EG")),
  date: (v) => (v ? new Date(v).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" }) : "—"),
  day: (v) => (v ? new Date(v).toLocaleDateString("ar-EG") : "—"),
  bool: (v) => (v ? "✅" : "❌"),
};

export function errMsg(e) {
  const m = e?.message || "";
  if (m === "forbidden") return "ليس لديك صلاحية";
  if (e?.code === "PGRST202" || /could not find the function/i.test(m)) return "الدالة غير مثبتة في قاعدة البيانات (شغّل supabase/monitor.sql)";
  return m || "حدث خطأ غير متوقع";
}

export async function callRpc(name, args) {
  const { data, error } = await supabase.rpc(name, args || {});
  if (error) throw error;
  return data;
}

export async function callFeature(f, days) {
  const args = { ...(f.noDays ? {} : { p_days: days }), ...(f.args || {}) };
  const data = await callRpc(f.rpc, args);
  return f.pick ? f.pick(data) : data;
}

const raw = (r, c) => (c.get ? c.get(r) : r[c.key]);
export function toCsv(rows, cols) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [cols.map((c) => esc(c.label)).join(","), ...rows.map((r) => cols.map((c) => esc(raw(r, c))).join(","))].join("\n");
}
export function downloadCsv(name, text) {
  const url = URL.createObjectURL(new Blob(["\uFEFF" + text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export { raw as cellValue };
