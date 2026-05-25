import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { PhoneShell } from "@/components/PhoneShell";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeDashboard } from "@/components/home/HomeDashboard";
import type { HomeData } from "@/components/home/sections";
import { auth } from "@/auth";

// Anchored to the seed-data baseline so the prototype's numbers stay readable.
const TODAY = "2026-05-24";

function plusDays(iso: string, n: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  const userName = session?.user?.name ?? "";

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const weekEnd = plusDays(TODAY, 6);
  const tomorrow = plusDays(TODAY, 1);
  const twoDaysAgo = plusDays(TODAY, -2);
  const ninetyDaysAgo = plusDays(TODAY, -90);
  const eventsHorizon = plusDays(TODAY, 45);
  const month = TODAY.slice(0, 7);

  // Fetch every dataset any section might need in one parallel volley.
  const [
    { data: activeOrders },
    { data: todayOrderRows },
    { data: tomorrowOrderRows },
    { data: allInventory },
    { data: openListsRows },
    { data: itemAgg },
    { data: campaignRows },
    { data: newCustomers },
    { data: deliveredOrders },
    { data: complianceRows },
    { data: blockedRows },
    { data: monthlyRow },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id, title, flavor, price, balance, delivery_date, delivery_slot, status, customer_id, customers (name)")
      .not("status", "in", "(delivered,draft,cancelled)"),
    supabase
      .from("orders")
      .select("id, title, flavor, delivery_slot, delivery_date, price, status, customers (name)")
      .eq("delivery_date", TODAY)
      .order("delivery_slot"),
    supabase
      .from("orders")
      .select("id, title, flavor, delivery_slot, delivery_date, price, status, customers (name)")
      .eq("delivery_date", tomorrow)
      .order("delivery_slot"),
    supabase.from("inventory_items").select("id, name, qty, unit, reorder_at"),
    supabase
      .from("shopping_lists")
      .select("id, name, created_at")
      .eq("status", "open")
      .order("created_at", { ascending: false }),
    supabase.from("shopping_list_items").select("list_id, checked, estimated_cost"),
    supabase.from("campaigns").select("data").limit(20),
    supabase
      .from("customers")
      .select("id, name, area, since, order_count")
      .gte("since", ninetyDaysAgo)
      .order("since", { ascending: false })
      .limit(20),
    supabase
      .from("orders")
      .select("id, title, delivery_date, feedback_received, rating, customers (name)")
      .eq("status", "delivered")
      .lte("delivery_date", twoDaysAgo)
      .eq("feedback_received", "N")
      .order("delivery_date", { ascending: false })
      .limit(8),
    supabase
      .from("compliance_items")
      .select("id, item, due_date, status")
      .eq("status", "open")
      .lte("due_date", plusDays(TODAY, 60))
      .order("due_date"),
    supabase
      .from("blocked_dates")
      .select("date, reason, type")
      .gte("date", TODAY)
      .lte("date", eventsHorizon)
      .order("date"),
    supabase.from("monthly_summary").select("month, income, expense, profit").eq("month", month).maybeSingle(),
  ]);

  // ---------- Roll-ups ----------

  const lowStock = (allInventory ?? [])
    .filter((i) => Number(i.qty) < Number(i.reorder_at))
    .map((i) => ({
      id: i.id,
      name: i.name,
      qty: Number(i.qty),
      unit: i.unit,
      reorder_at: Number(i.reorder_at),
    }));

  const weekRevenue = (activeOrders ?? [])
    .filter((o) => o.delivery_date && o.delivery_date >= TODAY && o.delivery_date <= weekEnd)
    .reduce((s, o) => s + (o.price ?? 0), 0);
  const pendingBalance = (activeOrders ?? []).reduce((s, o) => s + (o.balance ?? 0), 0);
  const activeCount = activeOrders?.length ?? 0;
  const todaysCount = todayOrderRows?.length ?? 0;

  const mapOrder = (
    o: {
      id: string;
      title: string | null;
      flavor: string | null;
      delivery_slot: string | null;
      delivery_date: string | null;
      price: number | null;
      status: string;
      customers: { name: string | null } | { name: string | null }[] | null;
    },
  ) => {
    const cust = Array.isArray(o.customers) ? o.customers[0] : o.customers;
    return {
      id: o.id,
      title: o.title,
      flavor: o.flavor,
      delivery_slot: o.delivery_slot,
      delivery_date: o.delivery_date,
      price: o.price,
      status: o.status,
      customer_name: cust?.name ?? null,
    };
  };
  const todayOrders = (todayOrderRows ?? []).map(mapOrder);
  const tomorrowOrders = (tomorrowOrderRows ?? []).map(mapOrder);

  // Shopping list aggregates
  const aggMap = new Map<string, { total: number; checked: number; cost: number }>();
  for (const it of (itemAgg as { list_id: string; checked: boolean; estimated_cost: number }[] | null) ?? []) {
    const a = aggMap.get(it.list_id) ?? { total: 0, checked: 0, cost: 0 };
    a.total += 1;
    if (it.checked) a.checked += 1;
    a.cost += it.estimated_cost ?? 0;
    aggMap.set(it.list_id, a);
  }
  const openLists = (openListsRows ?? []).map((l) => {
    const a = aggMap.get(l.id) ?? { total: 0, checked: 0, cost: 0 };
    return { id: l.id, name: l.name, total: a.total, checked: a.checked, cost: a.cost };
  });

  // Campaigns (data is jsonb)
  const campaigns = (campaignRows ?? [])
    .map((r) => r.data as { id: string; name?: string; status?: string; audience?: string })
    .map((c) => ({
      id: c.id,
      name: c.name ?? "(unnamed)",
      status: c.status ?? "draft",
      audience: c.audience,
    }));

  const newLeads = (newCustomers ?? [])
    .filter((c) => (c.order_count ?? 0) === 0)
    .slice(0, 5)
    .map((c) => ({ id: c.id, name: c.name, area: c.area, since: c.since }));

  const reviewsDue = (deliveredOrders ?? [])
    .map((o) => {
      const cust = Array.isArray(o.customers) ? o.customers[0] : o.customers;
      return {
        id: o.id,
        title: o.title,
        customer_name: cust?.name ?? null,
        delivery_date: o.delivery_date,
      };
    })
    .slice(0, 5);

  const complianceDue = (complianceRows ?? []).slice(0, 5).map((c) => {
    const d = new Date(c.due_date);
    const days = Math.round(
      (d.getTime() - new Date(TODAY).getTime()) / 86400000,
    );
    return { id: c.id, item: c.item, due_date: c.due_date, days };
  });

  // Upcoming events = blocked_dates (festivals/internal) + compliance items
  // ordered by date, max 5.
  const upcomingEvents: HomeData["upcomingEvents"] = [
    ...(blockedRows ?? []).map((b) => ({
      id: `block-${b.date}`,
      title: b.reason,
      date: b.date,
      kind: (b.type === "festival" ? "festival" : "event") as "festival" | "event",
      meta: b.type === "festival" ? "Festival · plan ahead" : undefined,
    })),
    ...(complianceRows ?? []).map((c) => ({
      id: `comp-${c.id}`,
      title: c.item,
      date: c.due_date,
      kind: "compliance" as const,
      meta: "Compliance deadline",
    })),
  ]
    .filter((e) => e.date >= TODAY && e.date <= eventsHorizon)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  const outstandingOrders = (activeOrders ?? [])
    .filter((o) => (o.balance ?? 0) > 0)
    .sort((a, b) => (b.balance ?? 0) - (a.balance ?? 0))
    .slice(0, 6)
    .map((o) => {
      const cust = Array.isArray(o.customers) ? o.customers[0] : o.customers;
      return {
        id: o.id,
        title: o.title,
        customer_name: cust?.name ?? null,
        balance: o.balance ?? 0,
      };
    });

  const data: HomeData = {
    weekRevenue,
    pendingBalance,
    todaysCount,
    activeCount,
    todayOrders,
    tomorrowOrders,
    lowStock,
    openLists,
    campaigns,
    newLeads,
    reviewsDue,
    complianceDue,
    upcomingEvents,
    monthly: monthlyRow
      ? {
          month: monthlyRow.month,
          income: monthlyRow.income ?? 0,
          expense: monthlyRow.expense ?? 0,
          profit: monthlyRow.profit ?? 0,
        }
      : null,
    outstandingOrders,
  };

  return (
    <PhoneShell>
      <div data-screen-label="Home">
        <HomeHeader dateLabel="Sunday, 24 May" userName={userName} />
        <HomeDashboard data={data} />
      </div>
    </PhoneShell>
  );
}
