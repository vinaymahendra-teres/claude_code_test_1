// PhoneShell — the desktop-frame-with-phone-mockup chrome.
// Renders side panels + the iPhone-styled inner viewport. Screen content goes
// in `children`. Pages can override the side-panel copy via props.

import Link from "next/link";
import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function PhoneShell({
  children,
  leftPanel,
  rightPanel,
}: {
  children: ReactNode;
  leftPanel?: ReactNode;
  rightPanel?: ReactNode;
}) {
  return (
    <div className="desktop">
      <aside className="side side-l">
        {leftPanel ?? <DefaultLeftPanel />}
      </aside>

      <main className="phone" data-screen-label="Phone preview">
        <div className="notch" />
        <div className="status-bar">
          <span>9:41</span>
        </div>
        <div className="app-root">
          {children}
          <BottomNav />
        </div>
        <div className="home-indicator" />
      </main>

      <aside className="side side-r">
        {rightPanel ?? <DefaultRightPanel />}
      </aside>
    </div>
  );
}

function DefaultLeftPanel() {
  return (
    <>
      <div className="brandmark" style={{ justifyContent: "flex-end" }}>
        <span>Tiered Cake Co.</span>
        <span className="logo" aria-hidden="true" />
      </div>
      <p style={{ fontSize: 13 }}>
        All-in-one workspace for the small custom-cake business — built phone-first so it lives
        where the orders come from: in your hand, between piping bags.
      </p>
      <h2>Modules</h2>
      <p>
        <Link href="/" style={{ color: "var(--ink-soft)", textDecoration: "none" }}>Home</Link> ·{" "}
        <Link href="/orders" style={{ color: "var(--ink-soft)", textDecoration: "none" }}>Orders</Link> ·{" "}
        Bakes · People · Books · Reports
      </p>
    </>
  );
}

function DefaultRightPanel() {
  return (
    <>
      <div className="brandmark">
        <span className="logo" aria-hidden="true" />
        <span>Hyderabad</span>
      </div>
      <p style={{ fontSize: 13 }}>
        Next.js + Supabase edition. Live data served from Postgres on every request.
      </p>
      <h2>Migration status</h2>
      <p style={{ fontSize: 12.5, lineHeight: 1.5 }}>
        Home and Orders are ported as Server Components. The rest of the screens are queued — see{" "}
        <code>web/MIGRATION-STATUS.md</code>.
      </p>
    </>
  );
}
