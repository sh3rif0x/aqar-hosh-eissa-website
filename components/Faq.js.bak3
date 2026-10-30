"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Plus } from "lucide-react";
import { FAQ } from "@/lib/data";

export default function Faq() {
  const [open, setOpen] = useState(null);
  return (
    <>
      <section className="seo">
        <div className="container">
          <h2>انشر عقارك مجاناً</h2>
          <p>
            عقار حوش عيسى هو منصتك لبيع وإيجار الشقق والفلل والمحلات والمباني والأراضي الزراعية وأراضي البناء
            في حوش عيسى والمناطق المحيطة، مع تواصل مباشر بين المالك والمشتري.
          </p>
          <Link href="/dashboard" className="btn"><Plus size={15} /> أضف إعلانك مجاناً</Link>
        </div>
      </section>
      <section className="faq">
        <div className="faq-list">
          <h2>الأسئلة الشائعة</h2>
          {FAQ.map(({ q, a }, i) => (
            <div key={q} className="faq-item">
              <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                {q}
                <ChevronDown size={16} className={open === i ? "rot" : ""} />
              </button>
              {open === i && <p>{a}</p>}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
