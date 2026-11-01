#!/usr/bin/env bash
# bash patch-v4.sh   (من مجلد المشروع، بعد install-v4.sh)
set -e
[ -d .bak-v4 ] && { echo "اتشغّل قبل كده (امسح .bak-v4 لو عايز تعيده بعد ما ترجّع الملفات)"; exit 0; }
[ -f components/FeatureModal.js ] || { echo "شغّل install-v4.sh الأول"; exit 1; }
mkdir -p .bak-v4
for f in "app/listing/[id]/page.js" app/my-listings/page.js components/HeaderActions.js app/featured/page.js lib/payment.js; do
  mkdir -p ".bak-v4/$(dirname "$f")"; cp "$f" ".bak-v4/$f"
done

# ── أرقام الدفع ──
cat > lib/payment.js <<'EOF'
// رقم إنستا باي / الدعم — يتغير في كل الموقع من هنا
export const VODA = "01550089856";
export const WA = "201550089856"; // صيغة دولية بدون + أو صفر
EOF

# ── زر الدفع للسماسر في القائمة ──
cat > components/PricingLink.js <<'EOF'
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Tag } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

// يظهر للسماسر والمكاتب العقارية فقط
export default function PricingLink({ onClick }) {
  const { user } = useAuth();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!user) return setOk(false);
    supabase.rpc("get_my_quota").then(({ data }) => setOk(data?.account_type === "broker"));
  }, [user]);
  if (!ok) return null;
  return <Link href="/pricing" onClick={onClick} role="menuitem"><Tag size={16} /> باقات الإعلانات</Link>;
}
EOF

# ── صفحة «ميّز إعلانك» (معلومات فقط) ──
cat > app/featured/page.js <<'EOF'
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
EOF

python3 - <<'PY'
import re
def edit(path, steps):
    src = open(path, encoding="utf-8").read()
    if steps[0][2] in src and "FEATURE_PATCHED" in src: print("= متعدّل قبل كده:", path); return
    for label, old, new in steps:
        if old in src:
            src = src.replace(old, new, 1); print("✓", label)
        else: print("! ما لقيتش:", label)
    open(path, "w", encoding="utf-8").write(src)

# صفحة الإعلان
edit("app/listing/[id]/page.js", [
 ("import FeatureButton", 'import { waLink } from "@/components/PropertyCard";', 'import { waLink } from "@/components/PropertyCard";\nimport FeatureButton from "@/components/FeatureButton";'),
 ("زر التمييز", '{isMine && raw.status !== "published" && <p className="warn">',
  '{isMine && raw.status !== "rejected" && <FeatureButton listingId={id} title={p.title} style={{ marginTop: 8 }} />}\n          {isMine && raw.status !== "published" && <p className="warn">'),
])

# إعلاناتي
edit("app/my-listings/page.js", [
 ("import المودال", 'import AccountTypeBadge from "@/components/AccountTypeBadge";', 'import AccountTypeBadge from "@/components/AccountTypeBadge";\nimport FeatureModal from "@/components/FeatureModal";'),
 ("state", '  const [err, setErr] = useState("");', '  const [err, setErr] = useState("");\n  const [feat, setFeat] = useState(null);'),
 ("تسمية الحساب", '🔵 مكتب — استخدمت', '{quota.account_type === "broker" ? "🔵 مكتب/سمسار" : "🟢 حساب عادي"} — استخدمت'),
 ("رابط الباقات", '<small>الدفع الإلكتروني سيُفعّل قريباً.</small>', '{quota.account_type === "broker" && <Link href="/pricing" className="btn">اشترك في باقة</Link>}'),
 ("زر ⭐ لكل إعلان", '            <Link href={`/my-listings/edit/${l.id}`} className="icon-btn" aria-label="تعديل">',
  '            {l.status !== "rejected" && <button onClick={() => setFeat(l)} aria-label="ميّز إعلانك" title="ميّز إعلانك الآن">⭐</button>}\n            <Link href={`/my-listings/edit/${l.id}`} className="icon-btn" aria-label="تعديل">'),
])
p = "app/my-listings/page.js"; s = open(p, encoding="utf-8").read()
m = re.search(r'\n    </div></section>\n  \);\n\}\s*$', s)
if m and "<FeatureModal" not in s:
    s = s[:m.start()] + '\n      <FeatureModal open={!!feat} onClose={() => setFeat(null)} listing={feat} />\n    </div></section>\n  );\n}\n'; print("✓ إضافة المودال")
else: print("! ما لقيتش نهاية الصفحة (المودال)")
open(p, "w", encoding="utf-8").write(s)

# القائمة
p = "components/HeaderActions.js"; s = open(p, encoding="utf-8").read()
if "PricingLink" in s: print("= القائمة متعدّلة قبل كده")
else:
    line = re.search(r'^(\s*)<Link href="/my-listings"[^\n]*</Link>\s*$', s, re.M)
    if line:
        s = s[:line.end()] + f'\n{line.group(1)}<PricingLink onClick={{() => setOpen(false)}} />' + s[line.end():]
        s = re.sub(r'^("use client";?\s*\n)', r'\1import PricingLink from "@/components/PricingLink";\n', s, count=1)
        if "import PricingLink" not in s: s = 'import PricingLink from "@/components/PricingLink";\n' + s
        print("✓ رابط الباقات في القائمة")
    else: print("! ما لقيتش رابط إعلاناتي في HeaderActions")
    open(p, "w", encoding="utf-8").write(s)
PY
echo "✓ تم — النسخ الأصلية في .bak-v4/"
