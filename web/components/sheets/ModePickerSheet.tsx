"use client";

import { Sheet } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { MODE_ORDER, MODES, useAppShell, type ModeId } from "@/components/AppShell";

const COLOR_RING: Record<string, string> = {
  caramel: "var(--caramel)",
  rose: "var(--rose)",
  sage: "var(--sage)",
  plum: "var(--plum)",
};

const COLOR_SOFT: Record<string, string> = {
  caramel: "var(--caramel-soft)",
  rose: "var(--rose-soft)",
  sage: "var(--sage-soft)",
  plum: "oklch(0.93 0.04 340)",
};

const COLOR_DEEP: Record<string, string> = {
  caramel: "var(--caramel-deep)",
  rose: "oklch(0.38 0.10 25)",
  sage: "oklch(0.34 0.07 145)",
  plum: "oklch(0.32 0.10 340)",
};

export function ModePickerSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mode, setMode } = useAppShell();

  return (
    <Sheet open={open} onClose={onClose} title="Choose your mode">
      <div style={{ padding: "4px 0 24px" }}>
        <p
          style={{
            fontSize: 13,
            color: "var(--muted)",
            margin: "0 0 16px",
            lineHeight: 1.5,
          }}
        >
          Pick the hat you&apos;re wearing right now. The app trims itself down to what matters in
          this mode — everything else is one tap away under More.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {MODE_ORDER.map((id) => {
            const m = MODES[id];
            const selected = id === mode;
            const IconComp = (Icon as Record<string, React.ComponentType<{ size?: number }>>)[m.iconKey] || Icon.Grid;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setMode(id as ModeId);
                  onClose();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: 14,
                  borderRadius: "var(--r-lg)",
                  background: selected ? COLOR_SOFT[m.color] : "var(--surface)",
                  border: "1.5px solid " + (selected ? COLOR_RING[m.color] : "var(--line-soft)"),
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                  fontFamily: "inherit",
                }}
              >
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    background: COLOR_RING[m.color],
                    color: "var(--surface)",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <IconComp size={20} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: COLOR_DEEP[m.color] }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>
                    {m.desc}
                  </div>
                </div>
                {selected && (
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 999,
                      background: COLOR_RING[m.color],
                      color: "var(--surface)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon.Check size={14} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
}
