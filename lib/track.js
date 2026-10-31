import { supabase } from "@/lib/supabase";

const ENDPOINT = "/api/track";
const HEARTBEAT_MS = 30000;
const MAX_ERRORS = 5;

const safe = (fn, fallback) => { try { return fn(); } catch { return fallback; } };
const store = {
  get: (k) => safe(() => sessionStorage.getItem(k), null),
  set: (k, v) => safe(() => sessionStorage.setItem(k, v)),
  del: (k) => safe(() => sessionStorage.removeItem(k)),
};
const uuid = () => safe(() => crypto.randomUUID(), `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export function sessionId() {
  let s = store.get("mon_sid");
  if (!s) { s = uuid(); store.set("mon_sid", s); }
  return s;
}

let currentUser = null;
export const ready = () =>
  Promise.resolve(safe(() => supabase.auth.getSession().then(({ data }) => { currentUser = data?.session?.user?.id || null; }), null)).catch(() => {});

export function parseUA(ua = (typeof navigator !== "undefined" ? navigator.userAgent : "")) {
  const device = /tablet|ipad/i.test(ua) ? "tablet" : /mobi|android|iphone/i.test(ua) ? "mobile" : "desktop";
  const browser = /edg\//i.test(ua) ? "Edge" : /opr\/|opera/i.test(ua) ? "Opera" : /chrome|crios/i.test(ua) ? "Chrome"
    : /firefox|fxios/i.test(ua) ? "Firefox" : /safari/i.test(ua) ? "Safari" : "Other";
  const os = /windows/i.test(ua) ? "Windows" : /android/i.test(ua) ? "Android" : /iphone|ipad|ios/i.test(ua) ? "iOS"
    : /mac os/i.test(ua) ? "macOS" : /linux/i.test(ua) ? "Linux" : "Other";
  return { device, browser, os };
}

const SOURCES = [[/google\./, "google"], [/facebook\.com|fb\.com|fb\.me/, "facebook"], [/instagram\.com/, "instagram"],
  [/whatsapp\.com|wa\.me/, "whatsapp"], [/t\.co|twitter\.com|x\.com/, "twitter"], [/tiktok\.com/, "tiktok"],
  [/youtube\.com|youtu\.be/, "youtube"], [/bing\.com/, "bing"]];
export function parseSource(ref, search = "") {
  const utm = safe(() => new URLSearchParams(search).get("utm_source"), null);
  if (utm) return utm.slice(0, 40).toLowerCase();
  if (!ref) return "direct";
  const host = safe(() => new URL(ref).hostname.replace(/^www\./, ""), "");
  if (!host || host === location.hostname.replace(/^www\./, "")) return "direct";
  for (const [re, name] of SOURCES) if (re.test(host)) return name;
  return host.slice(0, 40);
}

// الدالة العامة — استخدمها من أي مكان: track("login",{email,success:false})
export function send(type, data = {}) {
  safe(() => {
    const ua = parseUA();
    const body = JSON.stringify({
      type, session_id: sessionId(), user_id: currentUser, path: location.pathname,
      device: ua.device, browser: ua.browser, os: ua.os, ...data,
    });
    if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }))) return;
    fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  });
}
export const track = send;

export function trackPageview(path) {
  safe(() => {
    const first = !store.get("mon_first");
    store.set("mon_first", "1");
    const search = location.search;
    const nav = first ? safe(() => performance.getEntriesByType("navigation")[0], null) : null;
    send("pageview", {
      path, referrer: first ? document.referrer : null,
      source: first ? parseSource(document.referrer, search) : "internal",
      load_ms: nav && nav.duration ? Math.round(nav.duration) : null,
    });

    const m = path.match(/^\/listing\/([^/?#]+)/);
    if (m) send("listing_event", { path, listing_id: safe(() => decodeURIComponent(m[1]), m[1]), event: "view" });

    if (/^\/(browse|commercial)/.test(path)) {
      const p = new URLSearchParams(search);
      const term = p.get("q") || p.get("search") || p.get("keyword") || "";
      const filters = {};
      p.forEach((v, k) => { if (v && !["q", "search", "keyword"].includes(k) && Object.keys(filters).length < 20) filters[k] = v.slice(0, 100); });
      if (term || Object.keys(filters).length) send("search", { path, term, filters, results: null });
    }
  });
}

export function bindGlobalListeners() {
  let errors = 0;
  const onError = (msg) => { if (errors++ < MAX_ERRORS) send("error", { message: String(msg || "error").slice(0, 500) }); };
  const onWinError = (e) => onError(e.message);
  const onRejection = (e) => onError(e.reason?.message || e.reason);
  const onClick = (e) => {
    const el = e.target?.closest?.("[data-track-listing]");
    if (el) send("listing_event", { listing_id: el.dataset.trackListing, event: el.dataset.trackEvent || "click" });
  };
  const timer = setInterval(() => { if (!document.hidden) send("heartbeat"); }, HEARTBEAT_MS);
  window.addEventListener("error", onWinError);
  window.addEventListener("unhandledrejection", onRejection);
  document.addEventListener("click", onClick, true);

  const sub = safe(() => supabase.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user?.id || null;
    if (event === "SIGNED_IN" && session?.user && !store.get("mon_login")) {
      store.set("mon_login", "1");
      send("login", { email: session.user.email, success: true });
    }
    if (event === "SIGNED_OUT") store.del("mon_login");
  }), null);

  return () => {
    clearInterval(timer);
    window.removeEventListener("error", onWinError);
    window.removeEventListener("unhandledrejection", onRejection);
    document.removeEventListener("click", onClick, true);
    safe(() => sub?.data?.subscription?.unsubscribe());
  };
}
