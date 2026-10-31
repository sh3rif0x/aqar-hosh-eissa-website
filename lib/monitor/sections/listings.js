import { section, bars, table, col } from "../dsl";
export default section("listings", "تتبع الإعلانات", 4, [
  bars("event_types", "التفاعلات حسب النوع", "mon_event_types"),
  table("top_viewed", "الأكثر مشاهدة", "mon_top_viewed",
    [col("title", "الإعلان"), col("views", "مشاهدات", "num"), col("uniq", "فريدة", "num"), col("calls", "اتصال", "num"),
     col("whatsapp", "واتساب", "num"), col("favs", "مفضلة", "num"), col("shares", "مشاركة", "num")]),
  table("top_engaged", "الأكثر تفاعلاً", "mon_top_engaged",
    [col("title", "الإعلان"), col("interactions", "تفاعلات", "num"), col("views", "مشاهدات", "num")]),
  table("conversion", "معدل التحويل (مشاهدة ← تواصل)", "mon_conversion",
    [col("title", "الإعلان"), col("views", "مشاهدات", "num"), col("contacts", "تواصل", "num"), col("rate", "النسبة %", "num")]),
  table("no_views", "إعلانات بلا مشاهدات", "mon_no_views",
    [col("title", "الإعلان"), col("created_at", "تاريخ النشر", "day")]),
]);
