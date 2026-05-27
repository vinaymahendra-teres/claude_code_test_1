// UI primitives — Server Component-safe. Render-only, no event handlers.
// Ported from app/src/ui.jsx.

import type { CSSProperties, ReactNode } from "react";
import { statusColor, statusLabel, type OrderStatus } from "@/lib/status";
import { fmtMoney } from "@/lib/format";

// ---------- Card ----------

export function Card({
  children,
  padding = 16,
  style,
}: {
  children: ReactNode;
  padding?: number | string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line-soft)",
        borderRadius: "var(--r-lg)",
        padding,
        boxShadow: "var(--shadow-sm)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ---------- Pill / Tag ----------

type PillTone =
  | "neutral"
  | "caramel"
  | "rose"
  | "sage"
  | "warn"
  | "danger"
  | "ok";

export function Pill({
  children,
  tone = "neutral",
  size = "sm",
  style,
}: {
  children: ReactNode;
  tone?: PillTone;
  size?: "xs" | "sm";
  style?: CSSProperties;
}) {
  const tones: Record<PillTone, { bg: string; fg: string }> = {
    neutral: { bg: "var(--surface-3)", fg: "var(--ink-soft)" },
    caramel: { bg: "var(--caramel-soft)", fg: "var(--caramel-deep)" },
    rose: { bg: "var(--rose-soft)", fg: "oklch(0.38 0.10 25)" },
    sage: { bg: "var(--sage-soft)", fg: "oklch(0.34 0.07 145)" },
    warn: { bg: "oklch(0.95 0.07 80)", fg: "oklch(0.42 0.12 70)" },
    danger: { bg: "oklch(0.93 0.05 28)", fg: "var(--danger)" },
    ok: { bg: "var(--sage-soft)", fg: "oklch(0.34 0.07 145)" },
  };
  const t = tones[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: size === "xs" ? "2px 7px" : "3px 9px",
        fontSize: size === "xs" ? 10.5 : 11.5,
        fontWeight: 600,
        letterSpacing: "0.01em",
        color: t.fg,
        background: t.bg,
        borderRadius: 999,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// ---------- StatusPill ----------

export function StatusPill({
  status,
  dot = true,
}: {
  status: OrderStatus;
  dot?: boolean;
}) {
  const c = statusColor(status);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 9px 3px 8px",
        fontSize: 11.5,
        fontWeight: 600,
        background: c.bg,
        color: c.fg,
        borderRadius: 999,
      }}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: c.dot }} />}
      {statusLabel(status)}
    </span>
  );
}

// ---------- Avatar ----------

type AvatarTone = "caramel" | "rose" | "sage";

export function Avatar({
  name = "",
  tone = "caramel",
  size = 40,
  style,
}: {
  name?: string;
  tone?: AvatarTone;
  size?: number;
  style?: CSSProperties;
}) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
  const tones: Record<AvatarTone, { bg: string; fg: string }> = {
    caramel: { bg: "var(--caramel-soft)", fg: "var(--caramel-deep)" },
    rose: { bg: "var(--rose-soft)", fg: "oklch(0.38 0.10 25)" },
    sage: { bg: "var(--sage-soft)", fg: "oklch(0.34 0.07 145)" },
  };
  const t = tones[tone] || tones.caramel;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: 999,
        background: t.bg,
        color: t.fg,
        fontWeight: 700,
        fontSize: size * 0.36,
        flexShrink: 0,
        ...style,
      }}
    >
      {initials}
    </span>
  );
}

// ---------- CakeArt (image placeholder) ----------

type CakeTone = "caramel" | "rose" | "sage" | "plum";

export function CakeArt({
  tone = "caramel",
  size = 64,
  label,
  style,
}: {
  tone?: CakeTone;
  size?: number;
  label?: string;
  style?: CSSProperties;
}) {
  const tones: Record<CakeTone, [string, string]> = {
    caramel: ["oklch(0.93 0.045 70)", "oklch(0.78 0.10 55)"],
    rose: ["oklch(0.94 0.04 25)", "oklch(0.78 0.09 20)"],
    sage: ["oklch(0.94 0.03 145)", "oklch(0.78 0.07 140)"],
    plum: ["oklch(0.92 0.04 340)", "oklch(0.70 0.10 340)"],
  };
  const [c1, c2] = tones[tone] || tones.caramel;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 14,
        background: `repeating-linear-gradient(45deg, ${c1} 0, ${c1} 6px, ${c2} 6px, ${c2} 7px)`,
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          fontFamily: "var(--font-mono), JetBrains Mono, monospace",
          fontSize: Math.max(9, size * 0.13),
          color: "oklch(0.30 0.05 50 / 0.55)",
          textAlign: "center",
          padding: 4,
          lineHeight: 1.2,
        }}
      >
        {label || ""}
      </div>
    </div>
  );
}

// ---------- Section header ----------

export function SectionHeader({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        margin: "20px 4px 10px",
      }}
    >
      <h3
        style={{
          fontFamily: "var(--font-serif), DM Serif Display, serif",
          fontSize: 15,
          fontWeight: 400,
          margin: 0,
          color: "var(--ink)",
          letterSpacing: "0.005em",
          textTransform: "uppercase",
          opacity: 0.7,
        }}
      >
        {children}
      </h3>
      {action && <div style={{ fontSize: 12.5 }}>{action}</div>}
    </div>
  );
}

// ---------- Field (label + child wrapper) ----------

export function Field({
  label,
  hint,
  error,
  optional,
  children,
}: {
  label?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      {label && (
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: "var(--ink-soft)",
            marginBottom: 6,
            display: "flex",
            gap: 8,
            alignItems: "baseline",
          }}
        >
          <span>{label}</span>
          {optional && (
            <span style={{ fontSize: 11, fontWeight: 500, color: "var(--muted)" }}>optional</span>
          )}
        </div>
      )}
      {children}
      {hint && !error && (
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 5 }}>{hint}</div>
      )}
      {error && <div style={{ fontSize: 11.5, color: "var(--danger)", marginTop: 5 }}>{error}</div>}
    </label>
  );
}

// ---------- Bars (mini grouped bar chart) ----------
// Used by Books → Overview 6-month trend and Reports → Cash flow.

export function Bars({
  data,
  height = 60,
  color = "var(--caramel)",
  secondary = "var(--rose)",
}: {
  data: { in: number; out: number }[];
  height?: number;
  color?: string;
  secondary?: string;
}) {
  const max = Math.max(...data.map((d) => Math.max(d.in || 0, d.out || 0)));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height }}>
      {data.map((d, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "flex-end",
            gap: 2,
            height: "100%",
          }}
        >
          <div
            style={{
              flex: 1,
              background: color,
              borderRadius: 3,
              height: ((d.in / max) * 100) + "%",
              minHeight: 2,
            }}
          />
          <div
            style={{
              flex: 1,
              background: secondary,
              opacity: 0.7,
              borderRadius: 3,
              height: ((d.out / max) * 100) + "%",
              minHeight: 2,
            }}
          />
        </div>
      ))}
    </div>
  );
}

// ---------- StmtRow (statement row helper for Reports) ----------

export function StmtRow({
  label,
  value,
  bold,
  indent,
  divider,
}: {
  label: string;
  value: number | string;
  bold?: boolean;
  indent?: boolean;
  divider?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "8px 0",
        borderBottom: divider ? "1px solid var(--line-soft)" : "none",
        paddingLeft: indent ? 14 : 0,
      }}
    >
      <span
        style={{
          fontSize: bold ? 13.5 : 13,
          fontWeight: bold ? 700 : 400,
          color: bold ? "var(--ink)" : "var(--ink-soft)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: bold ? 14 : 13,
          fontWeight: bold ? 700 : 500,
          fontFamily: "var(--font-mono), JetBrains Mono, monospace",
          color: typeof value === "number" && value < 0 ? "var(--danger)" : "var(--ink)",
        }}
      >
        {typeof value === "number" ? fmtMoney(value) : value}
      </span>
    </div>
  );
}

// ---------- StatTile ----------

export function StatTile({
  label,
  value,
  tone = "caramel",
}: {
  label: string;
  value: string;
  tone?: "caramel" | "rose" | "sage";
}) {
  const tones = {
    caramel: "var(--caramel-soft)",
    rose: "var(--rose-soft)",
    sage: "var(--sage-soft)",
  };
  return (
    <div
      style={{
        flex: 1,
        background: tones[tone],
        borderRadius: "var(--r)",
        padding: "10px 12px",
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          color: "var(--ink-soft)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-serif), DM Serif Display, serif",
          fontSize: 22,
          marginTop: 4,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}
