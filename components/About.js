import Link from "next/link";
import { APP_NAME } from "@/lib/config";

export default function About() {
  return (
    <section className="about">
      <div className="container about-grid">
        <div>
          <span className="eyebrow">{APP_NAME}</span>
          <h2>أكثر من مجرد إعلان. مكان تنتمي إليه.</h2>
        </div>
        <div className="about-body">
          <p>
            نجمع لك عقارات حوش عيسى والمناطق المحيطة في مكان واحد. سواء كنت تبحث عن شقة لعائلتك،
            أو أرض زراعية، أو محل لمشروعك القادم، نساعدك على الوصول للمالك مباشرة وبدون تعقيد.
          </p>
          <Link href="/browse" className="btn">ابدأ بحثك</Link>
        </div>
      </div>
    </section>
  );
}
