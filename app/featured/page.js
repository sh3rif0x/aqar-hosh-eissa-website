import Link from "next/link";

export const metadata = { title: "ميّز إعلانك | عقار حوش عيسى" };

const card = { background: "#fff", border: "1px solid #e6e0d6", borderRadius: 14, padding: 20, marginBottom: 16, lineHeight: 1.9 };
const th = { textAlign: "right", padding: "8px 10px", borderBottom: "1px solid #eee" };

export default function Featured() {
  return (
    <main dir="rtl" style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
      <h1>⭐ ميّز إعلانك</h1>
      <p>الإعلان المميز يظهر في أول نتائج البحث بشارة «مميز»، فيوصل لعدد أكبر من المشترين. متاح لكل المستخدمين والسماسر.</p>

      <section style={card}>
        <h2>أسعار التمييز (لكل إعلان)</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={th}>المدة</th><th style={th}>السعر</th></tr></thead>
          <tbody>
            <tr><td style={th}>أسبوع</td><td style={th}>150 جنيه</td></tr>
            <tr><td style={th}>14 يوم</td><td style={th}>210 جنيه</td></tr>
            <tr><td style={th}>شهر</td><td style={th}>380 جنيه</td></tr>
          </tbody>
        </table>
      </section>

      <section style={card}>
        <h2>إزاي تميّز إعلانك؟</h2>
        <ol style={{ paddingInlineStart: 20 }}>
          <li>افتح إعلانك واضغط <b>«ميّز إعلانك الآن»</b> (أو من صفحة إعلاناتي ⭐).</li>
          <li>اختر المدة: أسبوع / 14 يوم / شهر.</li>
          <li>حوّل المبلغ عبر <b>إنستا باي</b> على الرقم الذي يظهر لك.</li>
          <li>ابعت صورة التحويل على واتساب، وهنفعّل التمييز بعد التأكيد وييجيلك إشعار.</li>
        </ol>
        <Link href="/my-listings" style={{ display: "inline-block", background: "#b8731f", color: "#fff", padding: "10px 20px", borderRadius: 10, textDecoration: "none" }}>
          اذهب إلى إعلاناتي
        </Link>
      </section>

      <section style={card}>
        <h2>باقات الحصة للسماسر والمكاتب العقارية</h2>
        <p>أول 3 إعلانات مجانًا، ثم 10 إعلانات بـ 100 جنيه أو 30 إعلان بـ 250 جنيه (اشتراك شهري). التفاصيل في صفحة <Link href="/pricing">باقات الإعلانات</Link> بعد تسجيل الدخول.</p>
      </section>

      <p><Link href="/browse?featured=1">شاهد الإعلانات المميزة</Link> • <Link href="/my-listings">العودة إلى إعلاناتي</Link></p>
    </main>
  );
}
