import { NextResponse } from "next/server";
import { isIP } from "node:net";
import { createClient } from "@supabase/supabase-js";
import { HANDLERS } from "@/lib/monitor/ingest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOT = /bot|crawl|spider|slurp|headless|lighthouse|preview|monitor/i;
const ok = () => new NextResponse(null, { status: 202 });

function context(req) {
  const h = req.headers;
  const raw = (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || h.get("cf-connecting-ip") || "";
  const ip = isIP(raw) ? raw : null;
  const dec = (v) => { try { return v ? decodeURIComponent(v).slice(0, 80) : null; } catch { return null; } };
  return { ip, country: dec(h.get("x-vercel-ip-country") || h.get("cf-ipcountry")), city: dec(h.get("x-vercel-ip-city")) };
}

export async function POST(req) {
  try {
    if (BOT.test(req.headers.get("user-agent") || "")) return ok();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return ok();

    const body = await req.json().catch(() => null);
    const handler = body && HANDLERS[body.type];
    if (!handler || typeof body.session_id !== "string" || !body.session_id) return ok();

    const ctx = context(req);
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

    if (ctx.ip) {
      const { data: blocked } = await db.rpc("mon_is_blocked", { p_ip: ctx.ip });
      if (blocked === true) return new NextResponse(null, { status: 403 });
    }
    await db.rpc(handler.rpc, { p: handler.build(body, ctx) });
  } catch {
    /* التتبع لا يجب أن يكسر الموقع أبداً */
  }
  return ok();
}
