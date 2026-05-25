"use client";

import { Card, SectionHeader } from "@/components/ui";
import { Sheet, Toggle, SegmentedControl } from "@/components/ui-client";
import { useAppShell } from "@/components/AppShell";

const PALETTES = [
  { v: "caramel", name: "Caramel", color: "oklch(0.58 0.13 55)" },
  { v: "rose", name: "Rose", color: "oklch(0.58 0.13 25)" },
  { v: "sage", name: "Sage", color: "oklch(0.52 0.10 145)" },
  { v: "plum", name: "Plum", color: "oklch(0.50 0.12 340)" },
] as const;

export function TweaksSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { tweaks, setTweak } = useAppShell();

  return (
    <Sheet open={open} onClose={onClose} title="Tweaks">
      <div style={{ paddingBottom: 24 }}>
        <SectionHeader>Palette</SectionHeader>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {PALETTES.map((p) => {
            const sel = tweaks.palette === p.v;
            return (
              <button
                key={p.v}
                type="button"
                onClick={() => setTweak("palette", p.v)}
                style={{
                  padding: "8px 4px",
                  border: "1.5px solid " + (sel ? p.color : "var(--line)"),
                  background: "var(--surface)",
                  borderRadius: "var(--r)",
                  cursor: "pointer",
                  textAlign: "center",
                  fontFamily: "inherit",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    background: p.color,
                    margin: "0 auto 4px",
                  }}
                />
                <div style={{ fontSize: 11, fontWeight: 600 }}>{p.name}</div>
              </button>
            );
          })}
        </div>

        <SectionHeader>Density</SectionHeader>
        <SegmentedControl
          value={tweaks.density}
          onChange={(v) => setTweak("density", v as "cozy" | "compact")}
          options={[
            { value: "cozy", label: "Cozy" },
            { value: "compact", label: "Compact" },
          ]}
        />

        <SectionHeader>Appearance</SectionHeader>
        <Card padding={14}>
          <Toggle
            checked={tweaks.darkMode}
            onChange={(v) => setTweak("darkMode", v)}
            label="Dark mode"
          />
          <div style={{ height: 1, background: "var(--line-soft)", margin: "10px 0" }} />
          <Toggle
            checked={tweaks.showBalances}
            onChange={(v) => setTweak("showBalances", v)}
            label="Show balances on home"
          />
        </Card>

        <div
          style={{
            marginTop: 18,
            fontSize: 11.5,
            color: "var(--muted)",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Tweaks save to your phone. Reload anytime.
        </div>
      </div>
    </Sheet>
  );
}
