#!/usr/bin/env node
// install-hero.js — يعيد تسمية صور public/hero إلى hero-img1..4 ويثبّت الهيرو الجديد (سلايدر 4 صور + نقاط + أيقونات تنقل)
// الاستخدام من جذر المشروع:  node install-hero.js
const fs = require("fs");
const path = require("path");
const FILES = {"Hero.js":"\"use client\";\nimport { useEffect, useState } from \"react\";\nimport { CheckCircle2 } from \"lucide-react\";\nimport styles from \"./Hero.module.css\";\n\n/* الصور داخل public/hero — غيّر الامتداد هنا لو صورك jpg أو webp */\nconst SLIDES = [1, 2, 3, 4].map((n) => `/hero/hero-img${n}.png`);\n\nconst INTERVAL = 5000;\n\nconst TITLE = \"ابحث عن عقارك في حوش عيسى\";\nconst BADGES = [\"نشر مجاني\", \"تواصل مباشر مع المالك\", \"حوش عيسى والمناطق المحيطة\"];\nconst TEXT = \"شقق وفلل ومحلات ومبانٍ وأراضٍ زراعية وأراضي بناء للبيع والإيجار في حوش عيسى والمناطق المحيطة.\";\n\nexport default function Hero() {\n  const [i, setI] = useState(0);\n  const [paused, setPaused] = useState(false);\n\n  useEffect(() => {\n    SLIDES.forEach((src) => { const img = new Image(); img.src = src; });\n  }, []);\n\n  useEffect(() => {\n    if (paused) return;\n    const t = setInterval(() => setI((c) => (c + 1) % SLIDES.length), INTERVAL);\n    return () => clearInterval(t);\n  }, [paused, i]);\n\n  return (\n    <section className={styles.hero} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} dir=\"rtl\">\n      {SLIDES.map((src, n) => (\n        <div key={src} className={`${styles.slide} ${n === i ? styles.active : \"\"}`} style={{ backgroundImage: `url(${src})` }} aria-hidden=\"true\" />\n      ))}\n      <div className={styles.shade} />\n\n      <div className={styles.content}>\n        <h1 className={styles.title}>{TITLE}</h1>\n        <ul className={styles.badges}>\n          {BADGES.map((b) => <li key={b}><CheckCircle2 size={16} /> {b}</li>)}\n        </ul>\n        <p className={styles.subtitle}>{TEXT}</p>\n      </div>\n\n      <div className={styles.dots} role=\"tablist\" aria-label=\"صور الهيرو\">\n        {SLIDES.map((_, n) => (\n          <button key={n} role=\"tab\" aria-selected={n === i} aria-label={`صورة ${n + 1}`} className={`${styles.dot} ${n === i ? styles.dotOn : \"\"}`} onClick={() => setI(n)} />\n        ))}\n      </div>\n    </section>\n  );\n}\n","Hero.module.css":".hero { margin-bottom: 4.5rem; position: relative; min-height: min(78vh, 680px); display: flex; align-items: flex-end; overflow: hidden; background: #2a1d10; color: #fff; }\n.slide { position: absolute; inset: 0; background-size: cover; background-position: center; opacity: 0; transition: opacity 1.1s ease; transform: scale(1.02); }\n.active { opacity: 1; }\n.shade { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,.72) 0%, rgba(0,0,0,.32) 38%, rgba(0,0,0,0) 70%); pointer-events: none; }\n.content { position: relative; z-index: 2; width: 100%; max-width: 1180px; margin: 0 auto; padding: 0 1.25rem 3.2rem; }\n.title { margin: 0 0 .5rem; font-size: clamp(1.9rem, 4.6vw, 3.4rem); line-height: 1.15; text-shadow: 0 2px 14px rgba(0,0,0,.4); }\n.badges { list-style: none; margin: 0 0 .9rem; padding: 0; display: flex; flex-wrap: wrap; gap: .5rem 1.4rem; font-size: .95rem; text-shadow: 0 1px 8px rgba(0,0,0,.4); }\n.badges li { display: inline-flex; align-items: center; gap: .4rem; }\n.subtitle { margin: 0 0 1.4rem; font-size: clamp(1rem, 1.8vw, 1.25rem); max-width: 720px; line-height: 1.9; opacity: .95; text-shadow: 0 1px 8px rgba(0,0,0,.4); }\n.dots { position: absolute; z-index: 3; bottom: 1.3rem; left: 50%; transform: translateX(-50%); display: flex; gap: .5rem; }\n.dot { width: 9px; height: 9px; padding: 0; border: 0; border-radius: 99px; background: rgba(255,255,255,.55); cursor: pointer; transition: width .25s, background .25s; }\n.dotOn { width: 30px; background: #fff; }\n@media (max-width: 640px) { .hero { min-height: 70vh; } .content { padding-bottom: 3rem; } }\n"};
const root = process.cwd();
const pub = ["public/hero", "src/public/hero"].map((p) => path.join(root, p)).find((p) => fs.existsSync(p));
if (!pub) { console.error("❌ لم أجد public/hero"); process.exit(1); }

// 1) إعادة تسمية الصور (بالترتيب الأبجدي) — تُترك كما هي إن كانت مسمّاة مسبقاً
const imgs = fs.readdirSync(pub).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort();
const done = imgs.filter((f) => /^hero-img[1-4]\.\w+$/i.test(f));
const todo = imgs.filter((f) => !done.includes(f));
if (done.length === 0 && todo.length < 4) console.warn("⚠️ وجدت " + todo.length + " صور فقط، المطلوب 4");
if (done.length === 0) {
  todo.slice(0, 4).forEach((f, i) => { const to = "hero-img" + (i + 1) + path.extname(f).toLowerCase(); fs.renameSync(path.join(pub, f), path.join(pub, "__tmp_" + to)); console.log("   " + f + " ← " + to); });
  fs.readdirSync(pub).filter((f) => f.startsWith("__tmp_")).forEach((f) => fs.renameSync(path.join(pub, f), path.join(pub, f.slice(6))));
} else console.log("ℹ️ الصور مسمّاة مسبقاً، لم أغيّرها");
const ext = [...new Set(fs.readdirSync(pub).filter((f) => /^hero-img[1-4]\./.test(f)).map((f) => path.extname(f)))];

// 2) أماكن الملفات
const comp = ["components", "src/components"].map((p) => path.join(root, p)).find((p) => fs.existsSync(p)) || path.join(root, "components");
let heroJs = null;
(function walk(d, depth) { if (depth > 4 || heroJs) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (["node_modules", ".next", ".git", "public"].includes(e.name)) continue; const p = path.join(d, e.name); if (e.isDirectory()) walk(p, depth + 1); else if (e.name === "Hero.js") { heroJs = p; return; } } })(root, 0);
const dir = heroJs ? path.dirname(heroJs) : comp;
fs.mkdirSync(dir, { recursive: true });
for (const [name, content] of Object.entries(FILES)) {
  const f = path.join(dir, name);
  if (fs.existsSync(f)) { fs.copyFileSync(f, f + ".bak"); console.log("   نسخة احتياطية:", path.relative(root, f) + ".bak"); }
  let c = content;
  if (name === "Hero.js" && ext.length === 1 && ext[0] !== ".png") c = c.replace(".png", ext[0]);
  fs.writeFileSync(f, c); console.log("✅", path.relative(root, f));
}
console.log("\n🎉 تم. افتح الصفحة الرئيسية.");