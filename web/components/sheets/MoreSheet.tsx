"use client";

import Link from "next/link";
import { useState } from "react";
import { Sheet } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { useAppShell } from "@/components/AppShell";
import { ModePickerSheet } from "./ModePickerSheet";
import { TweaksSheet } from "./TweaksSheet";

const ALL_ROUTES: Array<{
  slug: string;
  href: string;
  label: string;
  icon: keyof typeof Icon;
  desc: string;
}> = [
  { slug: "orders", href: "/orders", label: "Orders", icon: "Receipt", desc: "Pipeline + history" },
  { slug: "customers", href: "/customers", label: "Customers", icon: "Users", desc: "CRM, DPDP consent" },
  { slug: "recipes", href: "/recipes", label: "Recipes", icon: "Cake", desc: "Menu + cost cards" },
  { slug: "inventory", href: "/inventory", label: "Inventory", icon: "Box", desc: "Stock + reorder" },
  { slug: "bakes", href: "/bakes", label: "Bakes", icon: "Calendar", desc: "Week schedule" },
  { slug: "kitchen", href: "/kitchen", label: "Timer rack", icon: "Clock", desc: "Full kitchen timer view" },
  { slug: "shopping", href: "/shopping", label: "Shopping", icon: "Box", desc: "Lists + auto-fill from stock & orders" },
  { slug: "calendar", href: "/calendar", label: "Calendar", icon: "Calendar", desc: "Events, deadlines + overlays" },
  { slug: "marketing", href: "/marketing", label: "Marketing", icon: "Megaphone", desc: "Campaigns + templates" },
  { slug: "reviews", href: "/reviews", label: "Reviews", icon: "Mail", desc: "T+2 feedback queue" },
  { slug: "books", href: "/books", label: "Books", icon: "Wallet", desc: "P&L, expenses, tax" },
  { slug: "reports", href: "/reports", label: "Reports", icon: "Doc", desc: "Financial reports" },
  { slug: "tools", href: "/tools", label: "Tools", icon: "Sparkle", desc: "Conversions" },
];

const ADMIN_ROUTES: Array<{
  slug: string;
  href: string;
  label: string;
  icon: keyof typeof Icon;
  desc: string;
}> = [
  { slug: "users", href: "/admin/users", label: "Users", icon: "Users", desc: "Roles, passwords, access" },
];

export function MoreSheet({
  open,
  onClose,
  isAdmin,
}: {
  open: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}) {
  const { modeDef } = useAppShell();
  const [modeOpen, setModeOpen] = useState(false);
  const [tweaksOpen, setTweaksOpen] = useState(false);

  const navSet = new Set(modeDef.nav);
  const primarySet = new Set(modeDef.morePrimary);

  // Hide items already in the bottom-nav, then sort by mode primaries first.
  const visible = ALL_ROUTES.filter((r) => !navSet.has(r.slug)).sort((a, b) => {
    const pa = primarySet.has(a.slug) ? 0 : 1;
    const pb = primarySet.has(b.slug) ? 0 : 1;
    return pa - pb;
  });

  return (
    <>
      <Sheet open={open} onClose={onClose} title="More">
        <div style={{ padding: "4px 0 24px" }}>
          {/* Mode switcher row */}
          <button
            type="button"
            onClick={() => setModeOpen(true)}
            style={settingsRow}
          >
            <span style={settingsIcon("caramel")}>
              <Icon.Grid size={18} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={settingsLabel}>Mode</div>
              <div style={settingsDesc}>{modeDef.label}</div>
            </div>
            <Icon.Chevron size={16} style={{ color: "var(--muted)" }} />
          </button>

          {/* Tweaks row */}
          <button
            type="button"
            onClick={() => setTweaksOpen(true)}
            style={settingsRow}
          >
            <span style={settingsIcon("rose")}>
              <Icon.Sparkle size={18} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={settingsLabel}>Tweaks</div>
              <div style={settingsDesc}>Theme, density, dark mode</div>
            </div>
            <Icon.Chevron size={16} style={{ color: "var(--muted)" }} />
          </button>

          <div style={{ height: 1, background: "var(--line-soft)", margin: "10px 0 14px" }} />

          {visible.map((r) => {
            const IconComp = Icon[r.icon];
            return (
              <Link
                key={r.slug}
                href={r.href}
                onClick={() => onClose()}
                style={{
                  ...settingsRow,
                  textDecoration: "none",
                  color: "inherit",
                  background: primarySet.has(r.slug) ? "var(--caramel-soft)" : "transparent",
                }}
              >
                <span style={settingsIcon(primarySet.has(r.slug) ? "caramel" : "neutral")}>
                  <IconComp size={18} />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={settingsLabel}>{r.label}</div>
                  <div style={settingsDesc}>{r.desc}</div>
                </div>
                <Icon.Chevron size={16} style={{ color: "var(--muted)" }} />
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  margin: "16px 12px 6px",
                }}
              >
                Admin
              </div>
              {ADMIN_ROUTES.map((r) => {
                const IconComp = Icon[r.icon];
                return (
                  <Link
                    key={r.slug}
                    href={r.href}
                    onClick={() => onClose()}
                    style={{ ...settingsRow, textDecoration: "none", color: "inherit" }}
                  >
                    <span style={settingsIcon("plum")}>
                      <IconComp size={18} />
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={settingsLabel}>{r.label}</div>
                      <div style={settingsDesc}>{r.desc}</div>
                    </div>
                    <Icon.Chevron size={16} style={{ color: "var(--muted)" }} />
                  </Link>
                );
              })}
            </>
          )}

          <div style={{ height: 14 }} />

          {/* Sign-out row, shown only if a session exists — the layout already
              gates sign-in, so we always render this. */}
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              style={{
                ...settingsRow,
                width: "100%",
                color: "var(--danger)",
                cursor: "pointer",
                border: "none",
                background: "transparent",
              }}
            >
              <span style={settingsIcon("danger")}>
                <Icon.X size={18} />
              </span>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ ...settingsLabel, color: "var(--danger)" }}>Sign out</div>
                <div style={settingsDesc}>End this session</div>
              </div>
            </button>
          </form>
        </div>
      </Sheet>

      <ModePickerSheet open={modeOpen} onClose={() => setModeOpen(false)} />
      <TweaksSheet open={tweaksOpen} onClose={() => setTweaksOpen(false)} />
    </>
  );
}

const settingsRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 12px",
  borderRadius: "var(--r)",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  width: "100%",
  fontFamily: "inherit",
};

function settingsIcon(tone: "caramel" | "rose" | "sage" | "plum" | "neutral" | "danger"): React.CSSProperties {
  const palette: Record<string, { bg: string; fg: string }> = {
    caramel: { bg: "var(--caramel-soft)", fg: "var(--caramel-deep)" },
    rose: { bg: "var(--rose-soft)", fg: "oklch(0.38 0.10 25)" },
    sage: { bg: "var(--sage-soft)", fg: "oklch(0.34 0.07 145)" },
    plum: { bg: "oklch(0.93 0.04 340)", fg: "oklch(0.32 0.10 340)" },
    neutral: { bg: "var(--surface-3)", fg: "var(--ink-soft)" },
    danger: { bg: "oklch(0.94 0.05 28)", fg: "var(--danger)" },
  };
  const c = palette[tone];
  return {
    width: 36,
    height: 36,
    borderRadius: "var(--r)",
    background: c.bg,
    color: c.fg,
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
  };
}

const settingsLabel: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "var(--ink)",
};

const settingsDesc: React.CSSProperties = {
  fontSize: 11.5,
  color: "var(--muted)",
  marginTop: 2,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
