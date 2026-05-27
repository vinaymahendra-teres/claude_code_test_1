import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { PhoneShell } from "@/components/PhoneShell";
import { Card, Pill, SectionHeader } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { fmtMoney, fmtRelative } from "@/lib/format";
import { NewListButton } from "./NewListButton";
import { getActiveBranchId } from "@/lib/branch-context";

export const revalidate = 30;

type ShoppingListRow = {
  id: string;
  name: string;
  status: "open" | "completed" | "archived";
  created_at: string;
  completed_at: string | null;
};

type ItemAgg = {
  list_id: string;
  total: number;
  checked: number;
  cost: number;
};

export default async function ShoppingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const tab = ["open", "completed", "archived"].includes(rawTab ?? "")
    ? (rawTab as "open" | "completed" | "archived")
    : "open";

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const activeBranch = await getActiveBranchId();

  let listsQ = supabase
    .from("shopping_lists")
    .select("id, name, status, created_at, completed_at, branch_id")
    .eq("status", tab)
    .order("created_at", { ascending: false });
  if (activeBranch) listsQ = listsQ.eq("branch_id", activeBranch);

  const [{ data: lists }, { data: items }] = await Promise.all([
    listsQ,
    supabase
      .from("shopping_list_items")
      .select("list_id, checked, estimated_cost"),
  ]);

  const rows = (lists as ShoppingListRow[] | null) ?? [];
  const aggMap = new Map<string, ItemAgg>();
  for (const it of (items as { list_id: string; checked: boolean; estimated_cost: number }[] | null) ?? []) {
    const agg = aggMap.get(it.list_id) ?? {
      list_id: it.list_id,
      total: 0,
      checked: 0,
      cost: 0,
    };
    agg.total += 1;
    if (it.checked) agg.checked += 1;
    agg.cost += it.estimated_cost ?? 0;
    aggMap.set(it.list_id, agg);
  }

  return (
    <PhoneShell>
      <div data-screen-label="Shopping">
        <header style={chromeHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 32 }}>
            <Link href="/" style={chromeBtn} aria-label="Back">
              <Icon.ChevronLeft size={22} />
            </Link>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--font-serif), DM Serif Display, serif", fontSize: 21, lineHeight: 1.15 }}>
                Shopping
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                {rows.length} {tab} {rows.length === 1 ? "list" : "lists"}
              </div>
            </div>
            <NewListButton />
          </div>
        </header>

        <div
          style={{
            padding: "10px 18px 8px",
            borderBottom: "1px solid var(--line-soft)",
            background: "var(--bg)",
          }}
        >
          <TabRow current={tab} />
        </div>

        <div style={{ padding: "12px 18px 100px", overflowY: "auto", flex: 1, minHeight: 0 }}>
          {rows.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 28 }}>
              <div style={{ fontFamily: "var(--font-serif), DM Serif Display, serif", fontSize: 18, marginBottom: 6 }}>
                Nothing {tab}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
                {tab === "open"
                  ? "Tap + to start a new shopping list — auto-fill from low stock or upcoming orders."
                  : "Lists you've completed or archived will show up here."}
              </div>
            </Card>
          ) : (
            <Card padding={0}>
              {rows.map((l, i) => {
                const agg = aggMap.get(l.id) ?? { total: 0, checked: 0, cost: 0 };
                const pct = agg.total === 0 ? 0 : Math.round((agg.checked / agg.total) * 100);
                return (
                  <Link
                    key={l.id}
                    href={`/shopping/${l.id}`}
                    style={{
                      display: "block",
                      padding: "12px 14px",
                      borderBottom: i < rows.length - 1 ? "1px solid var(--line-soft)" : "none",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{l.name}</div>
                        <div
                          style={{
                            fontSize: 11.5,
                            color: "var(--muted)",
                            marginTop: 2,
                          }}
                        >
                          {agg.total} item{agg.total === 1 ? "" : "s"} · {agg.checked}/{agg.total}{" "}
                          picked · {fmtMoney(agg.cost)}
                          {l.completed_at
                            ? ` · done ${fmtRelative(l.completed_at.slice(0, 10))}`
                            : ` · started ${fmtRelative(l.created_at.slice(0, 10))}`}
                        </div>
                      </div>
                      <Pill
                        size="xs"
                        tone={l.status === "open" ? "caramel" : l.status === "completed" ? "ok" : "neutral"}
                      >
                        {l.status === "open" ? `${pct}%` : l.status}
                      </Pill>
                    </div>
                    {agg.total > 0 && (
                      <div
                        style={{
                          marginTop: 8,
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
                            background: pct === 100 ? "var(--ok)" : "var(--caramel)",
                            transition: "width .3s",
                          }}
                        />
                      </div>
                    )}
                  </Link>
                );
              })}
            </Card>
          )}

          <SectionHeader>How auto-fill works</SectionHeader>
          <Card padding={14} style={{ background: "var(--surface-2)", border: "1px dashed var(--line)" }}>
            <div style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.55 }}>
              <strong>Low stock</strong> pulls every inventory item below its reorder point — quantity defaults
              to the configured reorder quantity. <strong>Upcoming orders</strong> walks orders within the
              horizon you set, finds the recipe by flavor, and surfaces ingredients (via their stockKey) for
              items the kitchen is projected short on.
              <br />
              Need to change thresholds? Tap any item on the{" "}
              <Link href="/inventory" style={{ color: "var(--caramel-deep)", fontWeight: 600 }}>
                Inventory
              </Link>{" "}
              screen.
            </div>
          </Card>
        </div>
      </div>
    </PhoneShell>
  );
}

function TabRow({ current }: { current: string }) {
  const tabs = [
    { value: "open", label: "Open" },
    { value: "completed", label: "Completed" },
    { value: "archived", label: "Archived" },
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
            href={`/shopping?tab=${t.value}`}
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
