// ترجمة أخطاء السيرفر وسجل النشاط للعربي
export const ERRORS = {
  account_type_locked: "لا يمكن تغيير نوع الحساب بعد تحديده",
  admin_has_listings: "لا يمكن تنفيذ العملية لأن هذا المشرف لديه إعلانات",
  already_reviewed: "تمت مراجعة هذا الطلب من قبل",
  blocked: "حسابك محظور. تواصل معنا عبر واتساب",
  user_blocked: "حسابك محظور. تواصل معنا عبر واتساب",
  broker_quota_exceeded: "وصلت للحد الأقصى من الإعلانات في باقتك. اشترك في باقة أكبر لنشر المزيد",
  quota_exceeded: "وصلت للحد الأقصى من الإعلانات في باقتك. اشترك في باقة أكبر لنشر المزيد",
  owner_monthly_limit: "وصلت للحد الشهري للإعلانات. حاول الشهر القادم",
  brokers_only: "هذه الخدمة للمكاتب والسماسرة فقط",
  cannot_block_admin: "لا يمكن حظر مشرف",
  cannot_block_self: "لا يمكنك حظر نفسك",
  cannot_block_super_admin: "لا يمكن حظر السوبر أدمن",
  cannot_change_own_role: "لا يمكنك تغيير دورك بنفسك",
  cannot_delete_self: "لا يمكنك حذف حسابك من هنا",
  cannot_promote_super_admin: "لا يمكن ترقية مستخدم إلى سوبر أدمن",
  cannot_report_self: "لا يمكنك الإبلاغ عن نفسك",
  date_in_past: "التاريخ لازم يكون في المستقبل",
  details_required: "أكمل تفاصيل العقار المطلوبة",
  duplicate_images: "تم رفع نفس الصورة أكثر من مرة",
  duplicate_name: "هذا الاسم موجود بالفعل",
  expiry_required: "حدد تاريخ انتهاء الباقة",
  forbidden: "ليس لديك صلاحية لتنفيذ هذه العملية",
  invalid_account_type: "نوع الحساب غير صحيح",
  invalid_audience: "الفئة المستهدفة غير صحيحة",
  invalid_category: "نوع العقار غير صحيح",
  invalid_data: "البيانات المدخلة غير صحيحة",
  invalid_value: "البيانات المدخلة غير صحيحة",
  invalid_decision: "القرار غير صحيح",
  invalid_full_name: "الاسم غير صحيح",
  invalid_image_path: "الصورة غير صالحة، ارفعها مرة أخرى",
  invalid_key: "الإعداد المطلوب غير صحيح",
  invalid_parent: "المنطقة الرئيسية غير صحيحة",
  invalid_permission: "الصلاحية غير صحيحة",
  invalid_phone: "رقم الموبايل غير صحيح (مثال: 01012345678)",
  invalid_plan: "الباقة غير صحيحة",
  invalid_quota: "الحصة غير صحيحة",
  invalid_recipients: "المستلمون غير صالحين",
  invalid_region: "المنطقة غير صحيحة",
  invalid_status: "الحالة غير صحيحة",
  invalid_transition: "لا يمكن تنفيذ هذا التغيير",
  last_super_admin: "لا يمكن إزالة آخر سوبر أدمن",
  listing_missing: "الإعلان غير موجود",
  listing_not_found: "الإعلان غير موجود",
  listing_not_found_or_forbidden: "الإعلان غير موجود أو ليس ملكك",
  listing_not_published: "يمكن تمييز الإعلانات المنشورة فقط",
  listing_rejected: "هذا الإعلان مرفوض ولا يمكن تمييزه",
  message_required: "اكتب الرسالة",
  missing_required_field: "فيه بيانات مطلوبة ناقصة",
  name_required: "اكتب الاسم",
  not_an_admin: "هذا المستخدم ليس مشرفًا",
  not_approved: "هذا الطلب غير مفعّل",
  not_authenticated: "سجّل الدخول أولًا",
  unauthenticated: "سجّل الدخول أولًا",
  not_found: "العنصر المطلوب غير موجود",
  not_scheduled: "هذا الإشعار غير مجدول",
  nothing_to_retry: "لا يوجد ما يمكن إعادة المحاولة فيه",
  office_name_required: "اكتب اسم المكتب",
  own_listing: "لا يمكنك إرسال استفسار على إعلانك",
  phone_already_used: "رقم الموبايل مستخدم في حساب آخر",
  phone_required: "اكتب رقم الموبايل",
  profile_not_found: "الحساب غير موجود",
  rate_limited: "محاولات كتير في وقت قصير، انتظر قليلًا وحاول تاني",
  reason_required: "اكتب السبب",
  region_has_children: "لا يمكن حذف موقع يحتوي مناطق تابعة. احذف المناطق التابعة أولًا",
  too_many_images: "عدد الصور أكبر من المسموح",
  user_not_found: "المستخدم غير موجود",
  region_in_use: "لا يمكن حذف موقع عليه إعلانات. عطّل الموقع بدل حذفه، أو انقل الإعلانات لموقع آخر",
  category_in_use: "لا يمكن حذف تصنيف عليه إعلانات. عطّل التصنيف بدل حذفه، أو انقل الإعلانات لتصنيف آخر",
};

const PATTERNS = [
  [/phone/i, "رقم الموبايل غير صحيح (مثال: 01012345678)"],
  [/jwt expired|invalid jwt|token.*expired|session.*expired/i, "انتهت جلسة الدخول، سجّل الدخول من جديد"],
  [/failed to fetch|networkerror|network request failed|load failed/i, "تعذر الاتصال بالإنترنت، تأكد من اتصالك وحاول مرة أخرى"],
  [/invalid login credentials/i, "البريد الإلكتروني أو كلمة المرور غير صحيحة"],
  [/user already registered|already been registered/i, "هذا البريد مسجّل بالفعل"],
  [/email not confirmed/i, "لم يتم تأكيد البريد الإلكتروني بعد"],
  [/password should be at least|weak password/i, "كلمة المرور ضعيفة، استخدم 6 أحرف أو أكثر"],
  [/row-level security|permission denied|not authorized/i, "ليس لديك صلاحية لتنفيذ هذه العملية"],
  [/duplicate key|already exists|unique constraint/i, "هذه البيانات مستخدمة بالفعل"],
  [/violates foreign key/i, "لا يمكن تنفيذ العملية لوجود بيانات مرتبطة"],
  [/violates check constraint|invalid input syntax|null value in column/i, "البيانات المدخلة غير صحيحة، راجعها وحاول مرة أخرى"],
  [/payload too large|file.*too large|exceeds the maximum/i, "حجم الملف أكبر من المسموح"],
  [/timeout|timed out/i, "الاتصال بطيء، حاول مرة أخرى"],
];
const CODES = { "42501": "forbidden", "28000": "not_authenticated", "23505": "duplicate_name", PGRST301: "not_authenticated" };

export function arErr(e, fallback = "حدث خطأ غير متوقع، حاول مرة أخرى") {
  if (!e) return fallback;
  let msg = typeof e === "string" ? e : e.message || e.error_description || e.msg || e.error || "";
  if (typeof msg !== "string") msg = "";
  const t = msg.trim();
  if (t.startsWith("{")) {
    try { const j = JSON.parse(t); return arErr(j.message || j.error_description || j.msg || j.error || "", fallback); } catch (_) {}
  }
  if (ERRORS[t]) return ERRORS[t];
  const key = (t.match(/[a-z]+(?:_[a-z0-9]+)+/g) || []).find((k) => ERRORS[k]);
  if (key) return ERRORS[key];
  for (const [re, ar] of PATTERNS) if (re.test(t)) return ar;
  if (e.code && CODES[e.code]) return ERRORS[CODES[e.code]];
  if (/[\u0600-\u06FF]/.test(t)) return t;
  return fallback;
}

// ---------- سجل النشاط ----------
export const ACTIONS = {
  approve: "قبول إعلان", reject: "رفض إعلان", delete_listing: "حذف إعلان",
  feature: "تمييز إعلان", unfeature: "إلغاء تمييز إعلان",
  block_user: "حظر مستخدم", unblock_user: "إلغاء حظر مستخدم",
  feature_added: "تمييز إعلان بمدة محددة", feature_removed: "إلغاء تمييز إعلان",
  feature_set_manual: "تعديل مدة التمييز يدويًا",
  payment_approved: "تفعيل طلب دفع", payment_rejected: "رفض طلب دفع", payment_revoked: "إلغاء تفعيل طلب دفع",
  plan_set_manual: "تعديل باقة مستخدم يدويًا",
  report_resolved: "معالجة بلاغ", role_change: "تغيير دور مستخدم", permissions_change: "تغيير صلاحيات مشرف",
  save_category: "حفظ تصنيف", delete_category: "حذف تصنيف", save_region: "حفظ منطقة", delete_region: "حذف منطقة", send_notification: "إرسال إشعار",
};
export const ENTITIES = { category: "تصنيف", listing: "إعلان", notification: "إشعار", payment: "طلب دفع", region: "منطقة", report: "بلاغ", user: "مستخدم" };
const ROLES = { user: "مستخدم", admin: "مشرف", super_admin: "سوبر أدمن" };
const AUD = { all: "كل المستخدمين", user: "مستخدم محدد", selected: "مستخدمون محددون" };

export const actionLabel = (a) => ACTIONS[a] || a;
const dt = (v) => (v ? new Date(v).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" }) : "بدون تاريخ");
const ads = (n) => `${n} إعلان`;

export function fmtDetails(action, d) {
  d = d || {};
  switch (action) {
    case "feature_added": return `مدة التمييز ${d.days} يوم — ينتهي ${dt(d.until)}`;
    case "feature_removed": return "تم إلغاء التمييز";
    case "feature_set_manual": return d.until ? `ينتهي التمييز ${dt(d.until)}` : "تم إلغاء التمييز";
    case "payment_approved": case "payment_rejected": case "payment_revoked":
      return `${d.kind === "feature" ? "تمييز إعلان" : "باقة إعلانات"} — المبلغ ${d.amount} ج.م`;
    case "plan_set_manual":
      return d.to_extra === 0
        ? `إرجاع للباقة المجانية (كانت ${ads(d.from_extra ?? 0)})`
        : `من ${ads(d.from_extra ?? 0)} (تنتهي ${dt(d.from_expires)}) إلى ${ads(d.to_extra)} (تنتهي ${dt(d.to_expires)})`;
    case "delete_category": return `«${d.name}»`;
    case "delete_region": return `«${d.name}»`;
    case "save_category": case "save_region":
      return `«${d.name}» — ${d.active ? "مفعّل" : "معطّل"}`;
    case "role_change": return `من ${ROLES[d.from] || d.from} إلى ${ROLES[d.to] || d.to}`;
    case "permissions_change": return `الصلاحيات: ${(d.perms || []).join("، ") || "بدون"}`;
    case "send_notification": return `${AUD[d.audience] || d.audience}${d.scheduled ? " (مجدول)" : ""}`;
    case "report_resolved": return "تم إغلاق البلاغ";
    default:
      if (d.note) return `ملاحظة: ${d.note}`;
      return Object.keys(d).length ? Object.entries(d).map(([k, v]) => `${k}: ${v}`).join(" • ") : "—";
  }
}
