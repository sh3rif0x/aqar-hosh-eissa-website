import { supabase } from "./supabase";

async function rpc(name, args = {}) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return data;
}
async function fn(name, body = {}) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw error;
  return data;
}

export const listings = {
  list: (f = {}) =>
    rpc("get_listings", {
      p_category_id: f.category_id ?? null,
      p_region_id: f.region_id ?? null,
      p_deal_type: f.deal_type ?? null,
      p_min_price: f.min_price ?? null,
      p_max_price: f.max_price ?? null,
      p_search: f.search ?? null,
      p_featured_only: f.featured_only ?? false,
      p_sort: f.sort ?? "newest",
      p_limit: f.limit ?? 20,
      p_offset: f.offset ?? 0,
      p_min_area: f.min_area ?? null,
      p_max_area: f.max_area ?? null,
      p_area_unit: f.area_unit ?? null,
      p_min_rooms: f.min_rooms ?? null,
      p_min_baths: f.min_baths ?? null,
      p_finishing: f.finishing ?? null,
      p_advertiser_type: f.advertiser_type ?? null,
    }),
  get: (id) => rpc("get_listing", { p_id: id }),
  mine: ({ status = null, limit = 20, offset = 0 } = {}) =>
    rpc("get_my_listings", { p_status: status, p_limit: limit, p_offset: offset }),
  create: (data) => rpc("create_listing", { p_data: data }),
  update: (id, data) => rpc("update_listing", { p_id: id, p_data: data }),
  remove: (id) => rpc("delete_listing", { p_id: id }),
  setImages: (listingId, urls) => rpc("set_listing_images", { p_listing_id: listingId, p_images: urls }),
  canEdit: (id) => rpc("can_edit_listing", { p_listing: id }),
};
export const lookups = { all: () => rpc("get_lookups") };
export const advertiser = { get: (id) => rpc("get_advertiser", { p_id: id }) };
export const favorites = {
  add: (id) => rpc("add_favorite", { p_listing_id: id }),
  remove: (id) => rpc("remove_favorite", { p_listing_id: id }),
  toggle: (id) => rpc("toggle_favorite", { p_listing_id: id }),
  mine: ({ limit = 20, offset = 0 } = {}) => rpc("get_my_favorites", { p_limit: limit, p_offset: offset }),
};
export const profile = {
  get: () => rpc("get_my_profile"),
  update: ({ full_name = null, phone = null, avatar_url = null } = {}) =>
    rpc("update_my_profile", { p_full_name: full_name, p_phone: phone, p_avatar_url: avatar_url }),
  setAccountType: (type, office_name = null) => rpc("set_my_account_type", { p_type: type, p_office_name: office_name }),
  quota: () => rpc("get_my_quota"),
  isAdmin: () => rpc("is_admin"),
  isBlocked: () => rpc("is_blocked"),
};
export const admin = {
  listings: ({ status = null, search = null, limit = 20, offset = 0 } = {}) =>
    rpc("admin_get_listings", { p_status: status, p_search: search, p_limit: limit, p_offset: offset }),
  users: ({ search = null, blocked = null, limit = 20, offset = 0 } = {}) =>
    rpc("admin_get_users", { p_search: search, p_blocked: blocked, p_limit: limit, p_offset: offset }),
  actions: ({ limit = 20, offset = 0 } = {}) => rpc("admin_get_actions", { p_limit: limit, p_offset: offset }),
  review: (id, decision, reason = null) =>
    rpc("admin_review_listing", { p_id: id, p_decision: decision, p_reason: reason }),
  setFeatured: (id, featured) => rpc("admin_set_featured", { p_id: id, p_featured: featured }),
  setUserBlocked: (userId, blocked) => rpc("admin_set_user_blocked", { p_user_id: userId, p_blocked: blocked }),
  setUserRole: (userId, role) => rpc("admin_set_user_role", { p_user_id: userId, p_role: role }),
};
export const edge = {
  notifyListingStatus: (b) => fn("notify-listing-status", b),
  cleanupListingImages: (b) => fn("cleanup-listing-images", b),
  cloudinarySign: (b) => fn("cloudinary-sign", b),
  adminStats: (b) => fn("admin-stats", b),
};
export const auth = {
  signUp: (email, password, meta = {}) => supabase.auth.signUp({ email, password, options: { data: meta } }),
  signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
  signInWithGoogle: () =>
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/`, queryParams: { prompt: "select_account" } },
    }),
  resetPassword: (email) =>
    supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/reset` }),
  updatePassword: (password) => supabase.auth.updateUser({ password }),
  signOut: () => supabase.auth.signOut(),
  session: () => supabase.auth.getSession(),
  onChange: (cb) => supabase.auth.onAuthStateChange(cb),
};
