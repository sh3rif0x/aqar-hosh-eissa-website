import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const admin = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: {
    persistSession: false
  }
});
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
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
async function count(q) {
  const { count, error } = await q;
  if (error) throw new Error(error.message);
  return count ?? 0;
}
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: cors
  });
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: u, error: uerr } = await admin.auth.getUser(token);
  if (uerr || !u?.user) return json({
    error: "unauthorized"
  }, 401);
  const { data: profile } = await admin.from("profiles").select("role, is_blocked").eq("id", u.user.id).single();
  if (!profile || profile.role !== "admin" || profile.is_blocked) {
    return json({
      error: "forbidden"
    }, 403);
  }
  try {
    const head = {
      count: "exact",
      head: true
    };
    const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const [pending, published, rejected, last7, users, blocked] = await Promise.all([
      count(admin.from("listings").select("id", head).eq("status", "pending")),
      count(admin.from("listings").select("id", head).eq("status", "published")),
      count(admin.from("listings").select("id", head).eq("status", "rejected")),
      count(admin.from("listings").select("id", head).eq("status", "published").gte("published_at", weekAgo)),
      count(admin.from("profiles").select("id", head)),
      count(admin.from("profiles").select("id", head).eq("is_blocked", true))
    ]);
    return json({
      listings_by_status: {
        pending,
        published,
        rejected
      },
      published_last_7_days: last7,
      users,
      blocked_users: blocked
    });
  } catch (e) {
    console.error("admin-stats failed", {
      adminId: u.user.id,
      message: String(e)
    });
    return json({
      error: "internal error"
    }, 500);
  }
});
