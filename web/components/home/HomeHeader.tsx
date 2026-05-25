"use client";

import { useEffect, useState } from "react";
import { ModePill } from "@/components/ModePill";
import { Icon } from "@/components/Icon";
import { TweaksSheet } from "@/components/sheets/TweaksSheet";
import { GlobalBranchBadge } from "@/components/GlobalBranchBadge";

export function HomeHeader({
  dateLabel,
  userName,
}: {
  dateLabel: string;
  userName: string;
}) {
  const [tweaksOpen, setTweaksOpen] = useState(false);
  // Greeting is anchored to Asia/Kolkata regardless of the device's clock,
  // so Sh and S see "Good morning" at IST 5am even if their phone is on UTC.
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => {
    setHour(istHour());
  }, []);

  const firstName = (userName || "").split(/\s+/)[0] || "there";
  const slot = hour == null ? null : timeOfDay(hour);
  const greeting = slot ? `Good ${slot}, ${firstName}` : firstName;

  return (
    <>
      <header style={{ position: "relative", padding: "44px 18px 10px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <ModePill />
            <GlobalBranchBadge />
          </div>
          <button
            type="button"
            onClick={() => setTweaksOpen(true)}
            title="Tweaks"
            aria-label="Tweaks"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 30,
              height: 30,
              borderRadius: 999,
              background: "transparent",
              color: "var(--ink-soft)",
              border: "1px solid var(--line-soft)",
              cursor: "pointer",
            }}
          >
            <Icon.Sparkle size={14} />
          </button>
        </div>

        <div
          style={{
            fontFamily: "DM Serif Display, serif",
            fontSize: 24,
            lineHeight: 1.15,
          }}
        >
          {greeting}
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: "var(--muted)",
            marginTop: 2,
          }}
        >
          {dateLabel}
        </div>
      </header>
      <TweaksSheet open={tweaksOpen} onClose={() => setTweaksOpen(false)} />
    </>
  );
}

function timeOfDay(h: number): "morning" | "afternoon" | "evening" | "night" {
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

// Reads the hour in Asia/Kolkata, ignoring whatever timezone the device is on.
function istHour(): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const hourPart = parts.find((p) => p.type === "hour");
  return hourPart ? parseInt(hourPart.value, 10) : new Date().getHours();
}
