import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const CLOUD = Deno.env.get("CLOUDINARY_CLOUD_NAME") ?? "";
const API_KEY = Deno.env.get("CLOUDINARY_API_KEY") ?? "";
const API_SECRET = Deno.env.get("CLOUDINARY_API_SECRET") ?? "";
const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    persistSession: false
  }
});
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...cors,
      "Content-Type": "application/json"
    }
  });
}
async function sha1Hex(s) {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(s));
  return [
    ...new Uint8Array(buf)
  ].map((b)=>b.toString(16).padStart(2, "0")).join("");
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Body: { listing_id: uuid, count?: 1..8 }
// Returns signed upload params. The client uploads each file directly to
// https://api.cloudinary.com/v1_1/{cloud_name}/image/upload and then inserts a
// listing_images row with storage_path = public_id (via the signed-in client, RLS applies).
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: cors
  });
  if (req.method !== "POST") return json({
    error: "method not allowed"
  }, 405);
  if (!CLOUD || !API_KEY || !API_SECRET) return json({
    error: "cloudinary not configured"
  }, 500);
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: u, error: uerr } = await admin.auth.getUser(token);
  if (uerr || !u?.user) return json({
    error: "unauthorized"
  }, 401);
  const userId = u.user.id;
  let body;
  try {
    body = await req.json();
  } catch  {
    return json({
      error: "bad request"
    }, 400);
  }
  const listingId = body?.listing_id;
  const count = Math.min(Math.max(Number(body?.count ?? 1) || 1, 1), 8);
  if (typeof listingId !== "string" || !UUID.test(listingId)) {
    return json({
      error: "invalid listing_id"
    }, 400);
  }
  const { data: profile } = await admin.from("profiles").select("role, is_blocked").eq("id", userId).single();
  if (!profile || profile.is_blocked) return json({
    error: "forbidden"
  }, 403);
  const { data: listing } = await admin.from("listings").select("user_id").eq("id", listingId).maybeSingle();
  if (!listing) return json({
    error: "listing not found"
  }, 404);
  if (listing.user_id !== userId && profile.role !== "admin") {
    return json({
      error: "forbidden"
    }, 403);
  }
  const { count: existing } = await admin.from("listing_images").select("id", {
    count: "exact",
    head: true
  }).eq("listing_id", listingId);
  if ((existing ?? 0) + count > 8) return json({
    error: "max 8 images per listing"
  }, 400);
  const allowedFormats = "jpg,png,webp";
  const uploads = [];
  for(let i = 0; i < count; i++){
    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = `aqar/${listing.user_id}/${listingId}/${crypto.randomUUID()}`;
    // params signed in alphabetical order
    const signature = await sha1Hex(`allowed_formats=${allowedFormats}&public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`);
    uploads.push({
      public_id: publicId,
      timestamp,
      signature
    });
  }
  return json({
    cloud_name: CLOUD,
    api_key: API_KEY,
    allowed_formats: allowedFormats,
    uploads
  });
});
