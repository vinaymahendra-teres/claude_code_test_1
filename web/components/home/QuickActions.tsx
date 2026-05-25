"use client";

import Link from "next/link";
import { useAppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";

export function QuickActions() {
  const { modeDef } = useAppShell();
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 8,
        marginTop: 16,
      }}
    >
      {modeDef.home.actions.map((a) => {
        const IconComp =
          (Icon as Record<string, React.ComponentType<{ size?: number }>>)[a.icon] || Icon.Plus;
        return (
          <Link
            key={a.id + a.label}
            href={"/" + a.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              padding: "12px 6px",
              background: "var(--surface)",
              border: "1px solid var(--line-soft)",
              borderRadius: "var(--r-lg)",
              boxShadow: "var(--shadow-sm)",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "var(--caramel-soft)",
                color: "var(--caramel-deep)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <IconComp size={18} />
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 600, textAlign: "center" }}>{a.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
