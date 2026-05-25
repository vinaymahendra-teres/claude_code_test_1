"use client";

import { useState } from "react";
import { ModePill } from "@/components/ModePill";
import { Icon } from "@/components/Icon";
import { TweaksSheet } from "@/components/sheets/TweaksSheet";

export function HomeHeader({
  dateLabel,
  greeting,
}: {
  dateLabel: string;
  greeting: string;
}) {
  const [tweaksOpen, setTweaksOpen] = useState(false);

  return (
    <>
      <header style={{ position: "relative", padding: "54px 22px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <ModePill />
          <button
            type="button"
            onClick={() => setTweaksOpen(true)}
            title="Tweaks"
            aria-label="Tweaks"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 999,
              background: "transparent",
              color: "var(--ink-soft)",
              border: "1px solid var(--line-soft)",
              cursor: "pointer",
            }}
          >
            <Icon.Sparkle size={16} />
          </button>
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: "var(--muted)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            marginTop: 14,
          }}
        >
          {dateLabel}
        </div>
        <div
          style={{
            fontFamily: "DM Serif Display, serif",
            fontSize: 28,
            marginTop: 4,
            lineHeight: 1.1,
          }}
        >
          {greeting}
        </div>
      </header>
      <TweaksSheet open={tweaksOpen} onClose={() => setTweaksOpen(false)} />
    </>
  );
}
