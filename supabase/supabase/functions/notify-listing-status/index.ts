import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: {
    persistSession: false
  }
});
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
function b64url(input) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let s = "";
  for (const b of bytes)s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const aud = sa.token_uri ?? "https://oauth2.googleapis.com/token";
  const unsigned = `${b64url(JSON.stringify({
    alg: "RS256",
    typ: "JWT"
  }))}.${b64url(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud,
    iat: now,
    exp: now + 3600
  }))}`;
  const pem = sa.private_key.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\s/g, "");
  const der = Uint8Array.from(atob(pem), (c)=>c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, {
    name: "RSASSA-PKCS1-v1_5",
    hash: "SHA-256"
  }, false, [
    "sign"
  ]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const res = await fetch(aud, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${b64url(sig)}`
    })
  });
  if (!res.ok) throw new Error(`oauth token failed: ${res.status}`);
  return (await res.json()).access_token;
}
Deno.serve(async (req)=>{
  const secret = Deno.env.get("WEBHOOK_SECRET") ?? "";
  const provided = req.headers.get("x-webhook-secret") ?? "";
  if (!secret || !safeEqual(provided, secret)) {
    return json({
      error: "unauthorized"
    }, 401);
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
  const record = payload?.record;
  const old = payload?.old_record;
  if (!record || !old) return json({
    ok: true,
    skipped: "no record"
  });
  if (old.status === record.status) return json({
    ok: true,
    skipped: "no status change"
  });
  if (record.status !== "published" && record.status !== "rejected") {
    return json({
      ok: true,
      skipped: "status not notifiable"
    });
  }
  const listingId = record.id;
  const ownerId = record.user_id;
  const { data: tokens, error } = await supabase.from("device_tokens").select("id, fcm_token").eq("user_id", ownerId);
  if (error) {
    console.error("tokens query failed", {
      listingId,
      ownerId,
      message: error.message
    });
    return json({
      ok: false
    }, 500);
  }
  if (!tokens?.length) return json({
    ok: true,
    sent: 0
  });
  const saJson = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON");
  const projectId = Deno.env.get("FCM_PROJECT_ID");
  if (!saJson || !projectId) {
    console.error("FCM secrets missing", {
      listingId
    });
    return json({
      ok: false,
      error: "fcm not configured"
    }, 500);
  }
  let accessToken;
  try {
    accessToken = await getAccessToken(JSON.parse(saJson));
  } catch (e) {
    console.error("fcm auth failed", {
      listingId,
      message: String(e)
    });
    return json({
      ok: false
    }, 500);
  }
  const published = record.status === "published";
  const title = published ? "تمت الموافقة على إعلانك" : "تم رفض إعلانك";
  const body = published ? record.title : record.rejection_reason ?? "";
  let sent = 0;
  let removed = 0;
  for (const t of tokens){
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: {
          token: t.fcm_token,
          notification: {
            title,
            body
          },
          data: {
            listing_id: listingId,
            status: record.status
          }
        }
      })
    });
    if (res.ok) {
      sent++;
      continue;
    }
    const err = await res.json().catch(()=>({}));
    const status = err?.error?.status;
    const codes = (err?.error?.details ?? []).map((d)=>d?.errorCode);
    if (codes.includes("UNREGISTERED") || status === "NOT_FOUND" || status === "INVALID_ARGUMENT") {
      await supabase.from("device_tokens").delete().eq("id", t.id);
      removed++;
    } else {
      console.error("fcm send failed", {
        listingId,
        tokenId: t.id,
        status
      });
    }
  }
  return json({
    ok: true,
    sent,
    removed
  });
});
