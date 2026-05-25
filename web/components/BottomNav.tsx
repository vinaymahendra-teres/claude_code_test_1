"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAppShell, MODES } from "./AppShell";
import { Icon } from "./Icon";
import { MoreSheet } from "./sheets/MoreSheet";

// Map nav slugs to {href, label, IconComponent}
const NAV_DEFS: Record<
  string,
  { href: string; label: string; icon: keyof typeof Icon }
> = {
  home: { href: "/", label: "Home", icon: "Home" },
  orders: { href: "/orders", label: "Orders", icon: "Receipt" },
  customers: { href: "/customers", label: "People", icon: "Users" },
  recipes: { href: "/recipes", label: "Recipes", icon: "Cake" },
  inventory: { href: "/inventory", label: "Stock", icon: "Box" },
  bakes: { href: "/bakes", label: "Bakes", icon: "Calendar" },
  kitchen: { href: "/kitchen", label: "Kitchen", icon: "Clock" },
  marketing: { href: "/marketing", label: "Marketing", icon: "Megaphone" },
  books: { href: "/books", label: "Books", icon: "Wallet" },
  reports: { href: "/reports", label: "Reports", icon: "Doc" },
  reviews: { href: "/reviews", label: "Reviews", icon: "Mail" },
  tools: { href: "/tools", label: "Tools", icon: "Sparkle" },
};

const NAV_SCREEN_ROUTES = new Set([
  "/",
  "/orders",
  "/customers",
  "/recipes",
  "/inventory",
  "/bakes",
  "/kitchen",
  "/marketing",
  "/books",
  "/reports",
  "/reviews",
  "/tools",
]);

export function BottomNav() {
  const { modeDef } = useAppShell();
  const pathname = usePathname() || "/";
  const [moreOpen, setMoreOpen] = useState(false);

  // Hide the bottom nav on detail / flow screens (anything not in nav-list above)
  // and on /login (which has no shell).
  if (pathname === "/login") return null;
  if (!NAV_SCREEN_ROUTES.has(pathname)) return null;

  return (
    <>
      <nav style={navWrap}>
        {modeDef.nav.map((slug) => {
          if (slug === "more") {
            return (
              <button
                key="more"
                type="button"
                onClick={() => setMoreOpen(true)}
                style={tabBtn(false)}
              >
                <Icon.Grid size={20} />
                <span style={tabLabel}>More</span>
              </button>
            );
          }
          const def = NAV_DEFS[slug];
          if (!def) return null;
          const IconComp = Icon[def.icon];
          const active = pathname === def.href;
          return (
            <Link key={slug} href={def.href} style={tabBtn(active)}>
              <IconComp size={20} />
              <span style={tabLabel}>{def.label}</span>
            </Link>
          );
        })}
      </nav>
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}

const navWrap: React.CSSProperties = {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  display: "flex",
  background: "var(--bg)",
  borderTop: "1px solid var(--line-soft)",
  padding: "8px 4px 16px",
  zIndex: 10,
  fontFamily: "inherit",
};

function tabBtn(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    padding: "6px 0 4px",
    background: "transparent",
    border: "none",
    color: active ? "var(--caramel-deep)" : "var(--muted)",
    cursor: "pointer",
    textDecoration: "none",
    fontFamily: "inherit",
  };
}

const tabLabel: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 600,
};

export { MODES };
