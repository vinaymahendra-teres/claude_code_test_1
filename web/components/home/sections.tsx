"use client";

// Sections rendered inside the Home dashboard. Each component receives a
// `data` prop containing every pre-fetched dataset from the Server page;
// each section reads only the slice it needs. New sections plug in via the
// RENDERERS map in HomeDashboard.tsx.

import Link from "next/link";
import { Card, Pill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { fmtMoney, fmtCompactMoney, fmtDate, fmtRelative } from "@/lib/format";

export type HomeData = {
  weekRevenue: number;
  pendingBalance: number;
  todaysCount: number;
  activeCount: number;
  todayOrders: TomorrowOrder[];
  tomorrowOrders: TomorrowOrder[];
  lowStock: LowStockItem[];
  openLists: OpenList[];
  campaigns: CampaignRow[];
  newLeads: Lead[];
  reviewsDue: OrderDue[];
  complianceDue: ComplianceRow[];
  upcomingEvents: EventRow[];
  monthly: MonthlyRow | null;
  outstandingOrders: OutstandingOrder[];
};

type TomorrowOrder = {
  id: string;
  title: string | null;
  flavor: string | null;
  delivery_slot: string | null;
  delivery_date: string | null;
  price: number | null;
  status: string;
  customer_name: string | null;
};
type LowStockItem = { id: string; name: string; qty: number; unit: string | null; reorder_at: number };
type OpenList = { id: string; name: string; total: number; checked: number; cost: number };
type CampaignRow = { id: string; name: string; status: string; audience?: string };
type Lead = { id: string; name: string; area: string | null; since: string | null };
type OrderDue = { id: string; title: string | null; customer_name: string | null; delivery_date: string | null };
type ComplianceRow = { id: string; item: string; due_date: string; days: number };
type EventRow = { id: string; title: string; date: string; kind: "event" | "festival" | "compliance"; meta?: string };
type MonthlyRow = { month: string; income: number; expense: number; profit: number };
type OutstandingOrder = { id: string; title: string | null; customer_name: string | null; balance: number };

// ---------- Hero (this-week revenue) ----------

export function Hero({ data }: { data: HomeData }) {
  return (
    <div
      style={{
        marginTop: 20,
        borderRadius: 18,
        background: "linear-gradient(135deg, oklch(0.30 0.08 50), oklch(0.22 0.04 50))",
        color: "oklch(0.96 0.02 70)",
        padding: 0,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div style={{ padding: "18px 18px 16px" }}>
        <div style={{ fontSize: 11.5, opacity: 0.6, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          This week
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
          <span style={{ fontFamily: "DM Serif Display, serif", fontSize: 34, lineHeight: 1 }}>
            {fmtMoney(data.weekRevenue)}
          </span>
          <span style={{ fontSize: 13, opacity: 0.7 }}>booked</span>
        </div>
        <div style={{ display: "flex", gap: 18, marginTop: 14 }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>Pending balance</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>
              {fmtMoney(data.pendingBalance)}
            </div>
          </div>
          <div style={{ width: 1, background: "oklch(0.99 0.01 75 / 0.15)" }} />
          <div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>Today&apos;s bakes</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>
              {data.todaysCount} {data.todaysCount === 1 ? "cake" : "cakes"}
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          borderTop: "1px solid oklch(0.99 0.01 75 / 0.12)",
          padding: "10px 18px",
          fontSize: 12.5,
          opacity: 0.85,
        }}
      >
        {data.activeCount} active order{data.activeCount === 1 ? "" : "s"}
      </div>
    </div>
  );
}

// ---------- Today's bakes ----------

export function Today({ data }: { data: HomeData }) {
  if (data.todayOrders.length === 0) return null;
  return (
    <Section title="Today" actionHref="/bakes" actionLabel="See week">
      <Card padding={0}>
        {data.todayOrders.map((o, i, arr) => (
          <Link
            key={o.id}
            href={`/orders/${o.id}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "11px 14px",
              borderBottom: i < arr.length - 1 ? "1px solid var(--line-soft)" : "none",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div style={slotBadge}>{(o.delivery_slot ?? "").split(" ")[0] || "—"}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25 }}>{o.title}</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                {o.customer_name ?? "—"} · {o.flavor}
              </div>
            </div>
            <Icon.Chevron size={14} style={{ color: "var(--muted)" }} />
          </Link>
        ))}
      </Card>
    </Section>
  );
}

// ---------- Tomorrow ----------

export function Tomorrow({ data }: { data: HomeData }) {
  if (data.tomorrowOrders.length === 0) return null;
  return (
    <Section title="Tomorrow">
      <div
        style={{
          display: "flex",
          gap: 10,
          overflowX: "auto",
          margin: "0 -18px",
          padding: "0 18px 4px",
          scrollbarWidth: "none",
        }}
      >
        {data.tomorrowOrders.map((o) => (
          <Link
            key={o.id}
            href={`/orders/${o.id}`}
            style={{
              flexShrink: 0,
              width: 200,
              background: "var(--surface)",
              border: "1px solid var(--line-soft)",
              borderRadius: "var(--r-lg)",
              padding: 12,
              boxShadow: "var(--shadow-sm)",
              textDecoration: "none",
              color: "inherit",
              display: "block",
            }}
          >
            <div
              style={{
                height: 100,
                borderRadius: 12,
                background:
                  "repeating-linear-gradient(45deg, var(--caramel-soft) 0 8px, transparent 8px 16px), var(--surface-2)",
                marginBottom: 10,
                display: "grid",
                placeItems: "center",
                fontSize: 12,
                color: "var(--ink-soft)",
              }}
            >
              {o.flavor}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.3 }}>
              {o.customer_name ?? "—"}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
              {o.delivery_slot}
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}

// ---------- Low stock ----------

export function LowStock({ data }: { data: HomeData }) {
  if (data.lowStock.length === 0) return null;
  return (
    <Section title="Stock running low" actionHref="/inventory?tab=low" actionLabel="See all">
      <Link
        href="/inventory?tab=low"
        style={{
          display: "block",
          background: "var(--surface)",
          border: "1px solid var(--line-soft)",
          borderRadius: "var(--r-lg)",
          overflow: "hidden",
          textDecoration: "none",
          color: "inherit",
        }}
      >
        {data.lowStock.slice(0, 4).map((item, i, arr) => (
          <div
            key={item.id}
            style={{
              padding: "11px 14px",
              borderBottom: i < arr.length - 1 ? "1px solid var(--line-soft)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{item.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                {item.qty}
                {item.unit ?? ""} left · reorder at {item.reorder_at}
                {item.unit ?? ""}
              </div>
            </div>
            <Pill tone="warn" size="xs">Low</Pill>
          </div>
        ))}
      </Link>
    </Section>
  );
}

// ---------- Open shopping lists ----------

export function OpenLists({ data }: { data: HomeData }) {
  if (data.openLists.length === 0) return null;
  return (
    <Section title="Open shopping lists" actionHref="/shopping" actionLabel="See all">
      <Card padding={0}>
        {data.openLists.map((l, i, arr) => (
          <Link
            key={l.id}
            href={`/shopping/${l.id}`}
            style={{
              display: "block",
              padding: "12px 14px",
              borderBottom: i < arr.length - 1 ? "1px solid var(--line-soft)" : "none",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{l.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                  {l.checked}/{l.total} picked · {fmtMoney(l.cost)}
                </div>
              </div>
              <Icon.Chevron size={14} style={{ color: "var(--muted)" }} />
            </div>
          </Link>
        ))}
      </Card>
    </Section>
  );
}

// ---------- Marketing: running campaigns ----------

export function Campaigns({ data }: { data: HomeData }) {
  const live = data.campaigns.filter((c) => c.status === "live");
  if (live.length === 0 && data.campaigns.length === 0) return null;
  const shown = live.length > 0 ? live : data.campaigns.slice(0, 3);
  return (
    <Section
      title={live.length > 0 ? "Live campaigns" : "Campaign drafts"}
      actionHref="/marketing"
      actionLabel="Marketing"
    >
      <Card padding={0}>
        {shown.slice(0, 3).map((c, i, arr) => (
          <div
            key={c.id}
            style={{
              padding: "12px 14px",
              borderBottom: i < arr.length - 1 ? "1px solid var(--line-soft)" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.name}</div>
              <Pill size="xs" tone={c.status === "live" ? "ok" : "neutral"}>
                {c.status}
              </Pill>
            </div>
            {c.audience && (
              <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
                Audience: {c.audience}
              </div>
            )}
          </div>
        ))}
      </Card>
    </Section>
  );
}

// ---------- Marketing: leads (recent new customers) ----------

export function Leads({ data }: { data: HomeData }) {
  if (data.newLeads.length === 0) return null;
  return (
    <Section title="New leads" actionHref="/customers?sort=new" actionLabel="People">
      <Card padding={0}>
        {data.newLeads.map((l, i, arr) => (
          <Link
            key={l.id}
            href={`/customers/${l.id}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "11px 14px",
              borderBottom: i < arr.length - 1 ? "1px solid var(--line-soft)" : "none",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: 999,
                background: "var(--rose-soft)",
                color: "oklch(0.38 0.10 25)",
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
                fontSize: 12,
                flexShrink: 0,
              }}
            >
              {l.name
                .split(" ")
                .slice(0, 2)
                .map((s) => s[0])
                .join("")
                .toUpperCase()}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{l.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                {l.area ?? "—"} · joined {fmtRelative(l.since)}
              </div>
            </div>
            <Icon.Chevron size={14} style={{ color: "var(--muted)" }} />
          </Link>
        ))}
      </Card>
    </Section>
  );
}

// ---------- Marketing: reviews due (T+2) ----------

export function ReviewsDue({ data }: { data: HomeData }) {
  if (data.reviewsDue.length === 0) return null;
  return (
    <Section title="Reviews to chase" actionHref="/reviews" actionLabel="Reviews">
      <Card padding={0}>
        {data.reviewsDue.map((o, i, arr) => (
          <Link
            key={o.id}
            href={`/orders/${o.id}`}
            style={{
              display: "block",
              padding: "12px 14px",
              borderBottom: i < arr.length - 1 ? "1px solid var(--line-soft)" : "none",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{o.customer_name ?? "—"}</div>
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
              {o.title} · delivered {fmtRelative(o.delivery_date)}
            </div>
          </Link>
        ))}
      </Card>
    </Section>
  );
}

// ---------- Finance: compliance due ----------

export function ComplianceDue({ data }: { data: HomeData }) {
  if (data.complianceDue.length === 0) return null;
  return (
    <Section title="Compliance due" actionHref="/books?tab=tax" actionLabel="Books · Tax">
      <Card padding={0}>
        {data.complianceDue.map((c, i, arr) => {
          const tone: "danger" | "warn" | "caramel" =
            c.days < 0 ? "danger" : c.days <= 14 ? "warn" : "caramel";
          const label = c.days < 0 ? `${-c.days}d overdue` : `${c.days}d`;
          return (
            <div
              key={c.id}
              style={{
                padding: "12px 14px",
                borderBottom: i < arr.length - 1 ? "1px solid var(--line-soft)" : "none",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.item}</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                  due {fmtDate(c.due_date, { showYear: true })}
                </div>
              </div>
              <Pill tone={tone} size="xs">
                {label}
              </Pill>
            </div>
          );
        })}
      </Card>
    </Section>
  );
}

// ---------- Finance: monthly snapshot ----------

export function MonthlySnapshot({ data }: { data: HomeData }) {
  const m = data.monthly;
  if (!m) return null;
  return (
    <Section title="This month" actionHref="/books" actionLabel="Books">
      <Card padding={14}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          <Tile label="Income" value={fmtCompactMoney(m.income)} fg="var(--ok)" />
          <Tile label="Expense" value={fmtCompactMoney(m.expense)} fg="var(--rose)" />
          <Tile label="Profit" value={fmtCompactMoney(m.profit)} fg="var(--caramel-deep)" />
        </div>
      </Card>
    </Section>
  );
}

function Tile({ label, value, fg }: { label: string; value: string; fg: string }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: "var(--muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 18, color: fg, marginTop: 4 }}>
        {value}
      </div>
    </div>
  );
}

// ---------- Finance: outstanding ----------

export function Outstanding({ data }: { data: HomeData }) {
  if (data.outstandingOrders.length === 0) return null;
  const total = data.outstandingOrders.reduce((s, o) => s + o.balance, 0);
  return (
    <Section title="Outstanding balances" actionHref="/orders" actionLabel="Orders">
      <Card padding={0}>
        <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--line-soft)" }}>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>Total due</div>
          <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 22, color: "var(--danger)" }}>
            {fmtMoney(total)}
          </div>
        </div>
        {data.outstandingOrders.slice(0, 4).map((o, i, arr) => (
          <Link
            key={o.id}
            href={`/orders/${o.id}`}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 14px",
              borderBottom: i < arr.length - 1 ? "1px solid var(--line-soft)" : "none",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{o.customer_name ?? "—"}</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>{o.title}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--danger)" }}>
              {fmtMoney(o.balance)}
            </div>
          </Link>
        ))}
      </Card>
    </Section>
  );
}

// ---------- Upcoming events (festivals + compliance + calendar) ----------

export function UpcomingEvents({ data }: { data: HomeData }) {
  if (data.upcomingEvents.length === 0) return null;
  return (
    <Section title="Upcoming events" actionHref="/calendar" actionLabel="Calendar">
      <Card padding={0}>
        {data.upcomingEvents.map((e, i, arr) => (
          <div
            key={e.id}
            style={{
              padding: "10px 14px",
              borderBottom: i < arr.length - 1 ? "1px solid var(--line-soft)" : "none",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background:
                  e.kind === "festival"
                    ? "var(--caramel)"
                    : e.kind === "compliance"
                      ? "var(--rose)"
                      : "var(--sage)",
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{e.title}</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                {fmtDate(e.date, { showYear: true })}
                {e.meta ? ` · ${e.meta}` : ""}
              </div>
            </div>
          </div>
        ))}
      </Card>
    </Section>
  );
}

// ---------- Section shell ----------

function Section({
  title,
  children,
  actionHref,
  actionLabel,
}: {
  title: string;
  children: React.ReactNode;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          margin: "20px 4px 10px",
        }}
      >
        <h3
          style={{
            fontFamily: "DM Serif Display, serif",
            fontSize: 15,
            fontWeight: 400,
            margin: 0,
            color: "var(--ink)",
            letterSpacing: "0.005em",
            textTransform: "uppercase",
            opacity: 0.7,
          }}
        >
          {title}
        </h3>
        {actionHref && (
          <Link
            href={actionHref}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--caramel-deep)",
              textDecoration: "none",
            }}
          >
            {actionLabel ?? "Open"} →
          </Link>
        )}
      </div>
      {children}
    </>
  );
}

const slotBadge: React.CSSProperties = {
  width: 40,
  textAlign: "center",
  background: "var(--surface-3)",
  borderRadius: 10,
  padding: "5px 0",
  fontFamily: "DM Serif Display, serif",
  fontSize: 14,
  lineHeight: 1,
  flexShrink: 0,
};
