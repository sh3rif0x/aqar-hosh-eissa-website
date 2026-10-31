import Link from "next/link";
import { VODA, WA } from "@/lib/payment";

export const metadata = { title: "ميّز إعلانك | عقار حوش عيسى" };

const card = { background: "#fff", border: "1px solid #e6e0d6", borderRadius: 14, padding: 20, marginBottom: 16, lineHeight: 1.9 };
const th = { textAlign: "right", padding: "8px 10px", borderBottom: "1px solid #eee" };

export default function Featured() {
  const wa = `https://wa.me/${WA}?text=${encodeURIComponent("أريد تمييز إعلان. لينك الإعلان: ")}`;
  return (
    <main dir="rtl" style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
      <h1>⭐ ميّز إعلانك</h1>
      <p>الإعلان المميز بيظهر في أول نتائج البحث وفي صفحة المعلن، فيوصل لعدد أكبر من المشترين.</p>

      <section style={card}>
        <h2>الأسعار</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={th}>الخدمة</th><th style={th}>السعر</th></tr></thead>
          <tbody>
            <tr><td style={th}>تمييز إعلان واحد (للمستخدم العادي)</td><td style={th}>50 جنيه</td></tr>
            <tr><td style={th}>السمسار / المكتب: أول 3 إعلانات</td><td style={th}>مجاناً</td></tr>
            <tr><td style={th}>باقة 10 إعلانات إضافية</td><td style={th}>100 جنيه</td></tr>
            <tr><td style={th}>باقة 30 إعلان إضافي</td><td style={th}>250 جنيه</td></tr>
          </tbody>
        </table>
        <p style={{ fontSize: 14, color: "#666" }}>المستخدم العادي: مجاني بحد أقصى 5 إعلانات في الشهر.</p>
      </section>

      <section style={card}>
        <h2>طريقة الدفع</h2>
        <ol style={{ paddingInlineStart: 20 }}>
          <li>حوّل المبلغ على فودافون كاش على الرقم: <b dir="ltr">{VODA}</b></li>
          <li>صوّر شاشة التحويل (سكرين شوت).</li>
          <li>ابعتها على واتساب مع <b>لينك الإعلان</b> اللي عايز تميّزه، أو اسم حسابك لو بتشترك في باقة.</li>
          <li>هنراجع التحويل ونفعّل التمييز أو الباقة يدوياً.</li>
        </ol>
        <a href={wa} target="_blank" rel="noreferrer"
           style={{ display: "inline-block", background: "#b8731f", color: "#fff", padding: "10px 20px", borderRadius: 10, textDecoration: "none" }}>
          إرسال السكرين شوت على واتساب
        </a>
      </section>

      <p><Link href="/browse?featured=1">شاهد الإعلانات المميزة</Link> • <Link href="/dashboard">العودة إلى إعلاناتي</Link></p>
    </main>
  );
}
