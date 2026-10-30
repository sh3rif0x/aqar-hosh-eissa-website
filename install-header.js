#!/usr/bin/env node
// install-header.js — يثبّت HeaderActions (جرس الإشعارات + قائمة الحساب) ويركّبه تلقائياً داخل ملف الهيدر الموجود عندك.
// الاستخدام من جذر المشروع:  node install-header.js          (أو: node install-header.js components/Header.js)
// - يثبّت أيضاً نافذة اختيار نوع الحساب (تظهر مباشرة بعد التسجيل)
// - يبحث عن الهيدر بنفسه (الملف الذي فيه "أضف إعلانك")، ويأخذ نسخة احتياطية .bak قبل أي تعديل
// - يستبدل زر/دائرة الحساب القديمة بـ <HeaderActions />، وإن لم يجدها يضعه قبل زر "أضف إعلانك" ويخبرك
const fs = require("fs");
const path = require("path");
const FILES = {"HeaderActions.js":"\"use client\";\nimport { useCallback, useEffect, useRef, useState } from \"react\";\nimport Link from \"next/link\";\nimport { useRouter } from \"next/navigation\";\nimport { Bell, User, ChevronDown, UserCog, LayoutDashboard, ShieldCheck, LogOut } from \"lucide-react\";\nimport { supabase } from \"@/lib/supabase\";\nimport { useAuth } from \"@/lib/AuthContext\";\nimport AccountTypeGate from \"./AccountTypeGate\";\nimport styles from \"./HeaderActions.module.css\";\n\n/* يغلق القائمة عند الضغط خارجها أو بزر Esc */\nfunction useDismiss(open, setOpen) {\n  const ref = useRef(null);\n  useEffect(() => {\n    if (!open) return;\n    const down = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };\n    const key = (e) => { if (e.key === \"Escape\") setOpen(false); };\n    document.addEventListener(\"mousedown\", down);\n    document.addEventListener(\"keydown\", key);\n    return () => { document.removeEventListener(\"mousedown\", down); document.removeEventListener(\"keydown\", key); };\n  }, [open, setOpen]);\n  return ref;\n}\n\nconst ago = (d) => {\n  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);\n  if (m < 1) return \"الآن\";\n  if (m < 60) return `منذ ${m} دقيقة`;\n  const h = Math.floor(m / 60);\n  if (h < 24) return `منذ ${h} ساعة`;\n  return new Date(d).toLocaleDateString(\"ar-EG\");\n};\n\n/* ============ جرس الإشعارات ============ */\nexport function NotificationBell() {\n  const { user } = useAuth();\n  const [open, setOpen] = useState(false);\n  const [data, setData] = useState({ unread: 0, items: [] });\n  const ref = useDismiss(open, setOpen);\n\n  const load = useCallback(async () => {\n    const { data: d, error } = await supabase.rpc(\"get_my_notifications\", { p_limit: 15, p_offset: 0 });\n    if (!error && d) setData(d);\n  }, []);\n\n  useEffect(() => {\n    if (!user) return;\n    load();\n    const t = setInterval(load, 60000);\n    return () => clearInterval(t);\n  }, [user, load]);\n\n  if (!user) return null;\n\n  const toggle = () => { setOpen((o) => !o); if (!open) load(); };\n  const readOne = async (n) => {\n    if (n.read_at) return;\n    setData((d) => ({ unread: Math.max(0, d.unread - 1), items: d.items.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)) }));\n    await supabase.rpc(\"mark_notifications_read\", { p_id: n.id });\n  };\n  const readAll = async () => {\n    setData((d) => ({ unread: 0, items: d.items.map((x) => ({ ...x, read_at: x.read_at || new Date().toISOString() })) }));\n    await supabase.rpc(\"mark_notifications_read\", { p_id: null });\n  };\n\n  return (\n    <div className={styles.wrap} ref={ref}>\n      <button className={styles.trigger} onClick={toggle} aria-label=\"الإشعارات\" aria-expanded={open}>\n        <Bell size={19} />\n        {data.unread > 0 && <span className={styles.dot}>{data.unread > 9 ? \"9+\" : data.unread}</span>}\n      </button>\n      {open && (\n        <div className={`${styles.panel} ${styles.notif}`} dir=\"rtl\">\n          <div className={styles.panelHead}>\n            <strong>الإشعارات</strong>\n            {data.unread > 0 && <button onClick={readAll}>تعليم الكل كمقروء</button>}\n          </div>\n          <div className={styles.list}>\n            {data.items.length === 0 && <p className={styles.empty}>لا توجد إشعارات حتى الآن</p>}\n            {data.items.map((n) => (\n              <button key={n.id} className={`${styles.item} ${n.read_at ? \"\" : styles.unread}`} onClick={() => readOne(n)}>\n                <strong>{n.title}</strong>\n                <span>{n.body}</span>\n                <small>{ago(n.created_at)}</small>\n              </button>\n            ))}\n          </div>\n        </div>\n      )}\n    </div>\n  );\n}\n\n/* ============ قائمة الحساب (بدل الدائرة) ============ */\nexport function UserMenu() {\n  const { user } = useAuth();\n  const router = useRouter();\n  const [open, setOpen] = useState(false);\n  const [me, setMe] = useState(null);\n  const ref = useDismiss(open, setOpen);\n\n  useEffect(() => {\n    if (!user) { setMe(null); return; }\n    const load = () => supabase.rpc(\"get_my_profile\").then(({ data }) => setMe(data));\n    load();\n    window.addEventListener(\"profile-updated\", load);\n    return () => window.removeEventListener(\"profile-updated\", load);\n  }, [user]);\n\n  if (!user) return null;\n\n  const isAdmin = me?.role === \"admin\" || me?.role === \"super_admin\";\n  const logout = async () => { setOpen(false); await supabase.auth.signOut(); router.push(\"/\"); router.refresh(); };\n\n  return (\n    <div className={styles.wrap} ref={ref}>\n      <button className={`${styles.trigger} ${styles.userBtn}`} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup=\"menu\">\n        {me?.avatar_url ? <img src={me.avatar_url} alt=\"\" className={styles.pic} /> : <User size={19} />}\n        <span className={styles.uname}>{me?.full_name || \"حسابي\"}</span>\n        <ChevronDown size={15} className={open ? styles.flip : \"\"} />\n      </button>\n      {open && (\n        <div className={`${styles.panel} ${styles.menu}`} dir=\"rtl\" role=\"menu\">\n          <div className={styles.who}>\n            <strong>{me?.full_name || \"حسابي\"}</strong>\n            <small>{user.email}</small>\n          </div>\n          <Link href=\"/profile\" onClick={() => setOpen(false)} role=\"menuitem\"><UserCog size={16} /> الحساب الشخصي</Link>\n          {isAdmin && <Link href=\"/dashboard/admin\" onClick={() => setOpen(false)} role=\"menuitem\"><ShieldCheck size={16} /> لوحة الإدارة</Link>}\n          {(isAdmin || me?.account_type === \"owner\" || me?.account_type === \"broker\") && (\n            <Link href=\"/dashboard\" onClick={() => setOpen(false)} role=\"menuitem\"><LayoutDashboard size={16} /> لوحة المعلن</Link>\n          )}\n          <button onClick={logout} role=\"menuitem\" className={styles.out}><LogOut size={16} /> تسجيل الخروج</button>\n        </div>\n      )}\n    </div>\n  );\n}\n\n/* استخدمهما معاً في الهيدر */\nexport default function HeaderActions() {\n  return (\n    <div className={styles.row}>\n      <NotificationBell />\n      <UserMenu />\n      <AccountTypeGate />\n    </div>\n  );\n}\n","HeaderActions.module.css":".row { display: flex; align-items: center; gap: .5rem; }\n.wrap { position: relative; }\n.trigger { position: relative; display: inline-flex; align-items: center; gap: .45rem; height: 40px; padding: 0 .7rem; border: 1px solid #e4e0d6; border-radius: 10px; background: #fff; color: #1b2a27; font: inherit; font-size: .9rem; cursor: pointer; }\n.trigger:hover { background: #f6f3ec; }\n.trigger[aria-expanded=\"true\"] { border-color: #1f4d43; }\n.userBtn { max-width: 210px; }\n.uname { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.pic { width: 24px; height: 24px; border-radius: 6px; object-fit: cover; }\n.flip { transform: rotate(180deg); }\n.dot { position: absolute; top: -6px; inset-inline-start: -6px; min-width: 18px; height: 18px; padding: 0 4px; border-radius: 6px; background: #c2410c; color: #fff; font-size: .68rem; font-weight: 700; display: grid; place-items: center; }\n\n.panel { position: absolute; top: calc(100% + 8px); left: 0; z-index: 80; background: #fff; border: 1px solid #e4e0d6; border-radius: 14px; box-shadow: 0 12px 32px rgba(0, 0, 0, .14); overflow: hidden; animation: pop .12s ease-out; }\n@keyframes pop { from { opacity: 0; transform: translateY(-4px); } }\n.menu { width: 230px; display: grid; }\n.menu a, .menu button { display: flex; align-items: center; gap: .6rem; padding: .7rem 1rem; border: 0; background: none; font: inherit; font-size: .9rem; color: #1b2a27; text-decoration: none; cursor: pointer; text-align: start; }\n.menu a:hover, .menu button:hover { background: #f6f3ec; }\n.who { padding: .8rem 1rem; border-bottom: 1px solid #efebe1; display: grid; gap: .1rem; }\n.who small { color: #6b7a76; overflow: hidden; text-overflow: ellipsis; }\n.out { color: #c2410c !important; border-top: 1px solid #efebe1 !important; }\n\n.notif { width: min(360px, 92vw); }\n.panelHead { display: flex; justify-content: space-between; align-items: center; padding: .8rem 1rem; border-bottom: 1px solid #efebe1; }\n.panelHead button { border: 0; background: none; color: #1f4d43; font: inherit; font-size: .8rem; cursor: pointer; }\n.list { max-height: 380px; overflow-y: auto; }\n.item { display: grid; gap: .2rem; width: 100%; padding: .75rem 1rem; border: 0; border-bottom: 1px solid #f1eee5; background: #fff; font: inherit; text-align: start; cursor: pointer; }\n.item:hover { background: #faf8f3; }\n.item span { font-size: .85rem; color: #4b5a56; }\n.item small { color: #8a9692; font-size: .75rem; }\n.unread { background: #f1f7f4; border-inline-start: 3px solid #1f4d43; }\n.empty { padding: 2rem 1rem; text-align: center; color: #6b7a76; margin: 0; }\n\n@media (max-width: 640px) {\n  .uname { display: none; }\n  .panel { position: fixed; top: 64px; left: 8px; right: 8px; width: auto; }\n  .menu { width: auto; }\n}\n","AccountTypeGate.js":"\"use client\";\nimport { useEffect, useState } from \"react\";\nimport { createPortal } from \"react-dom\";\nimport { useRouter } from \"next/navigation\";\nimport { Building2, Home, Search } from \"lucide-react\";\nimport { supabase } from \"@/lib/supabase\";\nimport { useAuth } from \"@/lib/AuthContext\";\nimport styles from \"./AccountTypeGate.module.css\";\n\nconst OPTIONS = [\n  { key: \"broker\", icon: Building2, title: \"مكتب عقاري / سمسار\", sub: \"أول 3 إعلانات مجاناً\" },\n  { key: \"owner\", icon: Home, title: \"مالك (بائع / مؤجر)\", sub: \"إعلانات مجانية بلا حد\" },\n  { key: \"seeker\", icon: Search, title: \"أبحث عن عقار (شراء / إيجار)\", sub: \"تصفّح العقارات واحفظ ما يعجبك\" },\n];\n\n/* نافذة تظهر مباشرة بعد التسجيل ولا تُغلق إلا باختيار نوع الحساب — لا يمكن تغييره لاحقاً */\nexport default function AccountTypeGate() {\n  const { user } = useAuth();\n  const router = useRouter();\n  const [show, setShow] = useState(false);\n  const [pick, setPick] = useState(null);\n  const [office, setOffice] = useState(\"\");\n  const [busy, setBusy] = useState(false);\n  const [err, setErr] = useState(\"\");\n\n  useEffect(() => {\n    if (!user) { setShow(false); return; }\n    let off = false;\n    supabase.rpc(\"get_my_profile\").then(({ data }) => { if (!off && data && data.account_type_set === false) setShow(true); });\n    return () => { off = true; };\n  }, [user]);\n\n  useEffect(() => {\n    if (!show) return;\n    const prev = document.body.style.overflow;\n    document.body.style.overflow = \"hidden\";\n    return () => { document.body.style.overflow = prev; };\n  }, [show]);\n\n  if (!show || typeof document === \"undefined\") return null;\n\n  const confirm = async () => {\n    if (!pick) return;\n    setBusy(true); setErr(\"\");\n    const { error } = await supabase.rpc(\"set_my_account_type\", { p_type: pick, p_office: pick === \"broker\" ? office : null });\n    setBusy(false);\n    if (error) { setErr(error.message === \"account_type_locked\" ? \"تم تحديد نوع حسابك من قبل\" : \"حدث خطأ، حاول مرة أخرى\"); if (error.message === \"account_type_locked\") setShow(false); return; }\n    setShow(false);\n    window.dispatchEvent(new Event(\"profile-updated\"));\n    router.refresh();\n    if (pick !== \"seeker\") router.push(\"/dashboard\");\n  };\n\n  return createPortal(\n    <div className={styles.bg} role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"atg-title\" dir=\"rtl\">\n      <div className={styles.box}>\n        <h2 id=\"atg-title\">أهلاً بك! من أنت؟</h2>\n        <p className={styles.lead}>اختر نوع حسابك لنهيّئ لك التجربة المناسبة.</p>\n\n        <div className={styles.list}>\n          {OPTIONS.map((o) => (\n            <button key={o.key} type=\"button\" className={`${styles.opt} ${pick === o.key ? styles.on : \"\"}`} onClick={() => setPick(o.key)} aria-pressed={pick === o.key}>\n              <span className={styles.ico}><o.icon size={22} /></span>\n              <span className={styles.txt}><strong>{o.title}</strong><small>{o.sub}</small></span>\n            </button>\n          ))}\n        </div>\n\n        {pick === \"broker\" && (\n          <input className={styles.in} value={office} onChange={(e) => setOffice(e.target.value)} maxLength={80} placeholder=\"اسم المكتب (اختياري)\" />\n        )}\n\n        <p className={styles.warn}>⚠️ لا يمكن تغيير نوع الحساب بعد التأكيد.</p>\n        {err && <p className={styles.err}>{err}</p>}\n        <button type=\"button\" className={styles.go} disabled={!pick || busy} onClick={confirm}>{busy ? \"جارٍ الحفظ...\" : \"تأكيد ومتابعة\"}</button>\n      </div>\n    </div>,\n    document.body\n  );\n}\n","AccountTypeGate.module.css":".bg { position: fixed; inset: 0; z-index: 1000; background: rgba(20, 14, 8, .62); display: grid; place-items: center; padding: 1rem; overflow-y: auto; }\n.box { width: min(520px, 100%); background: #fff; border-radius: 20px; padding: 1.6rem 1.4rem 1.4rem; box-shadow: 0 24px 60px rgba(0,0,0,.35); animation: up .2s ease-out; }\n@keyframes up { from { opacity: 0; transform: translateY(10px); } }\n.box h2 { margin: 0 0 .3rem; font-size: 1.4rem; }\n.lead { margin: 0 0 1.1rem; color: #6b7a76; font-size: .95rem; }\n.list { display: grid; gap: .7rem; }\n.opt { display: flex; align-items: center; gap: .9rem; width: 100%; padding: .9rem 1rem; border: 1.5px solid #e4e0d6; border-radius: 14px; background: #fff; font: inherit; text-align: start; cursor: pointer; transition: border-color .15s, background .15s; }\n.opt:hover { border-color: #c9a074; }\n.on { border-color: #b8731f; background: #fbebd5; }\n.ico { flex: none; width: 46px; height: 46px; border-radius: 12px; background: #f6ede0; color: #b8731f; display: grid; place-items: center; }\n.txt { display: grid; gap: .15rem; }\n.txt small { color: #6b7a76; font-size: .82rem; }\n.in { width: 100%; margin-top: .8rem; padding: .7rem .9rem; border: 1px solid #e4e0d6; border-radius: 10px; font: inherit; }\n.warn { margin: 1rem 0 .2rem; color: #8a5a00; font-size: .85rem; }\n.err { margin: .2rem 0; color: #c2410c; font-size: .85rem; }\n.go { width: 100%; margin-top: .6rem; padding: .8rem 1rem; border: 0; border-radius: 12px; background: #b8731f; color: #fff; font: inherit; font-weight: 700; cursor: pointer; }\n.go:disabled { opacity: .5; cursor: not-allowed; }\n"};
const root = process.cwd();
const src = fs.existsSync(path.join(root, "src/app")) || fs.existsSync(path.join(root, "src/components")) ? path.join(root, "src") : root;

// 1) نسخ ملفات المكوّن
const compDir = path.join(src, "components");
fs.mkdirSync(compDir, { recursive: true });
for (const [name, content] of Object.entries(FILES)) {
  const f = path.join(compDir, name);
  if (fs.existsSync(f)) fs.copyFileSync(f, f + ".bak");
  fs.writeFileSync(f, content);
  console.log("✅", path.relative(root, f));
}


// 1b) البحث عن واجهة تغيير نوع الحساب القديمة (يجب إزالتها)
const picker = [];
(function walk(d, depth) {
  if (depth > 6) return;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git", "public"].includes(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, depth + 1);
    else if (/\.(js|jsx|tsx)$/.test(e.name) && !/AccountTypeGate|HeaderActions/.test(e.name)) {
      const lines = fs.readFileSync(p, "utf8").split("\n");
      const hits = lines.map((l, i) => (/مالك مباشر|مكتب \/ سمسار|account_type/.test(l) ? i + 1 : 0)).filter(Boolean);
      if (hits.length) picker.push(path.relative(root, p) + "  (أسطر: " + hits.slice(0, 8).join(", ") + ")");
    }
  }
})(src, 0);
if (picker.length) {
  console.log("\n🔒 ملفات فيها اختيار/تغيير نوع الحساب القديم — احذف منها واجهة التغيير (القاعدة ترفض أي تغيير الآن على كل حال):");
  picker.forEach((p) => console.log("   •", p));
}

// 2) إيجاد ملف الهيدر
const arg = process.argv[2];
let header = arg ? path.resolve(root, arg) : null;
if (!header) {
  const found = [];
  (function walk(d, depth) {
    if (depth > 5) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (["node_modules", ".next", ".git", "public"].includes(e.name)) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p, depth + 1);
      else if (/\.(js|jsx|tsx)$/.test(e.name) && !/HeaderActions/.test(e.name)) {
        const t = fs.readFileSync(p, "utf8");
        if (t.includes("أضف إعلانك") || t.includes("المحفوظة")) found.push(p);
      }
    }
  })(src, 0);
  found.sort((a, b) => (/header|navbar|nav/i.test(path.basename(b)) ? 1 : 0) - (/header|navbar|nav/i.test(path.basename(a)) ? 1 : 0));
  header = found[0];
  if (found.length > 1) console.log("ℹ️ ملفات مرشّحة:", found.map((f) => path.relative(root, f)).join(" , "));
}
if (!header || !fs.existsSync(header)) {
  console.log('\n⚠️ لم أجد ملف الهيدر. شغّل:  node install-header.js components/Header.js');
  console.log('   أو ضع يدوياً:  import HeaderActions from "@/components/HeaderActions";  ثم  <HeaderActions />');
  process.exit(0);
}
let code = fs.readFileSync(header, "utf8");
console.log("📄 الهيدر:", path.relative(root, header));
if (code.includes("HeaderActions")) { console.log("ℹ️ الهيدر يستخدم HeaderActions بالفعل، لا تغيير."); process.exit(0); }

// 3) أدوات تحليل JSX بسيطة
function openEnd(s, i) { // i عند "<" ؛ يعيد موضع ">" الأخير للوسم المفتوح
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
function elementEnd(s, i) { // يعيد موضع نهاية العنصر كاملاً (بعد ">" الأخيرة)
  const m = /^<([A-Za-z][\w.]*)/.exec(s.slice(i));
  if (!m) return null;
  const tag = m[1], first = openEnd(s, i);
  if (!first) return null;
  if (first.self) return first.end + 1;
  const re = new RegExp("<" + tag.replace(".", "\\.") + "(?=[\\s>/])|</" + tag.replace(".", "\\.") + "\\s*>", "g");
  re.lastIndex = first.end + 1;
  let depth = 1, mm;
  while ((mm = re.exec(s))) {
    if (mm[0].startsWith("</")) { depth--; if (depth === 0) return mm.index + mm[0].length; }
    else { const o = openEnd(s, mm.index); if (o && !o.self) depth++; re.lastIndex = o ? o.end + 1 : re.lastIndex; }
  }
  return null;
}

// 4) إيجاد عنصر الحساب القديم (دائرة/صورة/رابط البروفايل)
const cand = [];
const reOpen = /<(Link|a|button|div|Image|img|span)\b/g;
let m;
while ((m = reOpen.exec(code))) {
  const o = openEnd(code, m.index);
  if (!o) continue;
  const head = code.slice(m.index, o.end + 1);
  if (!/(avatar|profile|account|userMenu|user-menu|userBtn|userbox)/i.test(head)) continue;
  const end = elementEnd(code, m.index);
  if (!end) continue;
  const whole = code.slice(m.index, end);
  if (whole.includes("أضف إعلانك") || whole.length > 2500) continue;
  if (cand.some((c) => m.index >= c.start && m.index < c.end)) continue;
  cand.push({ start: m.index, end, text: whole });
}

let patched = false;
if (cand.length >= 1) {
  const c = cand[0];
  console.log("🔁 استبدلت عنصر الحساب القديم:\n   " + c.text.replace(/\s+/g, " ").slice(0, 160) + (c.text.length > 160 ? "…" : ""));
  code = code.slice(0, c.start) + "<HeaderActions />" + code.slice(c.end);
  patched = true;
  if (cand.length > 1) console.log("⚠️ وجدت " + (cand.length - 1) + " عنصراً مشابهاً آخر (ربما قائمة الموبايل) لم ألمسه — راجعه يدوياً.");
} else {
  const idx = code.indexOf("أضف إعلانك");
  if (idx > -1) {
    let st = -1;
    for (let k = idx; k >= 0; k--) { if (code[k] === "<" && /[A-Za-z]/.test(code[k + 1] || "")) { const e = elementEnd(code, k); if (e && e > idx) { st = k; break; } } }
    if (st > -1) { code = code.slice(0, st) + "<HeaderActions />\n" + code.slice(st); patched = true; console.log('➕ لم أجد عنصر الحساب القديم، فوضعت <HeaderActions /> قبل زر "أضف إعلانك". احذف يدوياً أي دائرة حساب قديمة بجانبه.'); }
  }
}
if (!patched) { console.log('\n⚠️ لم أستطع تحديد مكان آمن. أضف يدوياً في الهيدر:  <HeaderActions />'); }

// 5) الاستيراد
const imp = 'import HeaderActions from "@/components/HeaderActions";\n';
const imports = [...code.matchAll(/^import[\s\S]*?;\s*$/gm)];
if (imports.length) { const last = imports[imports.length - 1]; const at = last.index + last[0].length; code = code.slice(0, at) + "\n" + imp.trimEnd() + code.slice(at); }
else code = (/^["']use client["'];?\s*\n/.test(code) ? code.replace(/^(["']use client["'];?\s*\n)/, "$1" + imp) : imp + code);

fs.copyFileSync(header, header + ".bak");
fs.writeFileSync(header, code);
console.log("💾 تم الحفظ (والنسخة الاحتياطية: " + path.basename(header) + ".bak)");
console.log("\n🎉 تم. شغّل npm run dev وأعد تحميل الصفحة. إن ظهر خطأ، استرجع النسخة: mv " + path.relative(root, header) + ".bak " + path.relative(root, header));
