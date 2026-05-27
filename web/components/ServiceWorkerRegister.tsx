"use client";

import { useEffect } from "react";

// Registers /sw.js once per session. Skipped in dev so HMR + RSC streams
// don't fight a stale cache. The service worker itself does all the cache
// strategy work — see public/sw.js.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(() => {
        /* registration failed — fall back to no caching, app still works */
      });
  }, []);
  return null;
}
