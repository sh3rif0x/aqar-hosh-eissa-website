"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { bindGlobalListeners, ready, trackPageview } from "@/lib/track";

const SKIP = /^\/(dashboard|api)(\/|$)/;

export default function Tracker() {
  const pathname = usePathname();
  useEffect(() => { if (SKIP.test(pathname || "")) return; ready().then(() => trackPageview(pathname)); }, [pathname]);
  useEffect(() => bindGlobalListeners(), []);
  return null;
}
