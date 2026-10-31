// لإضافة نوع حدث جديد: أضف سطراً هنا + دالة mon_ingest_<name> في SQL.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clean = (v, n = 300) => (typeof v === "string" && v.trim() ? v.slice(0, n) : null);
const LISTING_EVENTS = ["view", "call", "whatsapp", "favorite", "share", "click"];

const base = (b, c) => ({
  session_id: clean(b.session_id, 64),
  user_id: UUID.test(b.user_id || "") ? b.user_id : null,
  path: clean(b.path),
  device: clean(b.device, 20),
  ip: c.ip, country: c.country, city: c.city,
});

const filtersOf = (f) => {
  if (!f || typeof f !== "object" || Array.isArray(f)) return {};
  return Object.fromEntries(Object.entries(f).slice(0, 20).map(([k, v]) => [String(k).slice(0, 40), String(v).slice(0, 100)]));
};

export const HANDLERS = {
  pageview: { rpc: "mon_ingest_pageview", build: (b, c) => ({
    ...base(b, c), referrer: clean(b.referrer), source: clean(b.source, 40), browser: clean(b.browser, 40), os: clean(b.os, 40),
    load_ms: Number.isFinite(+b.load_ms) && b.load_ms !== null ? Math.round(+b.load_ms) : null }) },
  heartbeat: { rpc: "mon_ingest_heartbeat", build: (b, c) => base(b, c) },
  listing_event: { rpc: "mon_ingest_listing_event", build: (b, c) => ({
    ...base(b, c), listing_id: clean(b.listing_id, 64), event: LISTING_EVENTS.includes(b.event) ? b.event : "click" }) },
  search: { rpc: "mon_ingest_search", build: (b, c) => ({
    ...base(b, c), term: (clean(b.term, 100) || "").toLowerCase(), filters: filtersOf(b.filters),
    results: Number.isFinite(+b.results) && b.results !== null ? Math.max(0, Math.round(+b.results)) : null }) },
  login: { rpc: "mon_ingest_login", build: (b, c) => ({ ...base(b, c), email: clean(b.email, 200), success: b.success !== false }) },
  error: { rpc: "mon_ingest_error", build: (b, c) => ({ ...base(b, c), message: clean(b.message, 500) }) },
};
