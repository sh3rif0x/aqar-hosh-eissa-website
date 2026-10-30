"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, profile } from "./api";

const Ctx = createContext({ user: null, me: null, isAdmin: false, loading: true });
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [me, setMe] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async (u) => {
    setUser(u);
    if (u) {
      try { setMe(await profile.get()); } catch { setMe(null); }
      try { setIsAdmin(!!(await profile.isAdmin())); } catch { setIsAdmin(false); }
    } else { setMe(null); setIsAdmin(false); }
    setLoading(false);
  };

  useEffect(() => {
    auth.session().then(({ data }) => load(data.session?.user ?? null));
    const { data } = auth.onChange((_e, session) => load(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  return <Ctx.Provider value={{ user, me, isAdmin, loading }}>{children}</Ctx.Provider>;
}
