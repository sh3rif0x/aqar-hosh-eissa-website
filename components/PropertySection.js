import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PropertyCard from "./PropertyCard";

export default function PropertySection({ eyebrow, title, items, href = "/browse", alt = false }) {
  return (
    <section className={`section ${alt ? "alt" : ""}`}>
      <div className="container">
        <header className="sec-head">
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h2>{title}</h2>
          </div>
          <Link href={href} className="more">عرض الكل <ArrowLeft size={14} /></Link>
        </header>
        <div className="grid">
          {items.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
      </div>
    </section>
  );
}
