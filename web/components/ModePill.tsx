"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MODES, MODE_ORDER, useAppShell, type ModeId } from "./AppShell";
import { Icon } from "./Icon";

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
  const { modeDef, mode, setMode } = useAppShell();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const IconComp =
    (Icon as Record<string, React.ComponentType<{ size?: number }>>)[modeDef.iconKey] || Icon.Grid;

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Close on outside click (the portal-rendered backdrop handles this for taps
  // anywhere outside the popover; keep this for pointer events that bypass the
  // backdrop, e.g. when scrolling forces a click outside the trigger area).
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    // Defer one tick so the opening click doesn't immediately close.
    const t = setTimeout(() => document.addEventListener("mousedown", onClick), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Switch mode"
        aria-expanded={open}
        aria-haspopup="menu"
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
        <Icon.ChevronDown
          size={12}
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }}
        />
      </button>

      {open && (
        <>
          <DimBackdrop onClick={() => setOpen(false)} />
          <div
            role="menu"
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: 0,
              width: 280,
              maxWidth: "calc(100vw - 36px)",
              zIndex: 350,
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "var(--r-lg)",
              boxShadow: "var(--shadow-lg)",
              padding: 6,
              animation: "fadeIn .12s ease-out",
            }}
          >
            {/* Triangular tail pointing up at the pill */}
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                top: -6,
                left: 22,
                width: 12,
                height: 12,
                background: "var(--surface)",
                borderTop: "1px solid var(--line)",
                borderLeft: "1px solid var(--line)",
                transform: "rotate(45deg)",
              }}
            />
            {MODE_ORDER.map((id) => {
              const m = MODES[id];
              const selected = id === mode;
              const ItemIcon =
                (Icon as Record<string, React.ComponentType<{ size?: number }>>)[m.iconKey] ||
                Icon.Grid;
              return (
                <button
                  key={id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMode(id as ModeId);
                    setOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "var(--r)",
                    background: selected ? COLOR_SOFT[m.color] : "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "inherit",
                  }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      background: COLOR_RING[m.color],
                      color: "var(--surface)",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <ItemIcon size={14} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        color: selected ? COLOR_DEEP[m.color] : "var(--ink)",
                      }}
                    >
                      {m.label}
                    </span>
                    <span
                      style={{
                        display: "block",
                        fontSize: 11,
                        color: "var(--muted)",
                        marginTop: 1,
                      }}
                    >
                      {m.desc}
                    </span>
                  </span>
                  {selected && (
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 999,
                        background: COLOR_RING[m.color],
                        color: "var(--surface)",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon.Check size={11} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// Lightweight dimmed backdrop, portaled to .app-root so it covers the whole
// phone interior (including the bottom nav). Click anywhere on it to close.
function DimBackdrop({ onClick }: { onClick: () => void }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setTarget(document.querySelector<HTMLElement>(".app-root") ?? document.body);
  }, []);
  if (!target) return null;
  return createPortal(
    <div
      onClick={onClick}
      style={{
        position: "absolute",
        inset: 0,
        background: "oklch(0.20 0.02 50 / 0.25)",
        zIndex: 340,
        animation: "fadeIn .14s ease-out",
      }}
    />,
    target,
  );
}
