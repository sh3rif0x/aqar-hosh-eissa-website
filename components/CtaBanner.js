import Link from "next/link";
import { Plus } from "lucide-react";

export default function CtaBanner() {
  return (
    <section className="cta">
      <div className="container">
        <h2>عقارك يستحق الأشخاص المناسبين</h2>
        <p>انشر إعلانك مجاناً ووصل لمشترين ومستأجرين في حوش عيسى والمناطق المحيطة.</p>
        <div className="actions">
          <Link href="/add-listing" className="btn"><Plus size={15} /> أضف إعلانك مجاناً</Link>
          <Link href="/browse" className="btn btn-ghost-light">جميع العقارات</Link>
          <Link href="/browse?group=commercial" className="btn btn-ghost-light">تجاري</Link>
        </div>
      </div>
    </section>
  );
}
