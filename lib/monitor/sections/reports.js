import { section, stat, table, col } from "../dsl";
export default section("reports", "التقارير والتنبيهات", 9, [
  table("alerts", "تنبيهات تلقائية", "mon_alerts",
    [col("level", "المستوى"), col("alert", "التنبيه"), col("value", "القيمة")],
    { overview: true, empty: "✅ لا توجد تنبيهات حالياً.", exportable: false, refresh: 60 }),
  stat("compare", "مقارنة الفترة الحالية بالسابقة", "mon_compare"),
  table("daily_summary", "ملخص يومي", "mon_daily_summary",
    [col("day", "اليوم", "day"), col("visits", "الزيارات", "num"), col("visitors", "الزوار", "num"),
     col("signups", "التسجيلات", "num"), col("failed_logins", "دخول فاشل", "num")]),
]);
