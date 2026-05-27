import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { PhoneShell } from "@/components/PhoneShell";
import { Card, SectionHeader, Bars, StmtRow } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { fmtMoney } from "@/lib/format";

export const revalidate = 60;

const TABS = [
  { value: "pl", label: "P & L" },
  { value: "bs", label: "Balance" },
  { value: "cf", label: "Cash flow" },
];

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const tab = TABS.some((t) => t.value === rawTab) ? rawTab! : "pl";

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Load common datasets up front — small tables, single round-trip is fine.
  const [{ data: orders }, { data: recipes }, { data: expenses }, { data: monthly }, { data: inventory }] =
    await Promise.all([
      supabase.from("orders").select("id, flavor, price, status, delivery_date, balance"),
      supabase.from("recipes").select("id, name, category, cost_per_cake"),
      supabase
        .from("expenses")
        .select("id, date, vendor, category, amount, method, account_debited"),
      supabase
        .from("monthly_summary")
        .select("month, income, expense, profit")
        .order("month", { ascending: false }),
      supabase.from("inventory_items").select("qty, unit_cost"),
    ]);

  return (
    <PhoneShell>
      <div data-screen-label="Reports">
        <header style={chromeHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 32 }}>
            <Link href="/" style={chromeBtn} aria-label="Back">
              <Icon.ChevronLeft size={22} />
            </Link>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--font-serif), DM Serif Display, serif", fontSize: 21, lineHeight: 1.15 }}>
                Reports
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                P&amp;L · Balance Sheet · Cash Flow
              </div>
            </div>
          </div>
        </header>

        <div style={{ padding: "10px 18px 8px", borderBottom: "1px solid var(--line-soft)", background: "var(--bg)" }}>
          <TabRow current={tab} />
        </div>

        <div style={{ padding: "14px 18px 100px", overflowY: "auto", flex: 1, minHeight: 0 }}>
          {tab === "pl" && (
            <ProfitLoss
              orders={orders ?? []}
              recipes={recipes ?? []}
              expenses={expenses ?? []}
            />
          )}
          {tab === "bs" && (
            <BalanceSheet orders={orders ?? []} inventory={inventory ?? []} />
          )}
          {tab === "cf" && (
            <CashFlow expenses={expenses ?? []} monthly={monthly ?? []} />
          )}
        </div>
      </div>
    </PhoneShell>
  );
}

// ---------- Tab 1 — P&L by product category ----------

function ProfitLoss({
  orders,
  recipes,
  expenses,
}: {
  orders: { id: string; flavor: string | null; price: number | null; status: string }[];
  recipes: { id: string; name: string; category: string | null; cost_per_cake: number | null }[];
  expenses: { category: string; amount: number }[];
}) {
  const recipeByFlavor = (flavor: string | null) => {
    if (!flavor) return null;
    const key = flavor.toLowerCase();
    return recipes.find((r) => key.includes(r.name.toLowerCase())) ?? null;
  };

  const cats: Record<string, { units: number; revenue: number; cogs: number }> = {};
  orders.forEach((o) => {
    if (o.status === "draft" || !o.price) return;
    const r = recipeByFlavor(o.flavor);
    const cat = r?.category || "Other";
    const cogs = r ? r.cost_per_cake ?? 0 : Math.round((o.price ?? 0) * 0.18);
    if (!cats[cat]) cats[cat] = { units: 0, revenue: 0, cogs: 0 };
    cats[cat].units += 1;
    cats[cat].revenue += o.price ?? 0;
    cats[cat].cogs += cogs;
  });

  const rows = Object.entries(cats)
    .map(([cat, v]) => ({
      cat,
      ...v,
      gross: v.revenue - v.cogs,
      marginPct: v.revenue ? ((v.revenue - v.cogs) / v.revenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalCogs = rows.reduce((s, r) => s + r.cogs, 0);
  const totalGross = totalRevenue - totalCogs;

  // Operating expenses — everything except ingredients (already in COGS)
  const opex: Record<string, number> = {};
  expenses.forEach((e) => {
    if (e.category === "Ingredients") return;
    opex[e.category] = (opex[e.category] || 0) + e.amount;
  });
  const opexRows = Object.entries(opex).sort((a, b) => b[1] - a[1]);
  const totalOpex = opexRows.reduce((s, [, v]) => s + v, 0);

  const netProfit = totalGross - totalOpex;

  return (
    <div>
      <Card
        padding={0}
        style={{
          background: "linear-gradient(135deg, oklch(0.30 0.08 50), oklch(0.22 0.04 50))",
          color: "oklch(0.96 0.02 70)",
          border: "none",
        }}
      >
        <div style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 11.5, opacity: 0.6, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Profit &amp; Loss · YTD FY26
          </div>
          <div style={{ fontFamily: "var(--font-serif), DM Serif Display, serif", fontSize: 34, marginTop: 4, lineHeight: 1 }}>
            {fmtMoney(netProfit)}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>net profit before tax · 1 Apr – 24 May 2026</div>
        </div>
      </Card>

      <Card padding={14} style={{ marginTop: 14 }}>
        <SectionLabel>Revenue by product category</SectionLabel>
        {rows.map((r, i) => (
          <div key={r.cat}>
            <StmtRow
              label={`${r.cat} (${r.units} order${r.units === 1 ? "" : "s"})`}
              value={r.revenue}
              divider={false}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: "var(--muted)",
                paddingLeft: 14,
                marginTop: -4,
                marginBottom: 6,
              }}
            >
              <span>less ingredient COGS</span>
              <span style={{ fontFamily: "var(--font-mono), JetBrains Mono, monospace" }}>−{fmtMoney(r.cogs)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12.5,
                paddingLeft: 14,
                paddingBottom: 8,
                borderBottom: i < rows.length - 1 ? "1px solid var(--line-soft)" : "none",
              }}
            >
              <span style={{ color: "var(--ink-soft)" }}>Gross margin</span>
              <span style={{ fontWeight: 600, fontFamily: "var(--font-mono), JetBrains Mono, monospace" }}>
                {fmtMoney(r.gross)}{" "}
                <span style={{ color: "var(--muted)", fontWeight: 400 }}>· {r.marginPct.toFixed(0)}%</span>
              </span>
            </div>
          </div>
        ))}
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "2px solid var(--ink)" }}>
          <StmtRow label="Total gross margin" value={totalGross} bold divider={false} />
        </div>
      </Card>

      <Card padding={14} style={{ marginTop: 14 }}>
        <SectionLabel>Operating expenses</SectionLabel>
        {opexRows.map(([cat, amt], i) => (
          <StmtRow key={cat} label={cat} value={-amt} divider={i < opexRows.length - 1} />
        ))}
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "2px solid var(--ink)" }}>
          <StmtRow label="Total operating expenses" value={-totalOpex} bold divider={false} />
        </div>
      </Card>

      <Card
        padding={14}
        style={{
          marginTop: 14,
          background: netProfit >= 0 ? "var(--sage-soft)" : "var(--rose-soft)",
          border: "1px solid " + (netProfit >= 0 ? "var(--sage)" : "var(--rose)"),
        }}
      >
        <StmtRow label="Net profit before tax" value={netProfit} bold divider={false} />
      </Card>

      <div style={{ fontSize: 11, color: "var(--muted)", padding: "14px 4px 0", lineHeight: 1.5 }}>
        COGS based on each recipe&apos;s ingredient cost per cake. Operating expenses pulled from logged transactions. Tax not yet computed.
      </div>
    </div>
  );
}

// ---------- Tab 2 — Balance Sheet ----------

function BalanceSheet({
  orders,
  inventory,
}: {
  orders: { status: string; balance: number | null }[];
  inventory: { qty: number; unit_cost: number }[];
}) {
  const receivables = orders
    .filter((o) => o.status !== "delivered" && o.status !== "draft")
    .reduce((s, o) => s + (o.balance ?? 0), 0);
  const inventoryValue = inventory.reduce((s, i) => s + Number(i.qty) * Number(i.unit_cost), 0);

  // Manually-maintained baselines (see Reports doc note at bottom)
  const cashOnHand = 8400;
  const bankBalance = 134800;
  const equipmentNet = 285000;
  const gstPayable = 4280;
  const vendorPayables = 6240;
  const ownerCapital = 200000;

  const totalCurrentAssets = cashOnHand + bankBalance + receivables + inventoryValue;
  const totalAssets = totalCurrentAssets + equipmentNet;
  const totalLiabilities = gstPayable + vendorPayables;
  const retainedEarnings = totalAssets - totalLiabilities - ownerCapital;
  const totalEquity = ownerCapital + retainedEarnings;
  const totalLiabAndEquity = totalLiabilities + totalEquity;

  return (
    <div>
      <Card
        padding={0}
        style={{
          background: "linear-gradient(135deg, oklch(0.30 0.08 50), oklch(0.22 0.04 50))",
          color: "oklch(0.96 0.02 70)",
          border: "none",
        }}
      >
        <div style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 11.5, opacity: 0.6, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Balance Sheet · as of 24 May 2026
          </div>
          <div style={{ fontFamily: "var(--font-serif), DM Serif Display, serif", fontSize: 34, marginTop: 4, lineHeight: 1 }}>
            {fmtMoney(totalEquity)}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>net worth · book value</div>
        </div>
      </Card>

      <Card padding={14} style={{ marginTop: 14 }}>
        <SectionLabel>Assets</SectionLabel>
        <SubLabel>Current</SubLabel>
        <StmtRow label="Cash on hand" value={cashOnHand} indent divider />
        <StmtRow label="Bank balance" value={bankBalance} indent divider />
        <StmtRow label="Accounts receivable" value={receivables} indent divider />
        <StmtRow label="Inventory at cost" value={Math.round(inventoryValue)} indent divider />
        <StmtRow label="Total current assets" value={Math.round(totalCurrentAssets)} bold divider={false} />

        <SubLabel>Fixed</SubLabel>
        <StmtRow label="Equipment (net of depreciation)" value={equipmentNet} indent divider={false} />

        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "2px solid var(--ink)" }}>
          <StmtRow label="Total assets" value={Math.round(totalAssets)} bold divider={false} />
        </div>
      </Card>

      <Card padding={14} style={{ marginTop: 14 }}>
        <SectionLabel>Liabilities &amp; equity</SectionLabel>
        <SubLabel>Liabilities</SubLabel>
        <StmtRow label="GST payable (output)" value={gstPayable} indent divider />
        <StmtRow label="Vendor payables" value={vendorPayables} indent divider={false} />

        <SubLabel>Equity</SubLabel>
        <StmtRow label="Owner's capital" value={ownerCapital} indent divider />
        <StmtRow label="Retained earnings" value={Math.round(retainedEarnings)} indent divider={false} />

        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "2px solid var(--ink)" }}>
          <StmtRow
            label="Total liabilities &amp; equity"
            value={Math.round(totalLiabAndEquity)}
            bold
            divider={false}
          />
        </div>
      </Card>

      <div style={{ fontSize: 11, color: "var(--muted)", padding: "14px 4px 0", lineHeight: 1.5 }}>
        Receivables and inventory are live. Cash, bank, equipment value, and owner&apos;s capital are maintained manually under Settings.
      </div>
    </div>
  );
}

// ---------- Tab 3 — Cash Flow ----------

function CashFlow({
  expenses,
  monthly,
}: {
  expenses: { date: string; category: string; amount: number }[];
  monthly: { month: string; income: number; expense: number; profit: number }[];
}) {
  const trend = monthly.slice().reverse();
  const ytdInflow = monthly.filter((m) => m.month >= "2026-04").reduce((s, m) => s + m.income, 0);

  const INVESTING = new Set(["Software"]);
  let opOut = 0;
  let invOut = 0;
  expenses
    .filter((e) => e.date >= "2026-04-01")
    .forEach((e) => {
      if (INVESTING.has(e.category)) invOut += e.amount;
      else opOut += e.amount;
    });
  const opIn = ytdInflow;
  const netOp = opIn - opOut;
  const netInv = -invOut;
  const netFin = 0;
  const netChange = netOp + netInv + netFin;
  const openingCash = 137125;
  const closingCash = openingCash + netChange;

  // Runway flag — same thresholds as the prototype's RunwayBadge
  let runwayLabel: string;
  let runwayBg: string;
  let runwayFg: string;
  let runwayBorder: string;
  if (closingCash < 10000) {
    runwayLabel = "Below buffer";
    runwayBg = "oklch(0.94 0.05 28)";
    runwayFg = "var(--danger)";
    runwayBorder = "var(--danger)";
  } else if (closingCash < 25000) {
    runwayLabel = "Tight";
    runwayBg = "oklch(0.95 0.07 80)";
    runwayFg = "oklch(0.42 0.12 70)";
    runwayBorder = "oklch(0.82 0.12 80)";
  } else {
    runwayLabel = "OK";
    runwayBg = "var(--sage-soft)";
    runwayFg = "oklch(0.34 0.07 145)";
    runwayBorder = "var(--sage)";
  }

  return (
    <div>
      <Card
        padding={0}
        style={{
          background: "linear-gradient(135deg, oklch(0.30 0.08 50), oklch(0.22 0.04 50))",
          color: "oklch(0.96 0.02 70)",
          border: "none",
        }}
      >
        <div style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 11.5, opacity: 0.6, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Net change in cash · YTD FY26
          </div>
          <div style={{ fontFamily: "var(--font-serif), DM Serif Display, serif", fontSize: 34, marginTop: 4, lineHeight: 1 }}>
            {netChange >= 0 ? "+" : ""}
            {fmtMoney(netChange)}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>1 Apr – 24 May 2026</div>
        </div>
        <div style={{ height: 90, padding: "0 18px 14px" }}>
          <Bars
            data={trend.map((m) => ({ in: m.income, out: m.expense }))}
            height={70}
            color="oklch(0.85 0.10 60)"
            secondary="oklch(0.65 0.10 25)"
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 6,
              fontSize: 10,
              opacity: 0.6,
            }}
          >
            {trend.map((m) => (
              <span key={m.month}>{m.month.slice(5)}</span>
            ))}
          </div>
        </div>
      </Card>

      <Card padding={14} style={{ marginTop: 14 }}>
        <SectionLabel>Operating activities</SectionLabel>
        <StmtRow label="Cash from customers" value={opIn} divider />
        <StmtRow label="Cash to vendors &amp; operations" value={-opOut} divider={false} />
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "2px solid var(--ink)" }}>
          <StmtRow label="Net cash from operations" value={netOp} bold divider={false} />
        </div>
      </Card>

      <Card padding={14} style={{ marginTop: 14 }}>
        <SectionLabel>Investing activities</SectionLabel>
        <StmtRow label="Software &amp; subscriptions" value={-invOut} divider={false} />
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "2px solid var(--ink)" }}>
          <StmtRow label="Net cash from investing" value={netInv} bold divider={false} />
        </div>
      </Card>

      <Card padding={14} style={{ marginTop: 14 }}>
        <SectionLabel>Financing activities</SectionLabel>
        <StmtRow label="Owner's draws / contributions" value={netFin} divider={false} />
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "2px solid var(--ink)" }}>
          <StmtRow label="Net cash from financing" value={netFin} bold divider={false} />
        </div>
      </Card>

      <Card padding={14} style={{ marginTop: 14, background: "var(--caramel-soft)", border: "1px solid var(--caramel)" }}>
        <StmtRow label="Opening cash · 1 Apr 2026" value={openingCash} divider />
        <StmtRow label="Net change in cash" value={netChange} divider />
        <StmtRow label="Closing cash · 24 May 2026" value={closingCash} bold divider={false} />
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid var(--line-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: "var(--muted)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Runway flag
          </span>
          <span
            style={{
              background: runwayBg,
              color: runwayFg,
              border: "1px solid " + runwayBorder,
              padding: "4px 10px",
              borderRadius: 999,
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {runwayLabel}
          </span>
        </div>
      </Card>

      <div style={{ fontSize: 11, color: "var(--muted)", padding: "14px 4px 0", lineHeight: 1.5 }}>
        Operating / investing split applied to logged transactions. Opening cash is a manually-set baseline. Runway thresholds: under ₹10K = below buffer, under ₹25K = tight, otherwise OK.
      </div>
    </div>
  );
}

// ---------- Layout helpers ----------

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "var(--caramel-deep)",
        marginTop: 14,
        marginBottom: 2,
      }}
    >
      {children}
    </div>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        color: "var(--muted)",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        marginTop: 14,
        marginBottom: 2,
      }}
    >
      {children}
    </div>
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
            href={`/reports?tab=${t.value}`}
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
