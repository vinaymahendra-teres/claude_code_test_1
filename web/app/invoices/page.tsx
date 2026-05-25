import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { PhoneShell } from "@/components/PhoneShell";
import { Card, Pill, StatTile } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { fmtMoney, fmtDate } from "@/lib/format";
import { getActiveBranchId } from "@/lib/branch-context";
import { listActiveBranches } from "@/lib/branches";

export const revalidate = 60;

const TABS = [
  { value: "all", label: "All" },
  { value: "issued", label: "Issued" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
];

type InvoiceRow = {
  id: string;
  number: string;
  branch_id: string;
  order_id: string | null;
  customer_id: string | null;
  status: "draft" | "issued" | "paid" | "cancelled" | "voided";
  issue_date: string;
  total: number;
  amount_paid: number;
  customer_snapshot: { name?: string } | null;
};

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const tab = TABS.some((t) => t.value === rawTab) ? rawTab! : "all";

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const activeBranch = await getActiveBranchId();
  const branches = await listActiveBranches();
  const branchById = new Map(branches.map((b) => [b.id, b]));

  let q = supabase
    .from("invoices")
    .select(
      "id, number, branch_id, order_id, customer_id, status, issue_date, total, amount_paid, customer_snapshot",
    )
    .order("created_at", { ascending: false });
  if (activeBranch) q = q.eq("branch_id", activeBranch);
  if (tab !== "all") q = q.eq("status", tab);

  const { data } = await q;
  const rows = (data as InvoiceRow[] | null) ?? [];

  const issuedCount = rows.filter((r) => r.status === "issued").length;
  const outstandingTotal = rows
    .filter((r) => r.status === "issued")
    .reduce((s, r) => s + (r.total - r.amount_paid), 0);
  const paidTotal = rows
    .filter((r) => r.status === "paid")
    .reduce((s, r) => s + r.total, 0);

  return (
    <PhoneShell>
      <div data-screen-label="Invoices">
        <header style={chromeHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 32 }}>
            <Link href="/" style={chromeBtn} aria-label="Back">
              <Icon.ChevronLeft size={22} />
            </Link>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 21, lineHeight: 1.15 }}>
                Invoices
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                {rows.length} {tab} · per-branch numbering
              </div>
            </div>
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
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <StatTile label="Issued" value={String(issuedCount)} tone="caramel" />
            <StatTile label="Outstanding" value={fmtMoney(outstandingTotal)} tone="rose" />
            <StatTile label="Paid (filter)" value={fmtMoney(paidTotal)} tone="sage" />
          </div>

          {rows.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 28 }}>
              <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 18, marginBottom: 6 }}>
                No invoices in this view
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
                Generate one from any order&rsquo;s detail page — the Billing card has a{" "}
                <em>Generate invoice</em> button.
              </div>
            </Card>
          ) : (
            <Card padding={0}>
              {rows.map((r, i) => {
                const branch = branchById.get(r.branch_id);
                const balance = Math.max(0, r.total - r.amount_paid);
                return (
                  <Link
                    key={r.id}
                    href={`/invoices/${r.id}`}
                    style={{
                      display: "block",
                      padding: "11px 14px",
                      borderBottom: i < rows.length - 1 ? "1px solid var(--line-soft)" : "none",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            flexWrap: "wrap",
                          }}
                        >
                          <span style={{ fontSize: 13.5, fontWeight: 700 }}>{r.number}</span>
                          <Pill
                            size="xs"
                            tone={
                              r.status === "paid"
                                ? "ok"
                                : r.status === "issued"
                                  ? "caramel"
                                  : "neutral"
                            }
                          >
                            {r.status}
                          </Pill>
                          {branch && (
                            <span style={{ fontSize: 11, color: "var(--muted)" }}>
                              {branch.community ?? branch.label}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>
                          {r.customer_snapshot?.name ?? "—"} · {fmtDate(r.issue_date, { showYear: true })}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{fmtMoney(r.total)}</div>
                        {balance > 0 && (
                          <div style={{ fontSize: 11, color: "var(--danger)", marginTop: 2 }}>
                            {fmtMoney(balance)} due
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </Card>
          )}

          <Card
            padding={12}
            style={{
              marginTop: 18,
              background: "var(--surface-2)",
              border: "1px dashed var(--line)",
            }}
          >
            <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55 }}>
              Invoices and receipts are issued from the order they belong to —{" "}
              <Link href="/orders" style={{ color: "var(--caramel-deep)", fontWeight: 600 }}>
                open an order
              </Link>{" "}
              and look for the Billing card. Numbering is per branch (ET-0001 from Eterna, PR-0001 from
              Provincia) and isolated even when the two branches collaborate.
            </div>
          </Card>
        </div>
      </div>
    </PhoneShell>
  );
}

function TabRow({ current }: { current: string }) {
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
        return (
          <Link
            key={t.value}
            href={`/invoices?tab=${t.value}`}
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
