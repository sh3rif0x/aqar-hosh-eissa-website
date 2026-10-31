import { section, bars, table, col } from "../dsl";
export default section("health", "صحة النظام", 8, [
  bars("errors_by_path", "الأخطاء حسب الصفحة", "mon_errors_by_path"),
  bars("slow_pages", "بطء الصفحات (ms)", "mon_slow_pages"),
  table("errors_recent", "آخر الأخطاء", "mon_errors_recent",
    [col("path", "الصفحة"), col("message", "الخطأ"), col("who", "المستخدم"), col("created_at", "الوقت", "date")]),
  bars("db_tables", "حجم الجداول (KB)", "mon_db_tables", { noDays: true }),
  bars("storage_files", "حجم الملفات والصور (KB)", "mon_storage_files", { noDays: true }),
]);
