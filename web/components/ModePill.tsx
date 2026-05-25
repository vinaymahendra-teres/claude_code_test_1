"use client";

import { useState } from "react";
import { useAppShell } from "./AppShell";
import { Icon } from "./Icon";
import { ModePickerSheet } from "./sheets/ModePickerSheet";

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

export function ModePill() {
  const { modeDef } = useAppShell();
  const [open, setOpen] = useState(false);
  const IconComp = (Icon as Record<string, React.ComponentType<{ size?: number }>>)[modeDef.iconKey] || Icon.Grid;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Switch mode"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px 4px 6px",
          borderRadius: 999,
          background: COLOR_SOFT[modeDef.color],
          border: "1px solid " + COLOR_RING[modeDef.color],
          color: COLOR_DEEP[modeDef.color],
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: COLOR_RING[modeDef.color],
            color: "var(--surface)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <IconComp size={11} />
        </span>
        {modeDef.short}
        <Icon.ChevronDown size={12} />
      </button>
      <ModePickerSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
