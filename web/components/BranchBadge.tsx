"use client";

// A compact "Active branch" badge meant to live in every screen's sticky
// header. Tapping it opens a picker that updates the global branch cookie
// (via Server Action) — every server-rendered list/dashboard then refreshes
// to the new branch's data on next navigation. The badge also persists the
// preference to localStorage so the indicator stays correct after a refresh
// even before the server has fed the cookie back.

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { setActiveBranch } from "@/lib/branch-cookie-actions";

const LOCAL_KEY = "tieredcake-branch-local";

export type BranchPick = {
  id: string;
  label: string;
  community?: string | null;
  neighbourhood?: string | null;
};

export function BranchBadge({
  branches,
  initial,
  compact = false,
}: {
  branches: BranchPick[];
  initial: string | null;
  compact?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState<string | null>(initial);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const wrapRef = useRef<HTMLDivElement>(null);

  // Sync local state from localStorage on mount (in case the cookie hasn't
  // round-tripped yet after a fresh login).
  useEffect(() => {
    try {
      const v = localStorage.getItem(LOCAL_KEY);
      if (v === "all") setActive(null);
      else if (v) setActive(v);
    } catch {
      /* ignore */
    }
  }, []);

  // Close on outside click + escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => document.addEventListener("mousedown", onClick), 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  function pick(id: string | null) {
    setActive(id);
    try {
      localStorage.setItem(LOCAL_KEY, id ?? "all");
    } catch {
      /* ignore */
    }
    startTransition(async () => {
      await setActiveBranch(id, pathname);
      setOpen(false);
      router.refresh();
    });
  }

  const activeBranch = active ? branches.find((b) => b.id === active) : null;
  const label = activeBranch ? activeBranch.label : "All branches";
  const tone = active ? "var(--caramel)" : "var(--ink-soft)";

  return (
    <div ref={wrapRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Active branch"
        aria-expanded={open}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: compact ? "3px 8px 3px 5px" : "4px 10px 4px 6px",
          borderRadius: 999,
          background: active ? "var(--caramel-soft)" : "var(--surface-2)",
          border: "1px solid " + (active ? "var(--caramel)" : "var(--line)"),
          color: active ? "var(--caramel-deep)" : "var(--ink-soft)",
          fontSize: compact ? 11 : 11.5,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "inherit",
          opacity: isPending ? 0.6 : 1,
        }}
      >
        <span
          style={{
            width: compact ? 14 : 16,
            height: compact ? 14 : 16,
            borderRadius: "50%",
            background: tone,
          }}
        />
        {compact
          ? active
            ? activeBranch?.community?.replace(/^Rajapushpa\s+/i, "") ?? label
            : "All"
          : label}
        <Icon.ChevronDown size={compact ? 10 : 12} />
      </button>

      {open && (
        <>
          <BackdropPortal onClick={() => setOpen(false)} />
          <div
            role="menu"
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              minWidth: 220,
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
            <PickRow
              label="All branches"
              sub="Show everything"
              selected={active === null}
              onClick={() => pick(null)}
            />
            {branches.map((b) => (
              <PickRow
                key={b.id}
                label={b.label}
                sub={b.neighbourhood ?? b.community ?? undefined}
                selected={active === b.id}
                onClick={() => pick(b.id)}
              />
            ))}
            <div
              style={{
                fontSize: 11,
                color: "var(--muted)",
                padding: "6px 10px 2px",
                lineHeight: 1.4,
              }}
            >
              Filters orders, customers, inventory, shopping, bakes and home.
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PickRow({
  label,
  sub,
  selected,
  onClick,
}: {
  label: string;
  sub?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "8px 10px",
        borderRadius: "var(--r)",
        background: selected ? "var(--caramel-soft)" : "transparent",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
      }}
    >
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontSize: 13,
            fontWeight: 600,
            color: selected ? "var(--caramel-deep)" : "var(--ink)",
          }}
        >
          {label}
        </span>
        {sub && (
          <span style={{ display: "block", fontSize: 11, color: "var(--muted)", marginTop: 1 }}>
            {sub}
          </span>
        )}
      </span>
      {selected && (
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: 999,
            background: "var(--caramel)",
            color: "var(--surface)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Icon.Check size={11} />
        </span>
      )}
    </button>
  );
}

function BackdropPortal({ onClick }: { onClick: () => void }) {
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
        background: "oklch(0.20 0.02 50 / 0.20)",
        zIndex: 340,
        animation: "fadeIn .12s",
      }}
    />,
    target,
  );
}
