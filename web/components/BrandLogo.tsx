// Single source of truth for the brand logo. Renders a styled circular
// mark that consumers can drop into headers, invoices, login, etc.
//
// Logo asset lives at /public/logo.jpg (referenced from globals.css too).
// next/image transcodes to WebP/AVIF + responsive srcset, which on a slow
// connection is the difference between a 50 KB and a 5 KB fetch.

import Image from "next/image";
import type { CSSProperties } from "react";

export function BrandLogo({
  size = 48,
  showWordmark = false,
  align = "row",
  style,
}: {
  size?: number;
  showWordmark?: boolean;
  align?: "row" | "column";
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: align,
        alignItems: "center",
        gap: align === "row" ? 10 : 6,
        ...style,
      }}
    >
      <Image
        src="/logo.jpg"
        alt="Tiered Cake Company"
        width={size}
        height={size}
        priority={size >= 64}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          background: "var(--surface)",
          boxShadow:
            "0 4px 14px oklch(0.40 0.12 50 / 0.18), inset 0 0 0 1px oklch(0.85 0.02 60 / 0.6)",
          flexShrink: 0,
        }}
      />
      {showWordmark && (
        <div
          style={{
            fontFamily: "var(--font-serif), DM Serif Display, serif",
            fontSize: Math.max(16, Math.round(size * 0.42)),
            color: "var(--ink)",
            lineHeight: 1.1,
            textAlign: align === "column" ? "center" : "left",
          }}
        >
          Tiered Cake Company
          <div
            style={{
              fontFamily: "inherit",
              fontSize: Math.max(10, Math.round(size * 0.22)),
              color: "var(--muted)",
              marginTop: 2,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Hyderabad
          </div>
        </div>
      )}
    </div>
  );
}
