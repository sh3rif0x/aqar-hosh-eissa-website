import Link from "next/link";
import { Home, Building2, Building, Mountain, Store, ArrowLeft } from "lucide-react";
import { CATEGORIES } from "@/lib/data";

const ICONS = { home: Home, building: Building2, town: Building, land: Mountain, store: Store };

export default function CategoryBar() {
  return (
    <nav className="cats">
      <div className="container cats-inner">
        <ul className="cats-list">
          {CATEGORIES.map(({ key, label, icon }) => {
            const Icon = ICONS[icon];
            return (
              <li key={key}>
                <Link href={`/browse?type=${key}`}><Icon size={16} /> {label}</Link>
              </li>
            );
          })}
        </ul>
        <Link href="/browse" className="all">عرض الكل <ArrowLeft size={14} /></Link>
      </div>
    </nav>
  );
}
