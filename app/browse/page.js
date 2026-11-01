"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SlidersHorizontal, X, Search } from "lucide-react";
import { listings, lookups } from "@/lib/api";
import { normalize, items as toItems } from "@/lib/normalize";
import PropertyCard from "@/components/PropertyCard";
import { supabase } from "@/lib/supabase";

const NUMS = ["any", 1, 2, 3, 4, 5];
const FINISH = [["unfinished", "بدون تشطيب"], ["semi_finished", "نصف تشطيب"], ["fully_finished", "تشطيب كامل"], ["super_lux", "سوبر لوكس"]];
const UNITS = [["sqm", "متر مربع"], ["feddan", "فدان"], ["qirat", "قيراط"], ["sahm", "سهم"]];
const PAGE = 18;

function Browse() {
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const [lk, setLk] = useState({ categories: [], regions: [] });
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [draft, setDraft] = useState({});
  const [gk, setGk] = useState({});

  const g = (k) => sp.get(k) || "";
  const grp = g("group");
  const setParam = (k, v) => {
    const p = new URLSearchParams(sp.toString());
    if (v === "" || v == null || v === "any") p.delete(k); else p.set(k, v);
    setPage(0);
    router.push(`${path}?${p.toString()}`, { scroll: false });
  };
  const setMany = (obj) => {
    const p = new URLSearchParams(sp.toString());
    Object.entries(obj).forEach(([k, v]) => (v === "" || v == null ? p.delete(k) : p.set(k, v)));
    setPage(0);
    router.push(`${path}?${p.toString()}`, { scroll: false });
  };
  const clear = () => { setPage(0); router.push(path); };

  useEffect(() => { lookups.all().then(setLk).catch(() => {}); }, []);
  useEffect(() => {
    supabase.from("categories").select("id,group_kind").then(({ data }) => {
      const m = {}; (data || []).forEach((c) => { m[c.id] = c.group_kind; }); setGk(m);
    });
  }, []);
  useEffect(() => {
    setDraft({ min: g("min"), max: g("max"), amin: g("amin"), amax: g("amax"), search: g("search") });
  }, [sp]);

  useEffect(() => {
    setData(null); setError("");
    const num = (k) => (g(k) ? Number(g(k)) : null);
    listings.list({
      category_id: num("cat"), region_id: num("region"), deal_type: g("deal") || null,
      min_price: num("min"), max_price: num("max"), search: g("search") || null,
      min_area: num("amin"), max_area: num("amax"), area_unit: g("unit") || null,
      min_rooms: num("rooms"), min_baths: num("baths"), finishing: g("finish") || null,
      advertiser_type: g("by") || null, featured_only: ["1", "true"].includes(g("featured")),
      sort: g("sort") || "newest", limit: grp && !g("cat") ? 200 : PAGE, offset: grp && !g("cat") ? 0 : page * PAGE,
    }).then(setData).catch((e) => setError(e.message));
  }, [sp, page]);

  const clientGroup = !!grp && !g("cat");
  const inGroup = (r) => {
    const kind = gk[r.category_id ?? r.category?.id ?? r.categoryId];
    return grp === "commercial" ? kind === "commercial" : kind !== "commercial";
  };
  const rawAll = data && !(clientGroup && !Object.keys(gk).length) ? toItems(data) : null;
  const filtered = rawAll && clientGroup ? rawAll.filter(inGroup) : rawAll;
  const total = clientGroup ? (filtered?.length ?? 0) : (data?.total ?? 0);
  const list = filtered ? (clientGroup ? filtered.slice(page * PAGE, (page + 1) * PAGE) : filtered).map(normalize) : null;
  const active = ["group", "cat", "region", "deal", "min", "max", "search", "amin", "amax", "unit", "rooms", "baths", "finish", "by", "featured"].filter((k) => g(k)).length;
  const showResidential = grp !== "commercial" && (!g("cat") || ["1", "2"].includes(g("cat")));

  const Chips = ({ k, options, all = "الكل" }) => (
    <div className="chips">
      <button className={!g(k) ? "on" : ""} onClick={() => setParam(k, "")}>{all}</button>
      {options.map(([v, l]) => <button key={v} className={g(k) === String(v) ? "on" : ""} onClick={() => setParam(k, v)}>{l}</button>)}
    </div>
  );
  const Num = ({ k }) => (
    <div className="chips">
      {NUMS.map((n) => <button key={n} className={(g(k) || "any") === String(n) ? "on" : ""} onClick={() => setParam(k, n)}>{n === "any" ? "أي" : n === 5 ? "5+" : n}</button>)}
    </div>
  );
  const applyRange = (a, b, ka, kb) => setMany({ [ka]: draft[ka], [kb]: draft[kb] });

  const sidebar = (
    <aside className={`filters-side ${open ? "open" : ""}`}>
      <div className="fs-head">
        <h3><SlidersHorizontal size={16} /> الفلاتر {active > 0 && <b>{active}</b>}</h3>
        <div>
          {active > 0 && <button className="clear" onClick={clear}>مسح الكل</button>}
          <button className="close-fs" onClick={() => setOpen(false)}><X size={18} /></button>
        </div>
      </div>

      <div className="fg"><label>بحث</label>
        <form className="fsearch" onSubmit={(e) => { e.preventDefault(); setParam("search", draft.search); }}>
          <input placeholder="ابحث في العنوان..." value={draft.search || ""} onChange={(e) => setDraft({ ...draft, search: e.target.value })} />
          <button aria-label="بحث"><Search size={15} /></button>
        </form>
      </div>

      <div className="fg"><label>القسم</label>
        <div className="chips">
          {[["", "الكل"], ["residential", "سكني"], ["commercial", "تجاري"]].map(([v, l]) => (
            <button key={v} className={grp === v ? "on" : ""} onClick={() => setMany({ group: v, cat: "" })}>{l}</button>
          ))}
        </div>
      </div>

      <div className="fg"><label>نوع الإعلان</label>
        <Chips k="deal" options={[["sale", "للبيع"], ["rent", "للإيجار"]]} />
      </div>

      <div className="fg"><label>المنطقة</label>
        <select value={g("region")} onChange={(e) => setParam("region", e.target.value)}>
          <option value="">كل المناطق</option>
          {lk.regions.map((r) => <option key={r.id} value={r.id}>{r.name_ar}</option>)}
        </select>
      </div>

      <div className="fg"><label>نوع العقار</label>
        <div className="chips">
          <button className={!g("cat") ? "on" : ""} onClick={() => setParam("cat", "")}>الكل</button>
          {lk.categories.filter((c) => !grp || (grp === "commercial" ? gk[c.id] === "commercial" : gk[c.id] !== "commercial")).map((c) => <button key={c.id} className={g("cat") === String(c.id) ? "on" : ""} onClick={() => setParam("cat", c.id)}>{c.name_ar}</button>)}
        </div>
      </div>

      <div className="fg"><label>السعر (ج.م)</label>
        <div className="range">
          <input type="number" placeholder="من" value={draft.min || ""} onChange={(e) => setDraft({ ...draft, min: e.target.value })} onBlur={() => applyRange(0, 0, "min", "max")} />
          <input type="number" placeholder="إلى" value={draft.max || ""} onChange={(e) => setDraft({ ...draft, max: e.target.value })} onBlur={() => applyRange(0, 0, "min", "max")} />
        </div>
      </div>

      <div className="fg"><label>المساحة</label>
        <div className="range">
          <input type="number" placeholder="من" value={draft.amin || ""} onChange={(e) => setDraft({ ...draft, amin: e.target.value })} onBlur={() => applyRange(0, 0, "amin", "amax")} />
          <input type="number" placeholder="إلى" value={draft.amax || ""} onChange={(e) => setDraft({ ...draft, amax: e.target.value })} onBlur={() => applyRange(0, 0, "amin", "amax")} />
        </div>
        <Chips k="unit" options={UNITS} all="أي وحدة" />
      </div>

      {showResidential && (<>
        <div className="fg"><label>غرف النوم (على الأقل)</label><Num k="rooms" /></div>
        <div className="fg"><label>الحمامات (على الأقل)</label><Num k="baths" /></div>
        <div className="fg"><label>التشطيب</label><Chips k="finish" options={FINISH} /></div>
      </>)}

      <div className="fg"><label>المعلن</label>
        <Chips k="by" options={[["owner", "🟢 مالك مباشر"], ["broker", "🔵 مكتب عقاري"]]} />
      </div>

      <div className="fg"><label>عقارات مميزة</label>
        <Chips k="featured" options={[["1", "المميزة فقط"]]} all="الكل" />
      </div>
    </aside>
  );

  const kindWord = grp === "commercial" ? "تجارية" : grp === "residential" ? "سكنية" : "";
  const dealWord = g("deal") === "rent" ? "للإيجار" : g("deal") === "sale" ? "للبيع" : "";
  const title = !kindWord && !dealWord ? "جميع العقارات" : `عقارات ${kindWord} ${dealWord}`.replace(/\s+/g, " ").trim();

  return (
    <section className="section" style={{ minHeight: "70vh" }}>
      <div className="container browse-grid">
        <div>
          <header className="sec-head">
            <div>
              <h2>{title}</h2>
              {data && <p className="count-line">{total} نتيجة</p>}
            </div>
            <div className="head-tools">
              <button className="btn btn-outline only-m" onClick={() => setOpen(true)}><SlidersHorizontal size={15} /> الفلاتر {active > 0 && `(${active})`}</button>
              <select className="sortsel" value={g("sort") || "newest"} onChange={(e) => setParam("sort", e.target.value)}>
                <option value="newest">الأحدث</option>
                <option value="price_asc">الأقل سعراً</option>
                <option value="price_desc">الأعلى سعراً</option>
              </select>
            </div>
          </header>

          {error && <p className="err">{error}</p>}
          {!list && !error && <div className="grid g2">{[0, 1, 2, 3].map((i) => <div key={i} className="card skel" />)}</div>}
          {list?.length === 0 && <p className="empty">لا توجد نتائج مطابقة. <button className="linkbtn" onClick={clear}>مسح الفلاتر</button></p>}
          {list?.length > 0 && <div className="grid g2">{list.map((p) => <PropertyCard key={p.id} property={p} />)}</div>}

          {total > PAGE && (
            <div className="pager">
              <button disabled={page === 0} onClick={() => setPage(page - 1)}>السابق</button>
              <span>{page + 1} / {Math.ceil(total / PAGE)}</span>
              <button disabled={(page + 1) * PAGE >= total} onClick={() => setPage(page + 1)}>التالي</button>
            </div>
          )}
        </div>
        {sidebar}
      </div>
      {open && <div className="fs-overlay" onClick={() => setOpen(false)} />}
    </section>
  );
}
export default function Page() { return <Suspense><Browse /></Suspense>; }
