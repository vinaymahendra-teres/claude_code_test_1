import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { PhoneShell } from "@/components/PhoneShell";
import { Card, Pill, SectionHeader } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { fmtMoney, fmtRelative } from "@/lib/format";
import { ListToolbar } from "./ListToolbar";
import { AddItemButton } from "./AddItemButton";
import { ItemRow } from "./ItemRow";

export const dynamic = "force-dynamic";

type ListRow = {
  id: string;
  name: string;
  status: "open" | "completed" | "archived";
  notes: string | null;
  created_at: string;
  completed_at: string | null;
  archived_at: string | null;
};

type ItemRowT = {
  id: string;
  list_id: string;
  item_name: string;
  qty: number | null;
  unit: string | null;
  supplier: string | null;
  estimated_cost: number;
  source: "manual" | "low-stock" | "order";
  inventory_item_id: string | null;
  checked: boolean;
  notes: string | null;
  created_at: string;
};

export default async function ShoppingListDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const [{ data: listRow }, { data: items }] = await Promise.all([
    supabase
      .from("shopping_lists")
      .select("id, name, status, notes, created_at, completed_at, archived_at")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("shopping_list_items")
      .select(
        "id, list_id, item_name, qty, unit, supplier, estimated_cost, source, inventory_item_id, checked, notes, created_at",
      )
      .eq("list_id", id)
      .order("checked", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  if (!listRow) notFound();
  const list = listRow as ListRow;
  const rows = (items as ItemRowT[] | null) ?? [];
  const totalCost = rows.reduce((s, r) => s + (r.estimated_cost ?? 0), 0);
  const remainingCost = rows
    .filter((r) => !r.checked)
    .reduce((s, r) => s + (r.estimated_cost ?? 0), 0);
  const checkedCount = rows.filter((r) => r.checked).length;

  // Group by supplier (treat null as "Unspecified")
  const grouped = new Map<string, ItemRowT[]>();
  for (const r of rows) {
    const key = r.supplier?.trim() || "Unspecified supplier";
    const arr = grouped.get(key) ?? [];
    arr.push(r);
    grouped.set(key, arr);
  }

  return (
    <PhoneShell>
      <div data-screen-label="Shopping list">
        <header style={chromeHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 32 }}>
            <Link href="/shopping" style={chromeBtn} aria-label="Back">
              <Icon.ChevronLeft size={22} />
            </Link>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "DM Serif Display, serif",
                  fontSize: 21,
                  lineHeight: 1.15,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {list.name}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                {rows.length} item{rows.length === 1 ? "" : "s"} ·{" "}
                {checkedCount}/{rows.length} picked · {fmtMoney(totalCost)}
              </div>
            </div>
            <AddItemButton listId={list.id} />
          </div>
        </header>

        <div style={{ padding: "12px 18px 100px", overflowY: "auto", flex: 1, minHeight: 0 }}>
          {/* Status + toolbar */}
          <Card
            padding={14}
            style={{
              background:
                list.status === "open"
                  ? "var(--caramel-soft)"
                  : list.status === "completed"
                    ? "var(--sage-soft)"
                    : "var(--surface-2)",
              border:
                "1px solid " +
                (list.status === "open"
                  ? "var(--caramel)"
                  : list.status === "completed"
                    ? "var(--sage)"
                    : "var(--line)"),
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
              <div>
                <div style={{ fontSize: 11.5, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-soft)" }}>
                  Status
                </div>
                <div
                  style={{
                    fontFamily: "DM Serif Display, serif",
                    fontSize: 18,
                    marginTop: 2,
                    textTransform: "capitalize",
                  }}
                >
                  {list.status}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                  {list.status === "completed"
                    ? `Completed ${fmtRelative(list.completed_at?.slice(0, 10) ?? null)}`
                    : list.status === "archived"
                      ? `Archived ${fmtRelative(list.archived_at?.slice(0, 10) ?? null)}`
                      : `Outstanding: ${fmtMoney(remainingCost)}`}
                </div>
              </div>
              <ListToolbar
                id={list.id}
                name={list.name}
                notes={list.notes ?? ""}
                status={list.status}
              />
            </div>
            {list.notes && (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 12.5,
                  color: "var(--ink-soft)",
                  lineHeight: 1.5,
                }}
              >
                {list.notes}
              </div>
            )}
          </Card>

          {rows.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 28, marginTop: 14 }}>
              <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 18, marginBottom: 6 }}>
                Empty list
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
                Tap the + button to add items, or refill from low stock / upcoming orders via the toolbar.
              </div>
            </Card>
          ) : (
            Array.from(grouped.entries()).map(([supplier, group]) => (
              <div key={supplier} style={{ marginTop: 16 }}>
                <SectionHeader>{supplier}</SectionHeader>
                <Card padding={0}>
                  {group.map((r, i) => (
                    <ItemRow key={r.id} item={r} last={i === group.length - 1} />
                  ))}
                </Card>
              </div>
            ))
          )}
        </div>
      </div>
    </PhoneShell>
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
