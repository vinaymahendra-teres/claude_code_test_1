"use client";

import { useEffect, useState } from "react";

// Reads navigator.onLine + navigator.connection.effectiveType so screens
// can adapt to slow / no networks. Returns sensible defaults when those
// APIs aren't available (Safari, server render).

type EffectiveType = "slow-2g" | "2g" | "3g" | "4g" | "unknown";

type ConnectionState = {
  online: boolean;
  effectiveType: EffectiveType;
  saveData: boolean;
  // True when the link is "slow enough that we should degrade visuals" —
  // any of: offline, 2G/slow-2G, or the OS-level Save-Data toggle.
  isLow: boolean;
};

function readConnection(): ConnectionState {
  if (typeof navigator === "undefined") {
    return { online: true, effectiveType: "unknown", saveData: false, isLow: false };
  }
  const c = (navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean } })
    .connection;
  const online = navigator.onLine;
  const effectiveType = (c?.effectiveType as EffectiveType) ?? "unknown";
  const saveData = !!c?.saveData;
  const isLow = !online || effectiveType === "slow-2g" || effectiveType === "2g" || saveData;
  return { online, effectiveType, saveData, isLow };
}

export function useConnection(): ConnectionState {
  const [state, setState] = useState<ConnectionState>({
    online: true,
    effectiveType: "unknown",
    saveData: false,
    isLow: false,
  });

  useEffect(() => {
    setState(readConnection());
    function update() {
      setState(readConnection());
    }
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    const c = (navigator as Navigator & { connection?: EventTarget }).connection;
    c?.addEventListener?.("change", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      c?.removeEventListener?.("change", update);
    };
  }, []);

  return state;
}
