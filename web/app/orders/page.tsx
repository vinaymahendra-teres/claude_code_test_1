import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { PhoneShell } from "@/components/PhoneShell";
import { Card, CakeArt, StatusPill, SectionHeader, Pill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { fmtMoney, fmtDate, fmtRelative } from "@/lib/format";

export const revalidate = 60;

const TAB_FILTERS: Record<string, (status: string) => boolean> = {
  active: (s) => s !== "delivered" && s !== "draft",
  delivered: (s) => s === "delivered",
  drafts: (s) => s === "draft",
};

type OrderRow = {
  id: string;
  customer_id: string | null;
  title: string | null;
  flavor: string | null;
  price: number | null;
  delivery_date: string | null;
  delivery_slot: string | null;
  delivery_area: string | null;
  status: string;
  customers:
    | { name: string | null; avatar_tone: string | null }
    | { name: string | null; avatar_tone: string | null }[]
    | null;
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const tab = (rawTab && TAB_FILTERS[rawTab]) ? rawTab : "active";

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, customer_id, title, flavor, price, delivery_date, delivery_slot, delivery_area, status, customers (name, avatar_tone)",
    )
    .order("delivery_date", { ascending: true });

  const filter = TAB_FILTERS[tab];
  const filtered = (orders ?? []).filter((o) => filter(o.status));
  const activeCount = (orders ?? []).filter((o) => TAB_FILTERS.active(o.status)).length;

  // Group by delivery_date
  const groups = new Map<string, OrderRow[]>();
  filtered.forEach((o) => {
    const key = o.delivery_date || "unscheduled";
    const list = groups.get(key) ?? [];
    list.push(o as OrderRow);
    groups.set(key, list);
  });

  return (
    <PhoneShell>
      <div data-screen-label="Orders">
        <header style={{ position: "sticky", top: 0, background: "var(--bg)", padding: "54px 18px 14px", borderBottom: "1px solid var(--line-soft)", zIndex: 5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 32 }}>
            <Link href="/" style={linkButton} aria-label="Back">
              <Icon.ChevronLeft size={22} />
            </Link>
            <div style={{ flex: 1, paddingLeft: 0 }}>
              <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 21, lineHeight: 1.15 }}>Orders</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                {activeCount} active
              </div>
            </div>
            <Link href="/orders/new" style={{ ...linkButton, background: "var(--caramel)", color: "var(--surface)", width: 34, height: 34 }} title="New order">
              <Icon.Plus size={20} />
            </Link>
          </div>
        </header>

        <div style={{ padding: "10px 18px 8px", borderBottom: "1px solid var(--line-soft)", background: "var(--bg)" }}>
          <SegmentedTabs current={tab} />
        </div>

        <div style={{ padding: "12px 18px 100px", overflowY: "auto", flex: 1, minHeight: 0 }}>
          {filtered.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 28 }}>
              <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 18, marginBottom: 6 }}>
                Nothing in {tab}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
                Switch to another tab or create a new order from Home.
              </div>
            </Card>
          ) : (
            Array.from(groups.entries()).map(([date, list]) => (
              <div key={date} style={{ marginBottom: 18 }}>
                <SectionHeader>
                  {date === "unscheduled" ? "Unscheduled" : (
                    <>
                      {fmtRelative(date)} · {fmtDate(date)}
                    </>
                  )}
                </SectionHeader>
                <Card padding={0}>
                  {list.map((o, i) => {
                    const cust = Array.isArray(o.customers) ? o.customers[0] : o.customers;
                    return (
                      <Link
                        key={o.id}
                        href={`/orders/${o.id}`}
                        style={{
                          display: "block",
                          padding: "11px 14px",
                          borderBottom: i < list.length - 1 ? "1px solid var(--line-soft)" : "none",
                          textDecoration: "none",
                          color: "inherit",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <CakeArt
                            tone={(cust?.avatar_tone as "caramel" | "rose" | "sage" | "plum") || "caramel"}
                            size={44}
                            label={(o.flavor ?? "").split(" ")[0]}
                          />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {o.title || `Order ${o.id}`}
                            </div>
                            <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
                              {cust?.name ?? "—"} · {o.flavor} · {fmtMoney(o.price ?? 0)}
                            </div>
                            <div style={{ marginTop: 5, display: "flex", gap: 6, alignItems: "center" }}>
                              <StatusPill status={o.status} dot={false} />
                              {o.delivery_slot && (
                                <Pill size="xs">{o.delivery_slot}</Pill>
                              )}
                            </div>
                          </div>
                          <Icon.Chevron size={16} style={{ color: "var(--muted)", flexShrink: 0 }} />
                        </div>
                      </Link>
                    );
                  })}
                </Card>
              </div>
            ))
          )}
        </div>
      </div>
    </PhoneShell>
  );
}

function SegmentedTabs({ current }: { current: string }) {
  const tabs = [
    { value: "active", label: "Active" },
    { value: "delivered", label: "Delivered" },
    { value: "drafts", label: "Drafts" },
  ];
  return (
    <div
      style={{
        display: "inline-flex",
        background: "var(--surface-3)",
        padding: 3,
        borderRadius: "var(--r)",
        gap: 2,
        width: "100%",
      }}
    >
      {tabs.map((t) => {
        const active = current === t.value;
        return (
          <Link
            key={t.value}
            href={`/orders?tab=${t.value}`}
            style={{
              flex: 1,
              padding: "7px 10px",
              fontSize: 13,
              fontWeight: 600,
              textAlign: "center",
              textDecoration: "none",
              borderRadius: "calc(var(--r) - 3px)",
              background: active ? "var(--surface)" : "transparent",
              color: active ? "var(--ink)" : "var(--ink-soft)",
              boxShadow: active ? "var(--shadow-sm)" : "none",
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

const linkButton: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 36,
  height: 36,
  borderRadius: 999,
  background: "transparent",
  color: "var(--ink)",
  textDecoration: "none",
};
