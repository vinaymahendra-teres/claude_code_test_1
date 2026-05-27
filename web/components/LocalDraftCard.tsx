"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CakeArt, Pill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { fmtMoney } from "@/lib/format";

// Matches the persisted shape in NewOrderForm. Kept loose because the
// hydration guard there already ignores stale shapes — anything we can't
// read here just renders as a generic "in progress" card.
type DraftForm = {
  customerId?: string | null;
  newCustomerName?: string;
  productLine?: string;
  title?: string;
  flavor?: string;
  size?: string;
  deliveryDate?: string;
  deliverySlot?: string;
  price?: string;
};

type Draft = { form?: DraftForm; step?: number };

const DRAFT_KEY = "tieredcake-new-order-draft-v1";
const STEPS = ["Customer", "Product", "Look", "Delivery", "Pricing", "Review"];

// Surfaces the in-flight NewOrderForm draft (auto-saved to localStorage by
// the wizard). Renders on /orders so Sh and S can see and resume a half-
// finished quote that lives on this device. Single-draft for now — the
// wizard only persists one at a time.
export function LocalDraftCard({ customerNameById = {} }: { customerNameById?: Record<string, string> }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [discarded, setDiscarded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Draft;
      // Treat a draft as "real" only if something meaningful is filled in.
      // Otherwise the empty initial-state save is just noise.
      const f = parsed?.form ?? {};
      const hasContent =
        !!f.title || !!f.flavor || !!f.size || !!f.customerId || !!f.newCustomerName || !!f.deliveryDate;
      if (hasContent) setDraft(parsed);
    } catch {
      /* corrupt draft — ignore */
    }
  }, []);

  if (!draft || discarded) return null;
  const f = draft.form ?? {};
  const step = draft.step ?? 0;
  const stepLabel = STEPS[step] ?? "In progress";
  const customer =
    f.customerId && customerNameById[f.customerId]
      ? customerNameById[f.customerId]
      : f.newCustomerName || "Unassigned customer";
  const priceN = parseFloat(f.price ?? "");
  const heading = f.title || `${f.flavor ?? "Untitled"}${f.size ? ` · ${f.size}` : ""}`;

  function discard() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    setDiscarded(true);
  }

  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          fontSize: 11.5,
          color: "var(--muted)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          margin: "0 0 6px 4px",
        }}
      >
        Auto-saved on this device
      </div>
      <Card padding={0}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px" }}>
          <CakeArt tone="caramel" size={44} label={(f.flavor ?? "draft").split(" ")[0]} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                lineHeight: 1.25,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {heading}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
              {customer}
              {f.productLine ? ` · ${f.productLine}` : ""}
              {isFinite(priceN) && priceN > 0 ? ` · ${fmtMoney(priceN)}` : ""}
            </div>
            <div style={{ marginTop: 5, display: "flex", gap: 6, alignItems: "center" }}>
              <Pill size="xs" tone="caramel">
                Step {step + 1}/{STEPS.length} · {stepLabel}
              </Pill>
              {f.deliveryDate && <Pill size="xs">{f.deliveryDate}</Pill>}
            </div>
          </div>
          <Link
            href="/orders/new"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "7px 12px",
              fontSize: 12.5,
              fontWeight: 600,
              background: "var(--caramel)",
              color: "var(--surface)",
              borderRadius: 999,
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            Resume <Icon.Chevron size={14} />
          </Link>
        </div>
        <button
          type="button"
          onClick={discard}
          style={{
            display: "block",
            width: "100%",
            padding: "8px 14px",
            borderTop: "1px solid var(--line-soft)",
            background: "transparent",
            color: "var(--muted)",
            fontSize: 11.5,
            fontFamily: "inherit",
            cursor: "pointer",
            border: "none",
            borderBottomLeftRadius: "var(--r)",
            borderBottomRightRadius: "var(--r)",
            textAlign: "left",
          }}
        >
          Discard draft
        </button>
      </Card>
    </div>
  );
}
