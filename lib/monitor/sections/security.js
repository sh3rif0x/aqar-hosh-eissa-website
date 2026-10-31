import { section, table, form, col } from "../dsl";
export default section("security", "الأمان", 6, [
  table("suspicious_ips", "عناوين IP مشبوهة", "mon_suspicious_ips",
    [col("ip", "IP"), col("reason", "السبب"), col("cnt", "العدد", "num")],
    { actions: [{ label: "حظر 24 ساعة", rpc: "mon_block_ip", danger: true, confirm: "حظر هذا الـ IP لمدة 24 ساعة؟",
        args: (r) => ({ p_ip: r.ip, p_reason: r.reason, p_hours: 24 }) }] }),
  form("block_ip", "حظر IP يدوياً", "mon_block_ip", [
    { name: "p_ip", label: "عنوان IP", required: true },
    { name: "p_reason", label: "السبب" },
    { name: "p_hours", label: "المدة بالساعات (0 = دائم)", type: "number", default: 24 },
  ], { submit: "حظر", success: "تم الحظر", size: "half" }),
  table("blocked_ips", "المحظورون حالياً", "mon_blocked_ips",
    [col("ip", "IP"), col("reason", "السبب"), col("expires_at", "ينتهي", "date"), col("created_at", "منذ", "date")],
    { actions: [{ label: "فك الحظر", rpc: "mon_unblock_ip", confirm: "فك حظر هذا الـ IP؟", args: (r) => ({ p_ip: r.ip }) }] }),
  table("failed_logins", "محاولات الدخول الفاشلة", "mon_failed_logins",
    [col("email", "الإيميل"), col("ip", "IP"), col("device", "الجهاز"), col("country", "الدولة"), col("created_at", "الوقت", "date")]),
  table("new_countries", "دخول من دولة جديدة", "mon_new_countries",
    [col("email", "الإيميل"), col("country", "الدولة"), col("ip", "IP"), col("created_at", "الوقت", "date")]),
  table("duplicate_phones", "أرقام مكررة في عدة حسابات", "mon_duplicate_phones",
    [col("phone", "الرقم"), col("accounts", "الحسابات", "num"), col("listings", "الإعلانات", "num")]),
]);
