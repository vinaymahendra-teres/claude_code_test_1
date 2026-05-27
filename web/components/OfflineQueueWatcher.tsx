"use client";

import { useEffect, useState } from "react";
import { flush, listQueue, subscribe } from "@/lib/offline-queue";

// Watches the offline queue and re-flushes when:
//  - the browser comes back online
//  - a new entry is enqueued (in case we were already online and the
//    operator just hit "Record payment" — the wrapper tried, failed, and
//    enqueued; we should retry once on the next tick)
// Also renders a tiny chip near the home indicator when entries are
// waiting so the operator knows something is pending.
export function OfflineQueueWatcher() {
  const [pending, setPending] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      const q = await listQueue();
      if (!cancelled) setPending(q.length);
    }
    refresh();

    async function tryFlush() {
      const res = await flush();
      if (res.drained > 0 || res.failed > 0) refresh();
    }

    const onOnline = () => tryFlush();
    window.addEventListener("online", onOnline);
    const unsub = subscribe(() => {
      refresh();
      if (navigator.onLine) tryFlush();
    });

    // First-mount flush — useful when the operator opens the app for the
    // day with carried-over queued entries.
    if (navigator.onLine) tryFlush();

    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
      unsub();
    };
  }, []);

  if (pending === 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        bottom: 88,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 250,
        padding: "5px 12px",
        background: "var(--caramel)",
        color: "var(--surface)",
        fontSize: 11.5,
        fontWeight: 600,
        borderRadius: 999,
        boxShadow: "var(--shadow-sm)",
      }}
      role="status"
      aria-live="polite"
    >
      {pending} pending sync{pending === 1 ? "" : "s"}
    </div>
  );
}
