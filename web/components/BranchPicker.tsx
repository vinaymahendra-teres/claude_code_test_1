"use client";

// Compact branch picker used in customer + order forms. Reads the list from
// a server-fetched prop so the consumer can control freshness.

export type BranchOption = {
  id: string;
  label: string;
  community?: string;
  neighbourhood?: string;
};

export function BranchPicker({
  branches,
  value,
  onChange,
  size = "md",
  includeNone = false,
  noneLabel = "All branches",
}: {
  branches: BranchOption[];
  value: string | null;
  onChange: (id: string | null) => void;
  size?: "sm" | "md";
  includeNone?: boolean;
  noneLabel?: string;
}) {
  const opts: Array<{ id: string | null; label: string; sub?: string }> = [
    ...(includeNone ? [{ id: null, label: noneLabel }] : []),
    ...branches.map((b) => ({
      id: b.id,
      label: b.label,
      sub: b.neighbourhood,
    })),
  ];

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {opts.map((o) => {
        const sel = value === o.id;
        const padding = size === "sm" ? "5px 10px" : "7px 12px";
        const fontSize = size === "sm" ? 12 : 12.5;
        return (
          <button
            key={o.id ?? "__none__"}
            type="button"
            onClick={() => onChange(o.id)}
            style={{
              padding,
              fontSize,
              fontWeight: 600,
              borderRadius: 999,
              border: "1.5px solid " + (sel ? "var(--caramel)" : "var(--line)"),
              background: sel ? "var(--caramel)" : "var(--surface)",
              color: sel ? "var(--surface)" : "var(--ink-soft)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <span>{o.label}</span>
            {o.sub && size !== "sm" && (
              <span style={{ opacity: 0.75, marginLeft: 5 }}>· {o.sub}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
