import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { PhoneShell } from "@/components/PhoneShell";
import { Card, StatTile, StatusPill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { fmtMoney, fmtCompactMoney, fmtDate, todayIst } from "@/lib/format";

export const revalidate = 60;

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Order = {
  id: string;
  customer_id: string | null;
  title: string | null;
  flavor: string | null;
  size: string | null;
  price: number | null;
  delivery_date: string | null;
  delivery_slot: string | null;
  status: string;
};

export default async function BakesPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const today = todayIst();

  const start = new Date(today);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
  const weekEnd = days[days.length - 1];

  const [{ data: orders }, { data: recipes }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, customer_id, title, flavor, size, price, delivery_date, delivery_slot, status")
      .gte("delivery_date", today)
      .lte("delivery_date", weekEnd)
      .not("status", "in", "(delivered,draft)"),
    supabase.from("recipes").select("name, prep_mins, bake_mins"),
  ]);

  const ordersInWeek = (orders as Order[]) ?? [];
  const recipeByFlavor = (flavor: string | null) => {
    if (!flavor) return null;
    const key = flavor.toLowerCase();
    return (recipes ?? []).find((r) => key.includes(r.name.toLowerCase())) ?? null;
  };

  const totalCakes = ordersInWeek.length;
  const totalHours =
    ordersInWeek.reduce((s, o) => {
      const r = recipeByFlavor(o.flavor);
      return s + (r ? (Number(r.prep_mins) + Number(r.bake_mins)) / 60 : 1);
    }, 0) || 0;
  const totalRevenue = ordersInWeek.reduce((s, o) => s + (o.price ?? 0), 0);

  const byDay = days.map((d) => ({
    date: d,
    orders: ordersInWeek
      .filter((o) => o.delivery_date === d)
      .sort((a, b) => (a.delivery_slot || "").localeCompare(b.delivery_slot || "")),
  }));

  return (
    <PhoneShell>
      <div data-screen-label="Production">
        <header style={chromeHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 32 }}>
            <Link href="/" style={chromeBtn} aria-label="Back">
              <Icon.ChevronLeft size={22} />
            </Link>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 21, lineHeight: 1.15 }}>
                Bakes
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                Week of {fmtDate(days[0])} – {fmtDate(weekEnd)}
              </div>
            </div>
          </div>
        </header>

        <div style={{ padding: "12px 18px 100px", overflowY: "auto", flex: 1, minHeight: 0 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <StatTile label="Cakes" value={String(totalCakes)} tone="caramel" />
            <StatTile label="Oven hrs" value={totalHours.toFixed(1)} tone="rose" />
            <StatTile label="Revenue" value={fmtCompactMoney(totalRevenue)} tone="sage" />
          </div>

          {byDay.map(({ date, orders }) => {
            const isToday = date === today;
            const heat =
              orders.length === 0
                ? "rest"
                : orders.length <= 1
                  ? "light"
                  : orders.length <= 3
                    ? "busy"
                    : "full";
            const heatColor = {
              rest: "var(--line)",
              light: "var(--sage)",
              busy: "var(--caramel)",
              full: "var(--rose)",
            }[heat];
            return (
              <div key={date} style={{ marginBottom: 18 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 8,
                    padding: "0 4px",
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: heatColor }} />
                  <div>
                    <span
                      style={{
                        fontFamily: "DM Serif Display, serif",
                        fontSize: 17,
                        marginRight: 8,
                      }}
                    >
                      {DOW[new Date(date).getDay()]}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>
                      {fmtDate(date)} {isToday && "· today"}
                    </span>
                  </div>
                  <div style={{ flex: 1 }} />
                  <span style={{ fontSize: 11.5, color: "var(--muted)" }}>
                    {orders.length === 0
                      ? "Rest day"
                      : `${orders.length} ${orders.length === 1 ? "cake" : "cakes"}`}
                  </span>
                </div>
                {orders.length === 0 ? (
                  <Card style={{ background: "var(--surface-2)" }}>
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "var(--muted)",
                        textAlign: "center",
                        padding: 4,
                      }}
                    >
                      Kitchen rests. Use this for prep or marketing.
                    </div>
                  </Card>
                ) : (
                  <Card padding={0}>
                    {orders.map((o, i) => {
                      const r = recipeByFlavor(o.flavor);
                      return (
                        <Link
                          key={o.id}
                          href={`/orders/${o.id}`}
                          style={{
                            display: "block",
                            padding: "11px 14px",
                            borderBottom: i < orders.length - 1 ? "1px solid var(--line-soft)" : "none",
                            textDecoration: "none",
                            color: "inherit",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div
                              style={{
                                width: 48,
                                textAlign: "center",
                                background: "var(--surface-3)",
                                borderRadius: 10,
                                padding: "6px 0",
                              }}
                            >
                              <div
                                style={{
                                  fontFamily: "DM Serif Display, serif",
                                  fontSize: 15,
                                  lineHeight: 1,
                                }}
                              >
                                {(o.delivery_slot || "").split(" ")[0]}
                              </div>
                              <div style={{ fontSize: 9.5, color: "var(--muted)" }}>
                                {(o.delivery_slot || "").split(" ")[1] || ""}
                              </div>
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  lineHeight: 1.3,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {o.title}
                              </div>
                              <div
                                style={{
                                  fontSize: 11.5,
                                  color: "var(--muted)",
                                  marginTop: 3,
                                  display: "flex",
                                  gap: 6,
                                  alignItems: "center",
                                }}
                              >
                                <span>{o.flavor}</span>
                                {r && (
                                  <>
                                    <span
                                      style={{
                                        width: 2,
                                        height: 2,
                                        borderRadius: 999,
                                        background: "var(--line)",
                                      }}
                                    />
                                    <span>{Number(r.prep_mins) + Number(r.bake_mins)}min</span>
                                  </>
                                )}
                                <span
                                  style={{
                                    width: 2,
                                    height: 2,
                                    borderRadius: 999,
                                    background: "var(--line)",
                                  }}
                                />
                                <span>{fmtMoney(o.price ?? 0)}</span>
                              </div>
                              <div style={{ marginTop: 5 }}>
                                <StatusPill status={o.status} dot={false} />
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </Card>
                )}
              </div>
            );
          })}
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
