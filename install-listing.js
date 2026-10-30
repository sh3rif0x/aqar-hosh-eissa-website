#!/usr/bin/env node
// install-listing.js — يثبّت: نافذة مشاركة بالمنصات + نافذة إبلاغ (سبب + تفاصيل) + نموذج رسالة لصاحب الإعلان
// الاستخدام من جذر المشروع:  node install-listing.js        (أو: node install-listing.js app/listing/[id]/page.js)
// - يبحث عن صفحة الإعلان (الملف الذي فيه "مشاركة" و"إبلاغ")، ويأخذ نسخة .bak قبل التعديل
const fs = require("fs");
const path = require("path");
const FILES = {"ListingActions.js":"\"use client\";\nimport { useEffect, useState } from \"react\";\nimport { createPortal } from \"react-dom\";\nimport Link from \"next/link\";\nimport { useParams, usePathname } from \"next/navigation\";\nimport { X, Link2, Send, MessageCircle, Camera, Share2, Check } from \"lucide-react\";\nimport { supabase } from \"@/lib/supabase\";\nimport { useAuth } from \"@/lib/AuthContext\";\nimport styles from \"./ListingActions.module.css\";\n\n/* ---------- أدوات مشتركة ---------- */\nfunction useListingId() {\n  const p = useParams();\n  const path = usePathname();\n  return p?.id || (path || \"\").split(\"/\").filter(Boolean).pop();\n}\nconst pageTitle = () => (typeof document === \"undefined\" ? \"\" : document.title || \"\");\nconst pageUrl = () => (typeof window === \"undefined\" ? \"\" : window.location.href);\nconst pageImage = () => {\n  if (typeof document === \"undefined\") return \"\";\n  return document.querySelector('meta[property=\"og:image\"]')?.content || \"\";\n};\nconst ERR = {\n  unauthenticated: \"سجّل دخولك أولاً\", blocked: \"حسابك محظور\", own_listing: \"لا يمكنك مراسلة نفسك على إعلانك\",\n  listing_not_found: \"الإعلان غير متاح\", name_required: \"اكتب اسمك\", message_required: \"اكتب رسالة لا تقل عن 5 أحرف\",\n  invalid_phone: \"رقم الموبايل غير صحيح\", rate_limited: \"أرسلت رسائل كثيرة، حاول لاحقاً\",\n};\nconst errText = (e) => ERR[e?.message] || \"حدث خطأ، حاول مرة أخرى\";\n\nfunction Modal({ title, sub, onClose, children }) {\n  useEffect(() => {\n    const key = (e) => e.key === \"Escape\" && onClose();\n    document.addEventListener(\"keydown\", key);\n    const prev = document.body.style.overflow;\n    document.body.style.overflow = \"hidden\";\n    return () => { document.removeEventListener(\"keydown\", key); document.body.style.overflow = prev; };\n  }, [onClose]);\n  if (typeof document === \"undefined\") return null;\n  return createPortal(\n    <div className={styles.bg} onMouseDown={onClose}>\n      <div className={styles.box} dir=\"rtl\" role=\"dialog\" aria-modal=\"true\" onMouseDown={(e) => e.stopPropagation()}>\n        <button type=\"button\" className={styles.x} onClick={onClose} aria-label=\"إغلاق\"><X size={18} /></button>\n        <h2>{title}</h2>\n        {sub && <p className={styles.sub}>{sub}</p>}\n        {children}\n      </div>\n    </div>,\n    document.body\n  );\n}\n\n/* ============ زر المشاركة + نافذة المنصات ============ */\nexport function ShareTrigger({ children, ...btn }) {\n  const [open, setOpen] = useState(false);\n  const [ctx, setCtx] = useState({ url: \"\", title: \"\", image: \"\" });\n  const [copied, setCopied] = useState(false);\n\n  const show = () => { setCtx({ url: pageUrl(), title: pageTitle(), image: pageImage() }); setCopied(false); setOpen(true); };\n  const copy = async () => {\n    try { await navigator.clipboard.writeText(ctx.url); } catch {\n      const t = document.createElement(\"textarea\"); t.value = ctx.url; document.body.appendChild(t); t.select(); document.execCommand(\"copy\"); t.remove();\n    }\n    setCopied(true); setTimeout(() => setCopied(false), 2500);\n  };\n  const u = encodeURIComponent(ctx.url), t = encodeURIComponent(ctx.title);\n  const platforms = [\n    { k: \"wa\", label: \"واتساب\", bg: \"#25d366\", icon: <MessageCircle size={26} />, href: `https://wa.me/?text=${t}%20${u}` },\n    { k: \"fb\", label: \"فيسبوك\", bg: \"#1877f2\", icon: <b className={styles.glyph}>f</b>, href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },\n    { k: \"x\", label: \"إكس\", bg: \"#000\", icon: <b className={styles.glyph}>𝕏</b>, href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },\n    { k: \"tg\", label: \"تيليجرام\", bg: \"#229ed9\", icon: <Send size={24} />, href: `https://t.me/share/url?url=${u}&text=${t}` },\n    { k: \"in\", label: \"لينكدإن\", bg: \"#0a66c2\", icon: <b className={styles.glyph}>in</b>, href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },\n    ...(ctx.image ? [{ k: \"pi\", label: \"بنترست\", bg: \"#e60023\", icon: <b className={styles.glyph}>P</b>, href: `https://pinterest.com/pin/create/button/?url=${u}&media=${encodeURIComponent(ctx.image)}&description=${t}` }] : []),\n    { k: \"ig\", label: \"انستجرام\", bg: \"linear-gradient(45deg,#f9a825,#e1306c,#7b3fe4)\", icon: <Camera size={24} />, onClick: async () => { await copy(); window.open(\"https://www.instagram.com/\", \"_blank\", \"noopener\"); } },\n    { k: \"cp\", label: \"نسخ الرابط\", bg: \"#5d6781\", icon: <Link2 size={24} />, onClick: copy },\n  ];\n  const native = typeof navigator !== \"undefined\" && navigator.share;\n\n  return (\n    <>\n      <button type=\"button\" {...btn} onClick={show}>{children}</button>\n      {open && (\n        <Modal title=\"مشاركة الإعلان\" sub=\"اختر المنصة التي تريد المشاركة عليها\" onClose={() => setOpen(false)}>\n          {ctx.image && <img className={styles.pic} src={ctx.image} alt=\"\" />}\n          <p className={styles.ttl}>{ctx.title}</p>\n          <div className={styles.grid}>\n            {platforms.map((p) => {\n              const inner = (<><span className={styles.circle} style={{ background: p.bg }}>{p.icon}</span><span>{p.label}</span></>);\n              return p.href\n                ? <a key={p.k} className={styles.plat} href={p.href} target=\"_blank\" rel=\"noopener noreferrer\">{inner}</a>\n                : <button key={p.k} type=\"button\" className={styles.plat} onClick={p.onClick}>{inner}</button>;\n            })}\n          </div>\n          {native && <button type=\"button\" className={styles.ghost} onClick={() => navigator.share({ title: ctx.title, url: ctx.url }).catch(() => {})}><Share2 size={16} /> مشاركة عبر تطبيقات الجهاز</button>}\n          <div className={styles.urlRow}>\n            <button type=\"button\" className={styles.copy} onClick={copy}>{copied ? <><Check size={15} /> تم النسخ</> : \"نسخ\"}</button>\n            <input readOnly value={ctx.url} dir=\"ltr\" onFocus={(e) => e.target.select()} />\n          </div>\n        </Modal>\n      )}\n    </>\n  );\n}\n\n/* ============ زر الإبلاغ + نافذة النموذج ============ */\nconst REASONS = [\"محتوى مخالف أو مضلل\", \"إعلان مكرر\", \"السعر غير حقيقي\", \"العقار غير متاح (تم بيعه / تأجيره)\", \"صور غير حقيقية\", \"احتيال أو نصب\", \"أخرى\"];\n\nexport function ReportTrigger({ children, ...btn }) {\n  const { user } = useAuth();\n  const id = useListingId();\n  const [open, setOpen] = useState(false);\n  const [reason, setReason] = useState(\"\");\n  const [details, setDetails] = useState(\"\");\n  const [busy, setBusy] = useState(false);\n  const [err, setErr] = useState(\"\");\n  const [done, setDone] = useState(false);\n\n  const show = () => { setOpen(true); setDone(false); setErr(\"\"); };\n  const close = () => { setOpen(false); setReason(\"\"); setDetails(\"\"); };\n  const submit = async (e) => {\n    e.preventDefault();\n    if (!reason) return setErr(\"اختر سبب الإبلاغ\");\n    if (reason === \"أخرى\" && details.trim().length < 3) return setErr(\"اكتب تفاصيل المشكلة\");\n    setBusy(true); setErr(\"\");\n    const { error } = await supabase.rpc(\"create_report\", { p_kind: \"listing\", p_listing_id: id, p_user_id: null, p_reason: reason, p_details: details.trim() || null });\n    setBusy(false);\n    if (error) return setErr(errText(error));\n    setDone(true);\n  };\n\n  return (\n    <>\n      <button type=\"button\" {...btn} onClick={show}>{children}</button>\n      {open && (\n        <Modal title=\"الإبلاغ عن إعلان\" sub=\"ساعدنا في الحفاظ على جودة المنصة بالإبلاغ عن المخالفات\" onClose={close}>\n          {!user ? (\n            <div className={styles.center}><p>سجّل دخولك لتتمكن من الإبلاغ.</p><Link className={styles.primary} href=\"/auth\">تسجيل الدخول</Link></div>\n          ) : done ? (\n            <div className={styles.center}><p className={styles.okTxt}>✅ تم إرسال البلاغ، شكراً لمساعدتك. سنراجعه قريباً.</p><button type=\"button\" className={styles.primary} onClick={close}>إغلاق</button></div>\n          ) : (\n            <form onSubmit={submit} className={styles.form}>\n              <select value={reason} onChange={(e) => setReason(e.target.value)} className={styles.in}>\n                <option value=\"\">اختر سبب الإبلاغ</option>\n                {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}\n              </select>\n              <textarea className={styles.in} rows={4} maxLength={500} value={details} onChange={(e) => setDetails(e.target.value)} placeholder=\"تفاصيل إضافية (اختياري)\" />\n              {err && <p className={styles.err}>{err}</p>}\n              <div className={styles.row}>\n                <button type=\"button\" className={styles.ghost} onClick={close}>إلغاء</button>\n                <button className={styles.danger} disabled={busy}>{busy ? \"جارٍ الإرسال...\" : \"إرسال الإبلاغ\"}</button>\n              </div>\n            </form>\n          )}\n        </Modal>\n      )}\n    </>\n  );\n}\n\n/* ============ نموذج الرسالة المباشرة لصاحب الإعلان ============ */\nexport function InquiryForm() {\n  const { user } = useAuth();\n  const id = useListingId();\n  const [f, setF] = useState({ name: \"\", phone: \"\", message: \"\" });\n  const [busy, setBusy] = useState(false);\n  const [err, setErr] = useState(\"\");\n  const [sent, setSent] = useState(false);\n\n  useEffect(() => {\n    setF((x) => ({ ...x, message: x.message || `مرحباً، أنا مهتم بهذا الإعلان: ${pageTitle().split(\"|\")[0].trim()}` }));\n  }, []);\n  useEffect(() => {\n    if (!user) return;\n    supabase.rpc(\"get_my_profile\").then(({ data }) => data && setF((x) => ({ ...x, name: x.name || data.full_name || \"\", phone: x.phone || data.phone || \"\" })));\n  }, [user]);\n\n  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });\n  const submit = async (e) => {\n    e.preventDefault(); setBusy(true); setErr(\"\");\n    const { error } = await supabase.rpc(\"send_listing_inquiry\", { p_listing_id: id, p_name: f.name, p_phone: f.phone || null, p_message: f.message });\n    setBusy(false);\n    if (error) return setErr(errText(error));\n    setSent(true);\n  };\n\n  return (\n    <div className={styles.inq} dir=\"rtl\">\n      <h3>مهتم بهذا العقار؟</h3>\n      {sent ? (\n        <p className={styles.okTxt}>✅ تم إرسال رسالتك لصاحب الإعلان، وسيتواصل معك قريباً.</p>\n      ) : !user ? (\n        <p className={styles.hint}><Link href=\"/auth\">سجّل دخولك</Link> لإرسال رسالة مباشرة لصاحب الإعلان.</p>\n      ) : (\n        <form onSubmit={submit} className={styles.form}>\n          <label>الاسم<input required minLength={2} maxLength={80} className={styles.in} value={f.name} onChange={set(\"name\")} /></label>\n          <label>رقم الموبايل (اختياري)<input type=\"tel\" inputMode=\"tel\" dir=\"ltr\" className={styles.in} value={f.phone} onChange={set(\"phone\")} placeholder=\"01XXXXXXXXX\" /></label>\n          <label>الرسالة *<textarea required minLength={5} maxLength={1000} rows={3} className={styles.in} value={f.message} onChange={set(\"message\")} /></label>\n          {err && <p className={styles.err}>{err}</p>}\n          <button className={styles.primary} disabled={busy}>{busy ? \"جارٍ الإرسال...\" : \"إرسال الاستفسار\"}</button>\n          <small className={styles.hint}>بياناتك تصل لصاحب الإعلان فقط.</small>\n        </form>\n      )}\n    </div>\n  );\n}\n","ListingActions.module.css":".bg { position: fixed; inset: 0; z-index: 1000; background: rgba(20,14,8,.6); display: grid; place-items: center; padding: 1rem; overflow-y: auto; }\n.box { position: relative; width: min(480px, 100%); max-height: 94vh; overflow-y: auto; background: #fff; border-radius: 20px; padding: 1.5rem 1.3rem 1.3rem; box-shadow: 0 24px 60px rgba(0,0,0,.35); animation: up .18s ease-out; color: #1b2a27; }\n@keyframes up { from { opacity: 0; transform: translateY(10px); } }\n.box h2 { margin: 0 0 .25rem; font-size: 1.3rem; text-align: center; }\n.sub { margin: 0 0 1rem; text-align: center; color: #6b7a76; font-size: .9rem; }\n.x { position: absolute; top: .9rem; inset-inline-start: .9rem; width: 34px; height: 34px; border: 0; border-radius: 50%; background: #f1eee5; display: grid; place-items: center; cursor: pointer; }\n.pic { width: 100%; max-height: 190px; object-fit: cover; border-radius: 14px; margin-bottom: .6rem; }\n.ttl { margin: 0 0 1rem; text-align: center; font-size: .88rem; color: #4b5a56; }\n.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: .9rem .4rem; margin-bottom: 1rem; }\n.plat { display: grid; justify-items: center; gap: .4rem; border: 0; background: none; font: inherit; font-size: .78rem; color: inherit; text-decoration: none; cursor: pointer; }\n.circle { width: 54px; height: 54px; border-radius: 50%; color: #fff; display: grid; place-items: center; box-shadow: 0 4px 12px rgba(0,0,0,.18); transition: transform .12s; }\n.plat:hover .circle { transform: translateY(-2px); }\n.glyph { font-size: 1.25rem; font-family: Arial, sans-serif; }\n.urlRow { display: flex; gap: .5rem; align-items: center; border: 1px solid #e4e0d6; border-radius: 12px; padding: .4rem; background: #faf8f3; }\n.urlRow input { flex: 1; min-width: 0; border: 0; background: none; font: inherit; font-size: .78rem; color: #4b5a56; text-overflow: ellipsis; }\n.copy { flex: none; display: inline-flex; align-items: center; gap: .3rem; padding: .55rem 1rem; border: 0; border-radius: 9px; background: #1b2a3a; color: #fff; font: inherit; font-size: .85rem; cursor: pointer; }\n.form { display: grid; gap: .7rem; }\n.form label { display: grid; gap: .25rem; font-size: .85rem; color: #6b7a76; }\n.in { width: 100%; padding: .65rem .8rem; border: 1px solid #e4e0d6; border-radius: 10px; background: #fff; font: inherit; color: #1b2a27; resize: vertical; }\n.in:focus { outline: 2px solid #b8731f; outline-offset: -1px; }\n.row { display: flex; gap: .6rem; justify-content: flex-end; }\n.primary { display: inline-flex; justify-content: center; align-items: center; width: 100%; padding: .75rem 1rem; border: 0; border-radius: 10px; background: #b8731f; color: #fff; font: inherit; font-weight: 700; text-decoration: none; cursor: pointer; }\n.row .primary { width: auto; }\n.danger { padding: .65rem 1.3rem; border: 0; border-radius: 10px; background: #c2410c; color: #fff; font: inherit; font-weight: 700; cursor: pointer; }\n.ghost { display: inline-flex; align-items: center; justify-content: center; gap: .4rem; padding: .65rem 1.1rem; border: 1px solid #e4e0d6; border-radius: 10px; background: #fff; font: inherit; cursor: pointer; margin-bottom: .8rem; }\n.row .ghost { margin: 0; }\n.primary:disabled, .danger:disabled { opacity: .6; cursor: not-allowed; }\n.err { margin: 0; color: #c2410c; font-size: .85rem; }\n.okTxt { margin: 0; color: #166534; background: #dcf3e4; padding: .8rem 1rem; border-radius: 10px; font-size: .9rem; }\n.hint { color: #6b7a76; font-size: .8rem; }\n.hint a { color: #b8731f; font-weight: 600; }\n.center { display: grid; gap: .9rem; justify-items: center; text-align: center; }\n.inq { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e4e0d6; }\n.inq h3 { margin: 0 0 .7rem; font-size: 1rem; }\n"};
const root = process.cwd();
const src = fs.existsSync(path.join(root, "src/app")) || fs.existsSync(path.join(root, "src/components")) ? path.join(root, "src") : root;

const compDir = path.join(src, "components");
fs.mkdirSync(compDir, { recursive: true });
for (const [name, content] of Object.entries(FILES)) { fs.writeFileSync(path.join(compDir, name), content); console.log("✅", path.relative(root, path.join(compDir, name))); }

// ---- الصفحة ----
let page = process.argv[2] ? path.resolve(root, process.argv[2]) : null;
if (!page) {
  const found = [];
  (function walk(d, depth) {
    if (depth > 7) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (["node_modules", ".next", ".git", "public"].includes(e.name)) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p, depth + 1);
      else if (/\.(js|jsx|tsx)$/.test(e.name) && !/ListingActions/.test(e.name)) { const t = fs.readFileSync(p, "utf8"); if (t.includes("مشاركة") && t.includes("إبلاغ")) found.push(p); }
    }
  })(src, 0);
  found.sort((a, b) => (/listing/i.test(b) ? 1 : 0) - (/listing/i.test(a) ? 1 : 0));
  page = found[0];
  if (found.length > 1) console.log("ℹ️ ملفات مرشّحة:", found.map((f) => path.relative(root, f)).join(" , "));
}
if (!page || !fs.existsSync(page)) { console.log("\n⚠️ لم أجد صفحة الإعلان. شغّل:  node install-listing.js app/listing/[id]/page.js"); process.exit(0); }
let code = fs.readFileSync(page, "utf8");
console.log("📄 الصفحة:", path.relative(root, page));
if (code.includes("ListingActions")) { console.log("ℹ️ الصفحة تستخدم المكوّنات بالفعل."); process.exit(0); }

function openEnd(s, i) {
  let j = i + 1, brace = 0, q = null;
  for (; j < s.length; j++) {
    const c = s[j];
    if (q) { if (c === q && s[j - 1] !== "\\") q = null; continue; }
    if (brace > 0) { if (c === "{") brace++; else if (c === "}") brace--; else if (c === '"' || c === "'" || c === "`") q = c; continue; }
    if (c === "{") { brace = 1; continue; }
    if (c === '"' || c === "'") { q = c; continue; }
    if (c === ">") return { end: j, self: s[j - 1] === "/" };
  }
  return null;
}
function elementEnd(s, i) {
  const m = /^<([A-Za-z][\w.]*)/.exec(s.slice(i));
  if (!m) return null;
  const tag = m[1], first = openEnd(s, i);
  if (!first) return null;
  if (first.self) return first.end + 1;
  const esc = tag.replace(".", "\\.");
  const re = new RegExp("<" + esc + "(?=[\\s>/])|</" + esc + "\\s*>", "g");
  re.lastIndex = first.end + 1;
  let depth = 1, mm;
  while ((mm = re.exec(s))) {
    if (mm[0].startsWith("</")) { depth--; if (depth === 0) return mm.index + mm[0].length; }
    else { const o = openEnd(s, mm.index); if (o && !o.self) depth++; re.lastIndex = o ? o.end + 1 : re.lastIndex; }
  }
  return null;
}
function findButtons(s, word) { // أصغر <button> يحتوي النص
  const out = [];
  const re = /<button\b/g; let m;
  while ((m = re.exec(s))) { const e = elementEnd(s, m.index); if (e && s.slice(m.index, e).includes(word)) out.push({ start: m.index, end: e }); }
  return out;
}
function stripOnClick(open) {
  const k = open.search(/\sonClick=\{/);
  if (k < 0) return open;
  let j = open.indexOf("{", k), d = 0;
  for (; j < open.length; j++) { if (open[j] === "{") d++; else if (open[j] === "}") { d--; if (d === 0) break; } }
  return open.slice(0, k) + open.slice(j + 1);
}
function swap(s, el, name) {
  const o = openEnd(s, el.start);
  const open = s.slice(el.start, o.end + 1).replace(/^<button/, "<" + name);
  const body = s.slice(o.end + 1, el.end).replace(/<\/button\s*>\s*$/, "</" + name + ">");
  return { start: el.start, end: el.end, text: stripOnClick(open) + body };
}

const share = findButtons(code, "مشاركة").sort((a, b) => (a.end - a.start) - (b.end - b.start))[0];
const report = findButtons(code, "إبلاغ").sort((a, b) => (a.end - a.start) - (b.end - b.start))[0];
const edits = [];
if (share) edits.push(swap(code, share, "ShareTrigger")); else console.log("⚠️ لم أجد زر «مشاركة» (<button>)؛ استبدله يدوياً بـ <ShareTrigger className=...>مشاركة</ShareTrigger>");
if (report) edits.push(swap(code, report, "ReportTrigger")); else console.log("⚠️ لم أجد زر «إبلاغ» (<button>)؛ استبدله يدوياً بـ <ReportTrigger className=...>إبلاغ</ReportTrigger>");

// مكان نموذج الرسالة: قبل الحاوية التي فيها أزرار (حفظ/مشاركة/إبلاغ)
if (share && report) {
  const lo = Math.min(share.start, report.start), hi = Math.max(share.end, report.end);
  let at = -1;
  const re = /<([A-Za-z][\w.]*)\b/g, cands = []; let m;
  while ((m = re.exec(code)) && m.index < lo) cands.push(m.index);
  for (let i = cands.length - 1; i >= 0; i--) { const e = elementEnd(code, cands[i]); if (e && e >= hi) { at = cands[i]; break; } }
  if (at > -1) edits.push({ start: at, end: at, text: "<InquiryForm />\n" });
  else console.log("⚠️ لم أحدد مكان نموذج الرسالة؛ أضف <InquiryForm /> يدوياً داخل بطاقة المعلن.");
} else console.log("⚠️ أضف <InquiryForm /> يدوياً داخل بطاقة المعلن.");

edits.sort((a, b) => b.start - a.start).forEach((e) => { code = code.slice(0, e.start) + e.text + code.slice(e.end); });

const imp = 'import { ShareTrigger, ReportTrigger, InquiryForm } from "@/components/ListingActions";';
const imports = [...code.matchAll(/^import[\s\S]*?;\s*$/gm)];
if (imports.length) { const last = imports[imports.length - 1]; const at = last.index + last[0].length; code = code.slice(0, at) + "\n" + imp + code.slice(at); }
else code = (/^["']use client["'];?\s*\n/.test(code) ? code.replace(/^(["']use client["'];?\s*\n)/, "$1" + imp + "\n") : imp + "\n" + code);

fs.copyFileSync(page, page + ".bak");
fs.writeFileSync(page, code);
console.log("💾 تم الحفظ (نسخة احتياطية: " + path.basename(page) + ".bak)");
console.log("\n🎉 تم. جرّب صفحة إعلان: مشاركة ← نافذة المنصات، إبلاغ ← نموذج، وتحت بيانات المعلن نموذج الرسالة.");
console.log("   لو ظهر خطأ استرجع:  mv \"" + path.relative(root, page) + ".bak\" \"" + path.relative(root, page) + "\"");
