"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace("/auth");
      else setUser(data.user);
    });
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/auth");
  }

  if (!user) return null;

  return (
    <main className={styles.wrapper}>
      <header className={styles.header}>
        <h1>Dashboard</h1>
        <button onClick={logout}>Logout</button>
      </header>
      <p>Welcome, {user.email}</p>
    </main>
  );
}
