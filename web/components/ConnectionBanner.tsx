"use client";

import { useConnection } from "@/lib/connection";

// Small slim banner that drops in below the iPhone notch when the operator
// is offline or on a noticeably slow connection. Positioned inside the
// phone shell so it stays in the design frame (not the desktop chrome).
export function ConnectionBanner() {
  const { online, effectiveType, saveData } = useConnection();
  if (online && effectiveType !== "slow-2g" && effectiveType !== "2g" && !saveData) return null;

  const offline = !online;
  const label = offline
    ? "Offline — changes will save when you're back online"
    : `Slow connection (${effectiveType}) — visuals reduced`;

  return (
    <div
      style={{
        position: "absolute",
        top: 44,
        left: 0,
        right: 0,
        zIndex: 240,
        background: offline ? "oklch(0.92 0.07 28)" : "oklch(0.95 0.07 80)",
        color: offline ? "var(--danger)" : "oklch(0.40 0.10 70)",
        border: offline
          ? "1px solid var(--danger)"
          : "1px solid oklch(0.82 0.12 80)",
        borderLeft: "none",
        borderRight: "none",
        fontSize: 11.5,
        fontWeight: 600,
        textAlign: "center",
        padding: "5px 12px",
        pointerEvents: "none",
      }}
      role="status"
      aria-live="polite"
    >
      {label}
    </div>
  );
}
