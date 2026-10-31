import { section, stat, table, col } from "../dsl";
export default section("live", "المراقبة اللحظية", 1, [
  stat("online_now", "المتصلون الآن", "mon_online_now", { noDays: true, overview: true, refresh: 15 }),
  table("online_list", "الزوار المتصلون وصفحاتهم", "mon_online_list",
    [col("who", "الزائر"), col("path", "الصفحة"), col("device", "الجهاز"), col("ip", "IP"), col("last_seen", "آخر نشاط", "date")],
    { noDays: true, refresh: 15 }),
]);
