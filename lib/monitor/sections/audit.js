import { section, table, col } from "../dsl";
// يعتمد على الدالة الموجودة أصلاً admin_list_logs
export default section("audit", "سجل الإدارة", 7, [
  table("admin_logs", "كل إجراءات المشرفين", "admin_list_logs",
    [col("created_at", "الوقت", "date"), col("actor_name", "المنفِّذ"), col("action", "الإجراء"),
     col("details", "تفاصيل", "text", { get: (r) => (r.details ? JSON.stringify(r.details) : "") })],
    { noDays: true, args: { p_limit: 200, p_offset: 0 }, pick: (d) => d?.items || [] }),
]);
