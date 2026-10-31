import { section, bars, table, col } from "../dsl";
export default section("users", "تتبع المستخدمين", 3, [
  bars("signups_daily", "التسجيلات الجديدة يومياً", "mon_signups_daily"),
  table("recent_logins", "سجل الدخول", "mon_recent_logins",
    [col("email", "الإيميل"), col("ip", "IP"), col("device", "الجهاز"), col("country", "الدولة"), col("success", "نجح", "bool"), col("created_at", "الوقت", "date")]),
  table("last_seen", "آخر ظهور للمستخدمين", "mon_last_seen",
    [col("name", "المستخدم"), col("last_seen", "آخر ظهور", "date"), col("pages", "الصفحات", "num"), col("ips", "عدد الـ IP", "num")]),
  table("shared_ips", "حسابات متعددة على نفس الـ IP", "mon_shared_ips",
    [col("ip", "IP"), col("accounts", "عدد الحسابات", "num"), col("last_seen", "آخر ظهور", "date")]),
]);
