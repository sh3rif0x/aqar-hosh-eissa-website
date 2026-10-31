import { section, stat, bars } from "../dsl";
export default section("visitors", "الزوار", 2, [
  stat("totals", "ملخص الزوار", "mon_visitor_totals", { overview: true }),
  bars("daily", "الزيارات اليومية", "mon_visits_daily", { overview: true }),
  bars("top_pages", "الصفحات الأكثر زيارة", "mon_top_pages"),
  bars("sources", "مصدر الزيارة", "mon_sources"),
  bars("devices", "الأجهزة", "mon_devices"),
  bars("browsers", "المتصفحات", "mon_browsers"),
  bars("os", "أنظمة التشغيل", "mon_os"),
  bars("countries", "الدول", "mon_countries"),
  bars("cities", "المدن", "mon_cities"),
]);
