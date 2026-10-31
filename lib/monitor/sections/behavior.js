import { section, stat, bars, table, col } from "../dsl";
export default section("behavior", "البحث والسلوك", 5, [
  stat("session_stats", "سلوك الجلسات", "mon_session_stats", { overview: true }),
  bars("top_terms", "أكثر كلمات البحث", "mon_top_terms"),
  table("empty_terms", "بحث بلا نتائج", "mon_empty_terms",
    [col("term", "الكلمة"), col("searches", "المرات", "num"), col("last_at", "آخر مرة", "date")],
    { empty: "لا توجد عمليات بحث بلا نتائج (تأكد أن صفحة البحث ترسل عدد النتائج)." }),
  bars("filters_used", "الفلاتر الأكثر استخداماً", "mon_filters_used"),
  bars("top_regions", "أكثر المناطق طلباً", "mon_top_regions"),
  bars("top_categories", "أكثر التصنيفات طلباً", "mon_top_categories"),
  bars("exit_pages", "صفحات المغادرة", "mon_exit_pages"),
]);
