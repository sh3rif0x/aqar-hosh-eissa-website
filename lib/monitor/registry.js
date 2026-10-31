// ============================================================
// لإضافة قسم : أنشئ ملفاً في ./sections ثم أضف import + اسمه في RAW.
// لحذف قسم  : احذف سطر import واسمه من RAW (أو enabled:false).
// لتعطيل ميزة بدون تعديل كود: NEXT_PUBLIC_MONITOR_OFF="security,health.slow_pages"
// ============================================================
import live from "./sections/live";
import visitors from "./sections/visitors";
import users from "./sections/users";
import listings from "./sections/listings";
import behavior from "./sections/behavior";
import security from "./sections/security";
import audit from "./sections/audit";
import health from "./sections/health";
import reports from "./sections/reports";

const RAW = [live, visitors, users, listings, behavior, security, audit, health, reports];

const OFF = new Set((process.env.NEXT_PUBLIC_MONITOR_OFF || "").split(",").map((s) => s.trim()).filter(Boolean));
const TYPES = ["stat", "bars", "table", "form"];

function clean(s) {
  if (!s || !s.id || !s.label || !Array.isArray(s.features)) {
    console.warn("[monitor] قسم غير صالح تم تجاهله:", s?.id);
    return null;
  }
  if (s.enabled === false || OFF.has(s.id)) return null;
  const seen = new Set();
  const features = s.features
    .filter((f) => {
      const ok = f && f.id && f.rpc && TYPES.includes(f.type) && f.enabled !== false
        && !OFF.has(`${s.id}.${f.id}`) && !seen.has(f.id);
      if (ok) seen.add(f.id);
      else if (f && f.enabled !== false) console.warn("[monitor] ميزة غير صالحة تم تجاهلها:", s.id, f?.id);
      return ok;
    })
    .map((f) => ({ ...f, section: s.id, key: `${s.id}.${f.id}` }));
  return { ...s, features };
}

export const SECTIONS = RAW.map(clean).filter(Boolean).sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
export const getSection = (id) => SECTIONS.find((s) => s.id === id);
export const overviewFeatures = () => SECTIONS.flatMap((s) => s.features.filter((f) => f.overview));
export const MONITOR_NAV = [["overview", "نظرة عامة"], ...SECTIONS.map((s) => [s.id, s.label])];
