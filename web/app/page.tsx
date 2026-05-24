import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { fmtMoney, fmtCompactMoney, fmtDate } from "@/lib/format";

// Anchor "today" to the seed-data baseline so the prototype's numbers stay readable.
// When real time-aware queries land, swap to new Date().toISOString().slice(0, 10).
const TODAY = "2026-05-24";

function plusDays(iso: string, n: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Active orders (non-delivered, non-draft) — used for pending balance + active count
  const { data: activeOrders } = await supabase
    .from("orders")
    .select("price, balance, delivery_date, status")
    .not("status", "in", "(delivered,draft)");

  // Today's bakes
  const { count: todaysCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("delivery_date", TODAY);

  // Tomorrow's deliveries — show up to 4
  const tomorrow = plusDays(TODAY, 1);
  const { data: tomorrowOrders } = await supabase
    .from("orders")
    .select("id, title, flavor, delivery_slot, customer_id, customers (name, avatar_tone)")
    .eq("delivery_date", tomorrow)
    .order("delivery_slot");

  // Low stock items
  // Supabase JS doesn't support direct column-vs-column filters, so we pull the
  // small inventory table and filter in memory. Production: replace with a SQL
  // view (e.g. `create view low_stock_items as select * from inventory_items
  // where qty < reorder_at;`) and query that view directly.
  const { data: allInventory } = await supabase
    .from("inventory_items")
    .select("id, name, qty, unit, reorder_at");
  const lowStockFiltered = (allInventory ?? []).filter(
    (i) => Number(i.qty) < Number(i.reorder_at),
  );

  // Compute headline numbers
  const weekStart = TODAY;
  const weekEnd = plusDays(TODAY, 6);
  const weekRevenue = (activeOrders ?? [])
    .filter((o) => o.delivery_date >= weekStart && o.delivery_date <= weekEnd)
    .reduce((s, o) => s + (o.price ?? 0), 0);
  const pendingBalance = (activeOrders ?? []).reduce(
    (s, o) => s + (o.balance ?? 0),
    0,
  );
  const activeCount = activeOrders?.length ?? 0;

  // First-run gate — if Supabase hasn't been migrated yet, prompt the user
  const isFirstRun = activeOrders == null && allInventory == null;

  return (
    <div className="desktop">
      <aside className="side side-l">
        <div className="brandmark" style={{ justifyContent: "flex-end" }}>
          <span>Tiered Cake Co.</span>
          <span className="logo" aria-hidden="true" />
        </div>
        <p style={{ fontSize: 13 }}>
          All-in-one workspace for the small custom-cake business — built phone-first so it lives where the orders come from: in your hand, between piping bags.
        </p>
        <h2>Modules</h2>
        <p>
          CRM · Sales · Operations · Marketing · Accounting · Reports — one product, one mental model.
        </p>
        <h2>Status</h2>
        <ul style={{ listStyle: "none" }}>
          <li>
            <span className="pill">Next.js 15</span>
          </li>
          <li>
            <span className="pill">Supabase</span>
          </li>
          <li>
            <span className="pill">{isFirstRun ? "Schema pending" : "Live data"}</span>
          </li>
        </ul>
      </aside>

      <main className="phone" data-screen-label="Phone preview">
        <div className="notch" />
        <div className="status-bar">
          <span>9:41</span>
        </div>
        <div className="app-root">
          <div data-screen-label="Home">
            <header style={{ position: "relative", padding: "54px 22px 8px" }}>
              <div
                style={{
                  fontSize: 12.5,
                  color: "var(--muted)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                Sunday, 24 May
              </div>
              <div
                style={{
                  fontFamily: "DM Serif Display, serif",
                  fontSize: 28,
                  marginTop: 4,
                  lineHeight: 1.1,
                }}
              >
                Morning, Anita
              </div>
            </header>

            <div style={{ padding: "6px 18px 100px", overflowY: "auto", flex: 1 }}>
              {isFirstRun ? (
                <FirstRunNotice />
              ) : (
                <>
                  {/* Hero card — this-week revenue */}
                  <div
                    style={{
                      borderRadius: 18,
                      background:
                        "linear-gradient(135deg, oklch(0.30 0.08 50), oklch(0.22 0.04 50))",
                      color: "oklch(0.96 0.02 70)",
                      padding: 0,
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <div style={{ padding: "18px 18px 16px" }}>
                      <div
                        style={{
                          fontSize: 11.5,
                          opacity: 0.6,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        This week
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: 6,
                          marginTop: 4,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "DM Serif Display, serif",
                            fontSize: 34,
                            lineHeight: 1,
                          }}
                        >
                          {fmtMoney(weekRevenue)}
                        </span>
                        <span style={{ fontSize: 13, opacity: 0.7 }}>booked</span>
                      </div>
                      <div style={{ display: "flex", gap: 18, marginTop: 14 }}>
                        <div>
                          <div style={{ fontSize: 11, opacity: 0.6 }}>Pending balance</div>
                          <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>
                            {fmtMoney(pendingBalance)}
                          </div>
                        </div>
                        <div
                          style={{ width: 1, background: "oklch(0.99 0.01 75 / 0.15)" }}
                        />
                        <div>
                          <div style={{ fontSize: 11, opacity: 0.6 }}>Today&apos;s bakes</div>
                          <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>
                            {todaysCount ?? 0}{" "}
                            {todaysCount === 1 ? "cake" : "cakes"}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        borderTop: "1px solid oklch(0.99 0.01 75 / 0.12)",
                        padding: "10px 18px",
                        fontSize: 12.5,
                        opacity: 0.85,
                      }}
                    >
                      {activeCount} active order{activeCount === 1 ? "" : "s"}
                    </div>
                  </div>

                  {/* Tomorrow */}
                  {tomorrowOrders && tomorrowOrders.length > 0 && (
                    <>
                      <SectionHeader>Tomorrow</SectionHeader>
                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          overflowX: "auto",
                          margin: "0 -18px",
                          padding: "0 18px 4px",
                          scrollbarWidth: "none",
                        }}
                      >
                        {tomorrowOrders.map((o) => {
                          const cust = Array.isArray(o.customers)
                            ? o.customers[0]
                            : (o.customers as { name: string } | null);
                          return (
                            <div
                              key={o.id}
                              style={{
                                flexShrink: 0,
                                width: 200,
                                background: "var(--surface)",
                                border: "1px solid var(--line-soft)",
                                borderRadius: "var(--r-lg)",
                                padding: 12,
                                boxShadow: "var(--shadow-sm)",
                              }}
                            >
                              <div
                                style={{
                                  height: 100,
                                  borderRadius: 12,
                                  background:
                                    "repeating-linear-gradient(45deg, var(--caramel-soft) 0 8px, transparent 8px 16px), var(--surface-2)",
                                  marginBottom: 10,
                                  display: "grid",
                                  placeItems: "center",
                                  fontSize: 12,
                                  color: "var(--ink-soft)",
                                }}
                              >
                                {o.flavor}
                              </div>
                              <div
                                style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.3 }}
                              >
                                {cust?.name ?? "—"}
                              </div>
                              <div
                                style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}
                              >
                                {o.delivery_slot}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Low stock */}
                  {lowStockFiltered.length > 0 && (
                    <>
                      <SectionHeader>Stock running low</SectionHeader>
                      <div
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--line-soft)",
                          borderRadius: "var(--r-lg)",
                          overflow: "hidden",
                        }}
                      >
                        {lowStockFiltered.slice(0, 3).map((item, i, arr) => (
                          <div
                            key={item.id}
                            style={{
                              padding: "12px 14px",
                              borderBottom:
                                i < arr.length - 1
                                  ? "1px solid var(--line-soft)"
                                  : "none",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <div>
                              <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                                {item.name}
                              </div>
                              <div
                                style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}
                              >
                                {item.qty}
                                {item.unit} left · reorder at {item.reorder_at}
                                {item.unit}
                              </div>
                            </div>
                            <span
                              style={{
                                background: "oklch(0.95 0.07 80)",
                                color: "oklch(0.42 0.12 70)",
                                border: "1px solid oklch(0.82 0.12 80)",
                                fontSize: 10.5,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                                padding: "3px 8px",
                                borderRadius: 999,
                              }}
                            >
                              Low
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="home-indicator" />
      </main>

      <aside className="side side-r">
        <div className="brandmark">
          <span className="logo" aria-hidden="true" />
          <span>Hyderabad</span>
        </div>
        <p style={{ fontSize: 13 }}>
          Next.js full-stack edition. Data is served from Supabase Postgres — first-run
          guidance is visible until the schema migration is applied and seeded.
        </p>
        <h2>Next steps</h2>
        <ul>
          <li>
            Run the migration in <code>supabase/migrations/0001_initial_schema.sql</code>.
          </li>
          <li>
            Seed with <code>npm run seed</code> (needs the secret key in <code>.env.local</code>).
          </li>
          <li>Deploy to Vercel — see DEPLOY.md.</li>
        </ul>
      </aside>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontFamily: "DM Serif Display, serif",
        fontSize: 15,
        fontWeight: 400,
        margin: "20px 4px 10px",
        color: "var(--ink)",
        letterSpacing: "0.005em",
        textTransform: "uppercase",
        opacity: 0.7,
      }}
    >
      {children}
    </h3>
  );
}

function FirstRunNotice() {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px dashed var(--line)",
        borderRadius: "var(--r-lg)",
        padding: 18,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "DM Serif Display, serif",
          fontSize: 18,
          marginBottom: 8,
        }}
      >
        Supabase schema not applied yet
      </div>
      <p
        style={{
          fontSize: 12.5,
          color: "var(--muted)",
          lineHeight: 1.5,
          margin: "0 0 14px",
        }}
      >
        Apply the migration in <code>web/supabase/migrations/0001_initial_schema.sql</code>{" "}
        in your Supabase dashboard (SQL editor), then run{" "}
        <code>npm run seed</code> from the <code>web/</code> directory to import the
        sample data.
      </p>
      <p style={{ fontSize: 11.5, color: "var(--muted)" }}>
        Page will auto-populate on next refresh.
      </p>
    </div>
  );
}
