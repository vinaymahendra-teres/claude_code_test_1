import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { PhoneShell } from "@/components/PhoneShell";
import { Card, SectionHeader, Pill, Bars } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { fmtMoney, fmtCompactMoney, fmtDate, fmtRelative, todayIst } from "@/lib/format";

import { AddExpenseButton } from "./AddExpenseButton";
import { EditExpenseSheet } from "./EditExpenseSheet";
import { ComplianceItemSheet } from "./ComplianceItemSheet";
import { AddComplianceButton } from "./AddComplianceButton";

export const revalidate = 60;

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "transactions", label: "Transactions" },
  { value: "tax", label: "Tax" },
];

const PALETTE = [
  "var(--caramel)",
  "var(--rose)",
  "var(--sage)",
  "var(--plum)",
  "var(--caramel-deep)",
  "oklch(0.55 0.05 60)",
  "var(--muted)",
  "oklch(0.45 0.05 200)",
];

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; cat?: string }>;
}) {
  const { tab: rawTab, cat: rawCat } = await searchParams;
  const tab = TABS.some((t) => t.value === rawTab) ? rawTab! : "overview";

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Pull everything we need up-front — table is small
  const [{ data: expenses }, { data: monthly }, { data: compliance }] = await Promise.all([
    supabase
      .from("expenses")
      .select("id, date, vendor, category, amount, method, note, account_debited")
      .order("date", { ascending: false }),
    supabase
      .from("monthly_summary")
      .select("month, income, expense, profit")
      .order("month", { ascending: false }),
    supabase
      .from("compliance_items")
      .select("id, item, type, due_date, note")
      .order("due_date", { ascending: true }),
  ]);

  return (
    <PhoneShell>
      <div data-screen-label="Accounting">
        <header style={chromeHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 32 }}>
            <Link href="/" style={chromeBtn} aria-label="Back">
              <Icon.ChevronLeft size={22} />
            </Link>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 21, lineHeight: 1.15 }}>
                Books
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>May 2026</div>
            </div>
          </div>
        </header>

        <div style={{ padding: "10px 18px 8px", borderBottom: "1px solid var(--line-soft)", background: "var(--bg)" }}>
          <TabRow current={tab} />
        </div>

        <div style={{ padding: "12px 18px 100px", overflowY: "auto", flex: 1 }}>
          {tab === "overview" && (
            <Overview expenses={expenses ?? []} monthly={monthly ?? []} />
          )}
          {tab === "transactions" && (
            <Transactions expenses={expenses ?? []} cat={rawCat} />
          )}
          {tab === "tax" && (
            <TaxView compliance={compliance ?? []} />
          )}
        </div>
      </div>
    </PhoneShell>
  );
}

// ---------- Overview ----------

function Overview({
  expenses,
  monthly,
}: {
  expenses: { date: string; category: string; amount: number }[];
  monthly: { month: string; income: number; expense: number; profit: number }[];
}) {
  const may = monthly.find((m) => m.month === "2026-05") ?? { income: 0, expense: 0, profit: 0, month: "2026-05" };
  const trend = monthly.slice().reverse(); // chronological

  // Where money went — this month
  const byCat: Record<string, number> = {};
  expenses
    .filter((e) => e.date.startsWith("2026-05"))
    .forEach((e) => {
      byCat[e.category] = (byCat[e.category] || 0) + e.amount;
    });
  const rows = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((s, [, v]) => s + v, 0) || 1;

  return (
    <div>
      {/* P&L hero */}
      <Card
        padding={0}
        style={{
          background: "linear-gradient(135deg, oklch(0.30 0.08 50), oklch(0.22 0.04 50))",
          color: "oklch(0.96 0.02 70)",
          border: "none",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 11.5, opacity: 0.6, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Net profit · May (partial)
          </div>
          <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 36, marginTop: 4 }}>
            {fmtMoney(may.profit)}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
            {fmtMoney(may.income)} in · {fmtMoney(may.expense)} out
          </div>
        </div>
      </Card>

      {/* This month split */}
      <SectionHeader>This month</SectionHeader>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Card padding={14}>
          <div style={tileLabelStyle}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--ok)" }} />
            Income
          </div>
          <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 22, marginTop: 4 }}>
            {fmtCompactMoney(may.income)}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>from orders</div>
        </Card>
        <Card padding={14}>
          <div style={tileLabelStyle}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--rose)" }} />
            Expense
          </div>
          <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 22, marginTop: 4 }}>
            {fmtCompactMoney(may.expense)}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
            {expenses.filter((e) => e.date.startsWith("2026-05")).length} transactions
          </div>
        </Card>
      </div>

      {/* 6-month trend */}
      <SectionHeader>6-month trend</SectionHeader>
      <Card padding={14}>
        <Bars data={trend.map((m) => ({ in: m.income, out: m.expense }))} height={80} />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 8,
            fontSize: 10.5,
            color: "var(--muted)",
          }}
        >
          {trend.map((m) => (
            <span key={m.month}>{m.month.slice(5)}</span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 12, fontSize: 11.5 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--caramel)" }} /> Income
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--rose)", opacity: 0.7 }} /> Expense
          </span>
        </div>
      </Card>

      {/* Where money went */}
      <SectionHeader>Where money went</SectionHeader>
      <Card padding={14}>
        {rows.map(([cat, amt], i) => {
          const pct = (amt / total) * 100;
          return (
            <div key={cat} style={{ marginBottom: i === rows.length - 1 ? 0 : 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span>{cat}</span>
                <span style={{ fontWeight: 600 }}>{fmtMoney(amt)}</span>
              </div>
              <div style={{ height: 6, background: "var(--surface-3)", borderRadius: 999, overflow: "hidden" }}>
                <div
                  style={{
                    width: pct + "%",
                    height: "100%",
                    background: PALETTE[i % PALETTE.length],
                    opacity: 0.85,
                  }}
                />
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ---------- Transactions ----------

function Transactions({
  expenses,
  cat,
}: {
  expenses: { id: string; date: string; vendor: string; category: string; amount: number; method: string | null; note: string | null }[];
  cat: string | undefined;
}) {
  const filters = ["all", "Ingredients", "Rent", "Marketing", "Utilities", "Packaging", "Delivery", "Fees"];
  const filtered = expenses.filter((e) => !cat || cat === "all" || e.category === cat);

  // Group by date
  const groups = new Map<string, typeof expenses>();
  filtered.forEach((e) => {
    const list = groups.get(e.date) ?? [];
    list.push(e);
    groups.set(e.date, list);
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <AddExpenseButton />
      </div>
      <div
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          margin: "4px -18px 14px",
          padding: "0 18px 4px",
          scrollbarWidth: "none",
        }}
      >
        {filters.map((f) => {
          const active = (cat ?? "all") === f;
          return (
            <Link
              key={f}
              href={`/books?tab=transactions&cat=${f}`}
              style={{
                flexShrink: 0,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                textDecoration: "none",
                border: "1px solid " + (active ? "var(--caramel)" : "var(--line)"),
                background: active ? "var(--caramel-soft)" : "var(--surface)",
                color: active ? "var(--caramel-deep)" : "var(--ink-soft)",
                borderRadius: 999,
              }}
            >
              {f === "all" ? "All" : f}
            </Link>
          );
        })}
      </div>

      {Array.from(groups.entries()).map(([date, items]) => (
        <div key={date} style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: 11,
              color: "var(--muted)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              marginBottom: 6,
              padding: "0 4px",
            }}
          >
            {fmtRelative(date)} · {fmtDate(date)}
          </div>
          <Card padding={0}>
            {items.map((t, i) => (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 14px",
                  borderBottom: i < items.length - 1 ? "1px solid var(--line-soft)" : "none",
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t.vendor}</div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "var(--muted)",
                      marginTop: 2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 220,
                    }}
                  >
                    {t.category}
                    {t.note ? ` · ${t.note}` : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--danger)" }}>
                    −{fmtMoney(t.amount)}
                  </div>
                  <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2 }}>{t.method}</div>
                </div>
                <EditExpenseSheet
                  id={t.id}
                  initial={{
                    date: t.date,
                    vendor: t.vendor,
                    category: t.category,
                    amount: t.amount,
                    method: t.method ?? "",
                    note: t.note ?? "",
                    upi_reference_utr: "",
                  }}
                />
              </div>
            ))}
          </Card>
        </div>
      ))}
    </div>
  );
}

// ---------- Tax ----------

function TaxView({
  compliance,
}: {
  compliance: { id: string; item: string; type: string | null; due_date: string; note: string | null }[];
}) {
  const TODAY = new Date(todayIst());
  const withDays = compliance.map((c) => {
    const d = new Date(c.due_date);
    const days = Math.round((d.getTime() - TODAY.getTime()) / 86400000);
    let status: "overdue" | "urgent" | "soon" | "ok";
    if (days < 0) status = "overdue";
    else if (days <= 14) status = "urgent";
    else if (days <= 45) status = "soon";
    else status = "ok";
    return { ...c, days, status };
  });

  const palette: Record<
    "overdue" | "urgent" | "soon" | "ok",
    { soft: string; fg: string }
  > = {
    overdue: { soft: "oklch(0.94 0.05 28)", fg: "var(--danger)" },
    urgent: { soft: "oklch(0.95 0.07 80)", fg: "oklch(0.42 0.12 70)" },
    soon: { soft: "var(--caramel-soft)", fg: "var(--caramel-deep)" },
    ok: { soft: "var(--sage-soft)", fg: "oklch(0.34 0.07 145)" },
  };

  return (
    <div>
      <Card
        padding={0}
        style={{
          background: "linear-gradient(135deg, var(--caramel-soft), var(--rose-soft))",
          border: "none",
        }}
      >
        <div style={{ padding: 16 }}>
          <div
            style={{
              fontSize: 11.5,
              color: "var(--ink-soft)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Advance tax · Q1 FY26
          </div>
          <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 30, marginTop: 4 }}>
            {fmtMoney(38420)}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>
            estimated · 15% instalment due 15 Jun 2026
          </div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginTop: 12,
              padding: "7px 12px",
              fontSize: 13,
              fontWeight: 600,
              background: "var(--caramel)",
              color: "var(--surface)",
              borderRadius: "var(--r)",
              border: "1px solid var(--caramel-deep)",
            }}
          >
            <Icon.Doc size={14} /> Download GSTR-3B (May)
          </span>
        </div>
      </Card>

      <SectionHeader>B2B / GST invoices</SectionHeader>
      <Card padding={0}>
        <InvoiceRow
          name="Vikram Iyer · Office launch"
          detail="GST invoice ready · ₹18,500"
        />
        <InvoiceRow
          name="Karthik Rao · Product launch"
          detail="Mar 19 · ₹51,000"
          last
        />
      </Card>

      <SectionHeader action={<AddComplianceButton />}>Compliance schedule</SectionHeader>
      <Card padding={0}>
        {withDays.map((c, i) => {
          const p = palette[c.status];
          const label =
            c.status === "overdue" ? `${-c.days}d overdue` : `${c.days}d`;
          return (
            <div
              key={c.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 14px",
                borderBottom: i < withDays.length - 1 ? "1px solid var(--line-soft)" : "none",
              }}
            >
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: p.soft,
                  color: p.fg,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                {c.type === "licence" ? (
                  <Icon.Doc size={15} />
                ) : c.type === "insurance" ? (
                  <Icon.Heart size={15} />
                ) : (
                  <Icon.Receipt size={15} />
                )}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25 }}>{c.item}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                  due {fmtDate(c.due_date, { showYear: true })}
                </div>
              </div>
              <Pill tone={c.status === "overdue" ? "danger" : c.status === "urgent" ? "warn" : c.status === "soon" ? "caramel" : "ok"} size="xs">
                {label}
              </Pill>
              <ComplianceItemSheet
                id={c.id}
                label={c.item}
                dueLabel={`Due ${c.due_date} · ${label}`}
              />
            </div>
          );
        })}
      </Card>

      <SectionHeader
        action={
          <Link href="/reports" style={{ color: "var(--caramel-deep)", fontWeight: 600, textDecoration: "none" }}>
            Open →
          </Link>
        }
      >
        Financial statements
      </SectionHeader>
      <Card style={{ background: "var(--surface-2)", border: "1px dashed var(--line)" }} padding={14}>
        <div style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.55 }}>
          P&amp;L, Balance Sheet and Cash Flow live on the dedicated <b>Reports</b> screen.
        </div>
      </Card>
    </div>
  );
}

function InvoiceRow({
  name,
  detail,
  last,
}: {
  name: string;
  detail: string;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 14px",
        borderBottom: last ? "none" : "1px solid var(--line-soft)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{name}</div>
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>{detail}</div>
      </div>
      <span
        style={{
          padding: "5px 10px",
          fontSize: 12,
          fontWeight: 600,
          background: "var(--surface)",
          color: "var(--ink)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r)",
        }}
      >
        PDF
      </span>
    </div>
  );
}

// ---------- Tab nav ----------

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
            href={`/books?tab=${t.value}`}
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

// ---------- Inline style helpers ----------

const tileLabelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 11,
  color: "var(--muted)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

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
