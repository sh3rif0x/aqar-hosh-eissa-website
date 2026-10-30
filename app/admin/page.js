"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

export default function Admin() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [ok, setOk] = useState(false);
  const [tab, setTab] = useState("users");
  const [q, setQ] = useState("");
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [actions, setActions] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) return router.push("/auth");
    supabase.from("profiles").select("role").eq("id", user.id).single()
      .then(({ data }) => data?.role === "admin" ? setOk(true) : router.push("/"));
  }, [user, loading]);

  const load = useCallback(async () => {
    setErr("");
    const run = async (fn, args, set) => {
      const { data, error } = await supabase.rpc(fn, args);
      if (error) return setErr(error.message);
      set(data.items);
    };
    if (tab === "users") run("admin_get_users", { p_search: q || null, p_limit: 50 }, setUsers);
    if (tab === "listings") run("admin_get_listings", { p_status: "pending", p_search: q || null, p_limit: 50 }, setListings);
    if (tab === "actions") run("admin_get_actions", { p_limit: 50 }, setActions);
  }, [tab, q]);
  useEffect(() => { if (ok) load(); }, [ok, load]);

  const rpc = async (fn, args) => {
    const { error } = await supabase.rpc(fn, args);
    if (error) setErr(error.message); else load();
  };
  const reject = (id) => {
    const r = prompt("سبب الرفض؟");
    if (r) rpc("admin_review_listing", { p_id: id, p_decision: "reject", p_reason: r });
  };

  if (!ok) return null;
  return (
    <main className="auth-wrap"><div className="auth-card wide">
      <h1>لوحة الأدمن</h1>
      <div className="auth-tabs">
        {[["users", "المستخدمين"], ["listings", "إعلانات للمراجعة"], ["actions", "السجل"]].map(([k, t]) =>
          <button key={k} type="button" className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{t}</button>)}
      </div>
      {tab !== "actions" && <input className="in" placeholder="بحث..." value={q} onChange={(e) => setQ(e.target.value)} />}
      {err && <p className="err">{err}</p>}

      {tab === "users" && users.map((u) => (
        <div key={u.id} className="my-item" style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: 8 }}>
          <div>
            <b>{u.full_name || "—"}</b> {u.role === "admin" && "👑"} {u.is_blocked && "🚫"}
            <br /><small>{u.email} · {u.phone || "—"} · إعلانات: {u.listings_count}</small>
          </div>
          {u.role !== "admin" && (
            <button className={u.is_blocked ? "btn" : "btn btn-danger"}
              onClick={() => rpc("admin_set_user_blocked", { p_user_id: u.id, p_blocked: !u.is_blocked })}>
              {u.is_blocked ? "فك الحظر" : "حظر"}
            </button>
          )}
        </div>
      ))}

      {tab === "listings" && listings.map((l) => (
        <div key={l.id} className="my-item" style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: 8 }}>
          <div><b>{l.title}</b><br /><small>{l.owner?.full_name} · {l.owner?.phone}</small></div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn" onClick={() => rpc("admin_review_listing", { p_id: l.id, p_decision: "approve" })}>قبول</button>
            <button className="btn btn-danger" onClick={() => reject(l.id)}>رفض</button>
          </div>
        </div>
      ))}

      {tab === "actions" && actions.map((a) => (
        <div key={a.id} className="my-item" style={{ padding: 8 }}>
          <small>{new Date(a.created_at).toLocaleString("ar-EG")} · {a.admin_name} · {a.action} {a.target_name || a.note || ""}</small>
        </div>
      ))}
    </div></main>
  );
}
