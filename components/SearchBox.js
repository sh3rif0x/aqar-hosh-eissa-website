"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowLeft, Search, Home, Key } from "lucide-react";
import { REGIONS, PROPERTY_TYPES } from "@/lib/data";

const COUNT = ["أي", "1", "2", "3", "4", "5+"];

export default function SearchBox() {
  const router = useRouter();
  const [deal, setDeal] = useState("sale");
  const [q, setQ] = useState({ region: "", text: "", type: "", min: "", max: "" });
  const set = (k) => (e) => setQ({ ...q, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    const p = new URLSearchParams({ deal });
    if (q.text) p.set("search", q.text);
    if (q.min) p.set("min", q.min);
    if (q.max) p.set("max", q.max);
    router.push(`/browse?${p.toString()}`);
  };

  return (
    <section className="search">
      <div className="ai">
        <Sparkles size={16} className="sp" />
        <input placeholder="ابحث بالذكاء الاصطناعي — مثال: شقة 3 غرف في حوش عيسى" />
        <button aria-label="بحث ذكي"><ArrowLeft size={16} /></button>
      </div>

      <div className="tabs">
        <button className={`tab ${deal === "sale" ? "on" : ""}`} onClick={() => setDeal("sale")}><Home size={14} /> شراء</button>
        <button className={`tab ${deal === "rent" ? "on" : ""}`} onClick={() => setDeal("rent")}><Key size={14} /> إيجار</button>
      </div>

      <form className="bar" onSubmit={submit}>
        <label className="field"><span>المنطقة</span>
          <select value={q.region} onChange={set("region")}>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select>
        </label>
        <label className="field"><span>الموقع</span>
          <input placeholder="الحي أو الشارع..." value={q.text} onChange={set("text")} />
        </label>
        <label className="field"><span>نوع العقار</span>
          <select value={q.type} onChange={set("type")}>{PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        </label>
        <button type="submit" className="btn submit"><Search size={16} /> بحث</button>
      </form>

      <div className="filters">
        <label><span>غرف النوم</span><select>{COUNT.map((o) => <option key={o}>{o}</option>)}</select></label>
        <label><span>الحمامات</span><select>{COUNT.map((o) => <option key={o}>{o}</option>)}</select></label>
        <label><span>السعر من</span><input type="number" placeholder="الحد الأدنى" value={q.min} onChange={set("min")} /></label>
        <label><span>السعر إلى</span><input type="number" placeholder="الحد الأقصى" value={q.max} onChange={set("max")} /></label>
      </div>
    </section>
  );
}
