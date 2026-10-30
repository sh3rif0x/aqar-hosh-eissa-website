const fmt = (n) => (n == null || isNaN(Number(n)) ? "—" : Number(n).toLocaleString("en-US"));
const UNITS = { sqm: "م²", feddan: "فدان", qirat: "قيراط", sahm: "سهم" };
const ago = (d) => {
  if (!d) return "";
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  return days <= 0 ? "اليوم" : days === 1 ? "منذ يوم" : `منذ ${days} أيام`;
};
export const items = (d) => (Array.isArray(d) ? d : d?.items ?? []);
export function normalize(l = {}) {
  const isRent = l.deal_type === "rent";
  const adv = l.advertiser || {};
  return {
    id: l.id,
    title: l.title,
    badge: l.is_featured ? "مميز" : isRent ? "للإيجار" : "للبيع",
    price: `${fmt(l.price)} ج.م`,
    period: isRent ? "/شهر" : "",
    area: fmt(l.area),
    unit: UNITS[l.area_unit] || "م²",
    type: l.category_name_ar || "",
    location: `${l.region_name_ar || ""}، البحيرة`,
    listed: ago(l.published_at || l.created_at),
    photos: Number(l.images_count || (l.cover_path ? 1 : 0)),
    image: l.cover_path || null,
    tone: 0,
    isFavorite: !!l.is_favorite,
    phone: l.contact_phone,
    agent: {
      name: adv.name || "معلن",
      role: adv.type === "broker" ? "مكتب عقاري" : "مالك مباشر",
      isBroker: adv.type === "broker",
      avatar: adv.avatar_url,
    },
  };
}
