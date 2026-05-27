import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { PhoneShell } from "@/components/PhoneShell";
import { Card, SectionHeader } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { fmtCompactMoney } from "@/lib/format";
import { InventoryItemSheet } from "./InventoryItemSheet";
import { AddInventoryButton } from "./AddInventoryButton";
import { getActiveBranchId } from "@/lib/branch-context";

export const revalidate = 60;

const TABS = [
  { value: "all", label: "All" },
  { value: "low", label: "Low" },
  { value: "premium", label: "Premium" },
];

type Item = {
  id: string;
  name: string;
  category: string;
  qty: number;
  unit: string;
  reorder_at: number;
  unit_cost: number;
  supplier: string | null;
  reorder_qty: number | null;
  days_cover_at_typical_use: number | null;
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const tab = TABS.some((t) => t.value === rawTab) ? rawTab! : "all";

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const activeBranch = await getActiveBranchId();

  let q = supabase
    .from("inventory_items")
    .select("id, name, category, qty, unit, reorder_at, unit_cost, supplier, reorder_qty, days_cover_at_typical_use, branch_id")
    .order("category", { ascending: true })
    .order("name", { ascending: true });
  if (activeBranch) q = q.eq("branch_id", activeBranch);
  const { data } = await q;

  const all = (data as Item[]) ?? [];
  const lowItems = all.filter((i) => Number(i.qty) < Number(i.reorder_at));
  const lowCount = lowItems.length;
  const totalValue = all.reduce((s, i) => s + Number(i.qty) * Number(i.unit_cost), 0);

  const list =
    tab === "low" ? lowItems : tab === "premium" ? all.filter((i) => i.category === "Premium") : all;

  // Group by category
  const groups = new Map<string, Item[]>();
  list.forEach((i) => {
    const g = groups.get(i.category) ?? [];
    g.push(i);
    groups.set(i.category, g);
  });

  return (
    <PhoneShell>
      <div data-screen-label="Inventory">
        <header style={chromeHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 32 }}>
            <Link href="/" style={chromeBtn} aria-label="Back">
              <Icon.ChevronLeft size={22} />
            </Link>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--font-serif), DM Serif Display, serif", fontSize: 21, lineHeight: 1.15 }}>
                Inventory
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                {all.length} items · {fmtCompactMoney(Math.round(totalValue))} value
              </div>
            </div>
            <AddInventoryButton />
          </div>
        </header>

        <div style={{ padding: "10px 18px 8px", borderBottom: "1px solid var(--line-soft)", background: "var(--bg)" }}>
          <TabRow current={tab} lowCount={lowCount} />
        </div>

        <div style={{ padding: "12px 18px 100px", overflowY: "auto", flex: 1, minHeight: 0 }}>
          {lowCount > 0 && tab !== "low" && (
            <Card
              style={{
                marginBottom: 14,
                background: "oklch(0.95 0.07 80)",
                border: "1px solid oklch(0.85 0.10 80)",
              }}
              padding={12}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Icon.Bell size={18} style={{ color: "oklch(0.42 0.12 70)", flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "oklch(0.32 0.12 70)" }}>
                    {lowCount} {lowCount === 1 ? "item" : "items"} below reorder
                  </div>
                  <div style={{ fontSize: 12, color: "oklch(0.38 0.10 70)", marginTop: 2 }}>
                    Group POs by vendor — see Low tab.
                  </div>
                </div>
                <Link
                  href="/inventory?tab=low"
                  style={{
                    background: "var(--caramel)",
                    color: "var(--surface)",
                    padding: "7px 12px",
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: "var(--r)",
                    textDecoration: "none",
                    border: "1px solid var(--caramel-deep)",
                  }}
                >
                  See
                </Link>
              </div>
            </Card>
          )}

          {Array.from(groups.entries()).map(([cat, items]) => (
            <div key={cat} style={{ marginBottom: 18 }}>
              <SectionHeader>{cat}</SectionHeader>
              <Card padding={0}>
                {items.map((item, i) => {
                  const low = Number(item.qty) < Number(item.reorder_at);
                  const pct = Math.min(100, (Number(item.qty) / (Number(item.reorder_at) * 2.5)) * 100);
                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: "11px 14px",
                        borderBottom: i < items.length - 1 ? "1px solid var(--line-soft)" : "none",
                      }}
                    >
                      <div style={{ width: "100%" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 6,
                          }}
                        >
                          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{item.name}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: low ? "var(--danger)" : "var(--ink)",
                                fontFamily: "var(--font-mono), JetBrains Mono, monospace",
                              }}
                            >
                              {item.qty}
                              {item.unit}
                            </div>
                            <InventoryItemSheet
                              item={{
                                id: item.id,
                                name: item.name,
                                category: item.category,
                                qty: Number(item.qty),
                                unit: item.unit,
                                reorder_at: Number(item.reorder_at),
                                unit_cost: Number(item.unit_cost),
                                supplier: item.supplier ?? "",
                                reorder_qty: Number(item.reorder_qty ?? 0),
                                days_cover_at_typical_use: item.days_cover_at_typical_use,
                              }}
                            />
                          </div>
                        </div>
                        <div
                          style={{
                            height: 4,
                            background: "var(--surface-3)",
                            borderRadius: 999,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: pct + "%",
                              height: "100%",
                              background: low ? "var(--danger)" : pct < 40 ? "var(--warn)" : "var(--ok)",
                              transition: "width .3s",
                            }}
                          />
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginTop: 6,
                            fontSize: 11,
                            color: "var(--muted)",
                          }}
                        >
                          <span>
                            reorder at {item.reorder_at}
                            {item.unit}
                            {item.days_cover_at_typical_use
                              ? ` · ~${item.days_cover_at_typical_use}d cover`
                              : ""}
                          </span>
                          <span>{item.supplier}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>
          ))}
        </div>
      </div>
    </PhoneShell>
  );
}

function TabRow({ current, lowCount }: { current: string; lowCount: number }) {
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
      {TABS.map((t) => {
        const active = current === t.value;
        const label = t.value === "low" ? `Low (${lowCount})` : t.label;
        return (
          <Link
            key={t.value}
            href={`/inventory?tab=${t.value}`}
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
            {label}
          </Link>
        );
      })}
    </div>
  );
}

const chromeHeader: React.CSSProperties = {
  position: "sticky",
  top: 0,
  background: "var(--bg)",
  padding: "54px 18px 14px",
  borderBottom: "1px solid var(--line-soft)",
  zIndex: 5,
};

const chromeBtn: React.CSSProperties = {
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
