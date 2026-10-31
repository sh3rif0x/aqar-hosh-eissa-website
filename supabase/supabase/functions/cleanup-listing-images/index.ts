import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: {
    persistSession: false
  }
});
const CLOUD = Deno.env.get("CLOUDINARY_CLOUD_NAME") ?? "";
const API_KEY = Deno.env.get("CLOUDINARY_API_KEY") ?? "";
const API_SECRET = Deno.env.get("CLOUDINARY_API_SECRET") ?? "";
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for(let i = 0; i < a.length; i++)r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
async function sha1Hex(s) {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(s));
  return [
    ...new Uint8Array(buf)
  ].map((b)=>b.toString(16).padStart(2, "0")).join("");
}
async function destroy(publicId) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await sha1Hex(`public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/destroy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      public_id: publicId,
      timestamp: String(timestamp),
      api_key: API_KEY,
      signature
    })
  });
  const data = await res.json().catch(()=>({}));
  // "not found" counts as success
  if (res.ok && (data.result === "ok" || data.result === "not found")) return true;
  console.error("cloudinary destroy failed", {
    status: res.status,
    result: data?.result
  });
  return false;
}
// Admin-run mode: list Cloudinary images under the "aqar/" prefix that have no
// matching listing_images row. Add ?delete=true to remove them.
async function orphans(doDelete) {
  const known = new Set();
  const { data, error } = await supabase.from("listing_images").select("storage_path");
  if (error) throw new Error(error.message);
  for (const r of data ?? [])known.add(r.storage_path);
  const auth = "Basic " + btoa(`${API_KEY}:${API_SECRET}`);
  const orphanIds = [];
  let cursor;
  do {
    const url = new URL(`https://api.cloudinary.com/v1_1/${CLOUD}/resources/image/upload`);
    url.searchParams.set("prefix", "aqar/");
    url.searchParams.set("max_results", "500");
    if (cursor) url.searchParams.set("next_cursor", cursor);
    const res = await fetch(url, {
      headers: {
        Authorization: auth
      }
    });
    if (!res.ok) throw new Error(`cloudinary list failed: ${res.status}`);
    const page = await res.json();
    for (const r of page.resources ?? []){
      if (!known.has(r.public_id)) orphanIds.push(r.public_id);
    }
    cursor = page.next_cursor;
  }while (cursor)
  let deleted = 0;
  if (doDelete) {
    for (const id of orphanIds)if (await destroy(id)) deleted++;
  }
  return {
    orphans: orphanIds,
    count: orphanIds.length,
    deleted
  };
}
Deno.serve(async (req)=>{
  const secret = Deno.env.get("WEBHOOK_SECRET") ?? "";
  const provided = req.headers.get("x-webhook-secret") ?? "";
  if (!secret || !safeEqual(provided, secret)) {
    return json({
      error: "unauthorized"
    }, 401);
  }
  if (!CLOUD || !API_KEY || !API_SECRET) {
    console.error("cloudinary secrets missing");
    return json({
      ok: false,
      error: "cloudinary not configured"
    }, 500);
  }
  const url = new URL(req.url);
  if (url.searchParams.get("mode") === "orphans") {
    try {
      return json({
        ok: true,
        ...await orphans(url.searchParams.get("delete") === "true")
      });
    } catch (e) {
      console.error("orphans mode failed", {
        message: String(e)
      });
      return json({
        ok: false
      }, 500);
    }
  }
  let payload;
  try {
    payload = await req.json();
  } catch  {
    return json({
      ok: true,
      skipped: "bad payload"
    });
  }
  const path = payload?.old_record?.storage_path;
  const listingId = payload?.old_record?.listing_id;
  if (payload?.type !== "DELETE" || !path) return json({
    ok: true,
    skipped: "nothing to do"
  });
  const ok = await destroy(path);
  if (!ok) {
    console.error("image cleanup failed", {
      listingId
    });
    return json({
      ok: false
    }, 500);
  }
  return json({
    ok: true
  });
});
