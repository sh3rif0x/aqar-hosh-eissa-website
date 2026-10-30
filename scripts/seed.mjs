import { createClient } from "@supabase/supabase-js";
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const EMAIL = process.env.SEED_EMAIL || "seed@example.com";
const PASS = process.env.SEED_PASS || "Seed12345!";

let { data: au, error: e1 } = await s.auth.signInWithPassword({ email: EMAIL, password: PASS });
if (e1) {
  const r = await s.auth.signUp({ email: EMAIL, password: PASS, options: { data: { full_name: "مستخدم تجريبي" } } });
  if (r.error) { console.error("auth:", r.error.message); process.exit(1); }
  au = r.data;
  if (!au.session) { console.error("فعّل دخول بدون تأكيد إيميل في Supabase > Auth > Providers > Email (Confirm email = off) ثم أعد التشغيل"); process.exit(1); }
}

const { data: lk, error: le } = await s.rpc("get_lookups");
if (le) { console.error("lookups:", le); process.exit(1); }
console.log("LOOKUPS:", JSON.stringify(lk).slice(0, 800));

const pick = (o, ...keys) => { for (const k of keys) if (Array.isArray(o?.[k]) && o[k].length) return o[k]; return []; };
const cats = pick(lk, "categories", "category", "property_types");
const regs = pick(lk, "regions", "region", "areas", "cities");
const deals = pick(lk, "deal_types", "deals");

const LOREM = "لوريم إيبسوم دولار سيت أميت، كونسيكتيتور أديبيسينغ إليت. سيد دو إيوسمود تيمبور إنسيديدونت أوت لابوري.";
const IMGS = [
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
];

let ok = 0;
for (let i = 0; i < 12; i++) {
  const cat = cats[i % Math.max(cats.length, 1)];
  const reg = regs[i % Math.max(regs.length, 1)];
  const deal = deals.length ? deals[i % deals.length] : null;
  const payload = {
    title: `عقار تجريبي رقم ${i + 1} - لوريم إيبسوم`,
    description: LOREM,
    price: 500000 + i * 150000,
    deal_type: deal ? (deal.id ?? deal.value ?? deal.key ?? deal) : (i % 3 === 0 ? "rent" : "sale"),
    category_id: cat?.id ?? null,
    region_id: reg?.id ?? null,
    area: 80 + i * 25,
    area_unit: "m2",
    bedrooms: (i % 4) + 1,
    bathrooms: (i % 3) + 1,
    phone: "01000000000",
    whatsapp: "01000000000",
    address: "حوش عيسى - البحيرة",
    images: [IMGS[i % 4], IMGS[(i + 1) % 4]],
  };
  const { data, error } = await s.rpc("create_listing", { p_data: payload });
  if (error) { console.error(`#${i + 1} FAIL:`, error.message, error.hint || "", error.details || ""); if (i === 0) break; }
  else {
    ok++;
    const id = data?.id ?? data;
    if (typeof id === "string" || typeof id === "number") await s.rpc("set_listing_images", { p_listing_id: id, p_images: payload.images });
  }
}
console.log(`تم إنشاء ${ok} إعلان. لو الحالة pending، وافق عليها من لوحة الأدمن (admin_review_listing) أو من SQL.`);
await s.auth.signOut();
