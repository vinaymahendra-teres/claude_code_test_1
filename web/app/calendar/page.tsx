import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { PhoneShell } from "@/components/PhoneShell";
import { Card } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { CalendarView } from "./CalendarView";
import { NewEventButton } from "./NewEventButton";
import { EVENT_KINDS, type EventKind } from "./kinds";
import { todayIst } from "@/lib/format";

export const revalidate = 30;

export type CalendarEntry = {
  id: string;
  title: string;
  date: string; // ISO YYYY-MM-DD
  endDate: string | null;
  kind: EventKind | "order" | "compliance" | "festival-block";
  ref?: { href: string };
  meta?: string;
  notes?: string | null;
  editable: boolean; // calendar_events rows can be edited; overlay items cannot
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; kind?: string; sort?: string; q?: string }>;
}) {
  const params = await searchParams;
  const today = todayIst();
  const monthParam = params.month ?? today.slice(0, 7);
  const sort = params.sort === "desc" ? "desc" : "asc";
  const kindFilter = params.kind ?? "all";
  const q = (params.q ?? "").trim();

  // Range we read: a window covering the visible month plus a buffer on either
  // side so the prev/next-month gutters of the grid still see data.
  const firstOfMonth = monthParam + "-01";
  const monthStart = new Date(firstOfMonth);
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);
  monthEnd.setDate(0);

  const fromDate = isoDay(addDays(monthStart, -10));
  const toDate = isoDay(addDays(monthEnd, 10));

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const [{ data: events }, { data: orders }, { data: compliance }, { data: blocked }] =
    await Promise.all([
      supabase
        .from("calendar_events")
        .select("id, title, date, end_date, kind, notes")
        .gte("date", fromDate)
        .lte("date", toDate),
      supabase
        .from("orders")
        .select("id, title, flavor, delivery_date, delivery_slot, status, customers (name)")
        .gte("delivery_date", fromDate)
        .lte("delivery_date", toDate)
        .not("status", "in", "(cancelled,draft)"),
      supabase
        .from("compliance_items")
        .select("id, item, due_date, status")
        .gte("due_date", fromDate)
        .lte("due_date", toDate),
      supabase
        .from("blocked_dates")
        .select("date, reason, type")
        .gte("date", fromDate)
        .lte("date", toDate),
    ]);

  const allEntries: CalendarEntry[] = [
    ...(events ?? []).map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      endDate: e.end_date,
      kind: e.kind as EventKind,
      notes: e.notes,
      editable: true,
    })),
    ...(orders ?? []).map((o) => {
      const cust = Array.isArray(o.customers) ? o.customers[0] : (o.customers as { name: string } | null);
      return {
        id: `order-${o.id}`,
        title: o.title || `Order ${o.id}`,
        date: o.delivery_date!,
        endDate: null,
        kind: "order" as const,
        ref: { href: `/orders/${o.id}` },
        meta: `${cust?.name ?? "—"} · ${o.delivery_slot ?? ""} · ${o.flavor ?? ""}`,
        editable: false,
      };
    }),
    ...(compliance ?? []).map((c) => ({
      id: `comp-${c.id}`,
      title: c.item,
      date: c.due_date,
      endDate: null,
      kind: "compliance" as const,
      ref: { href: "/books?tab=tax" },
      meta: c.status === "open" ? "Open" : c.status,
      editable: false,
    })),
    ...(blocked ?? []).map((b) => ({
      id: `block-${b.date}`,
      title: b.reason,
      date: b.date,
      endDate: null,
      kind: "festival-block" as const,
      meta: b.type === "festival" ? "Festival" : "Blocked",
      editable: false,
    })),
  ];

  return (
    <PhoneShell>
      <div data-screen-label="Calendar">
        <header style={chromeHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 32 }}>
            <Link href="/" style={chromeBtn} aria-label="Back">
              <Icon.ChevronLeft size={22} />
            </Link>
            <div style={{ flex: 1 }}>
              <div
                style={{ fontFamily: "DM Serif Display, serif", fontSize: 21, lineHeight: 1.15 }}
              >
                Calendar
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                {monthLabel(monthParam)} · {allEntries.length} entries · IST
              </div>
            </div>
            <NewEventButton initialDate={today} />
          </div>
        </header>

        <CalendarView
          month={monthParam}
          today={today}
          entries={allEntries}
          initialKind={kindFilter}
          initialSort={sort}
          initialQuery={q}
        />

        <Card
          style={{
            margin: "0 18px 24px",
            background: "var(--surface-2)",
            border: "1px dashed var(--line)",
          }}
          padding={12}
        >
          <div style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.5 }}>
            Calendar shows your own events (editable below) plus read-only overlays of orders by
            delivery date, compliance items by due date, and festival / blocked dates. Tap an order
            or compliance entry to open it; tap one of your own events to edit or delete.
          </div>
        </Card>
      </div>
    </PhoneShell>
  );
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function monthLabel(monthIso: string): string {
  const d = new Date(monthIso + "-01");
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    month: "long",
    year: "numeric",
  }).format(d);
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

export const EXPORTED_KINDS = EVENT_KINDS; // re-export so CalendarView can import alongside
