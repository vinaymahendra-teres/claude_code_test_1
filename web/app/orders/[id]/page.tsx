import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { PhoneShell } from "@/components/PhoneShell";
import { Card, CakeArt, StatusPill, SectionHeader, Pill, Avatar } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { fmtMoney, fmtDate } from "@/lib/format";
import { advanceStage } from "./actions";
import { EditOrderSheet } from "./EditOrderSheet";

export const dynamic = "force-dynamic";

const STAGES: { key: string; label: string }[] = [
  { key: "confirmed", label: "Confirmed" },
  { key: "in-production", label: "In production" },
  { key: "ready", label: "Ready" },
  { key: "delivered", label: "Delivered" },
];

const NEXT_STAGE_LABEL: Record<string, string> = {
  draft: "Confirm order",
  confirmed: "Start production",
  "in-production": "Mark ready",
  ready: "Mark delivered",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: order } = await supabase
    .from("orders")
    .select(`
      id, customer_id, title, flavor, size, servings, eggless, theme, add_ons,
      price, deposit, balance, delivery_date, delivery_slot, delivery_area,
      status, notes, payment_mode, upi_reference_utr, payer_vpa, cold_chain_notes,
      tiers, reference_count
    `)
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  let customer: { name: string; phone: string | null; instagram: string | null; area: string | null; avatar_tone: string | null; tags: string[] | null } | null = null;
  if (order.customer_id) {
    const { data } = await supabase
      .from("customers")
      .select("name, phone, instagram, area, avatar_tone, tags")
      .eq("id", order.customer_id)
      .maybeSingle();
    customer = data;
  }

  // Match recipe by flavor name (mirrors window.getRecipeByFlavor behaviour)
  let recipe: { id: string; name: string; category: string; prep_mins: number; bake_mins: number; cost_per_cake: number } | null = null;
  if (order.flavor) {
    const { data: recipes } = await supabase.from("recipes").select("id, name, category, prep_mins, bake_mins, cost_per_cake");
    const key = order.flavor.toLowerCase();
    recipe = (recipes ?? []).find((r) => key.includes(r.name.toLowerCase())) ?? null;
  }

  const currentIdx = STAGES.findIndex((s) => s.key === order.status);

  return (
    <PhoneShell>
      <div data-screen-label="Order Detail">
        <header style={{ position: "sticky", top: 0, background: "var(--bg)", padding: "54px 18px 14px", borderBottom: "1px solid var(--line-soft)", zIndex: 5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 32 }}>
            <Link href="/orders" style={chromeBtn} aria-label="Back">
              <Icon.ChevronLeft size={22} />
            </Link>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 21, lineHeight: 1.15 }}>
                #{order.id.replace(/^o-?/, "")}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                {customer?.name ?? "—"}
              </div>
            </div>
          </div>
        </header>

        <div style={{ padding: "14px 18px 100px", overflowY: "auto", flex: 1 }}>
          {/* Hero */}
          <CakeArt
            tone={(customer?.avatar_tone as "caramel" | "rose" | "sage" | "plum") || "caramel"}
            label={order.flavor || ""}
            style={{ width: "100%", height: 180, borderRadius: 16, marginBottom: 14 }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: "DM Serif Display, serif", fontSize: 22, margin: 0, lineHeight: 1.2 }}>
                {order.title || "Order"}
              </h2>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                {order.size} · {order.servings} servings · {order.eggless ? "Eggless" : "Regular"}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 22 }}>{fmtMoney(order.price ?? 0)}</div>
              {(order.balance ?? 0) > 0 && (
                <div style={{ fontSize: 11, color: "var(--danger)", fontWeight: 600 }}>{fmtMoney(order.balance ?? 0)} due</div>
              )}
            </div>
          </div>

          {/* Stage tracker */}
          <Card style={{ marginTop: 16 }} padding={14}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 11.5, color: "var(--muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Progress
              </div>
              <StatusPill status={order.status} dot={false} />
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {STAGES.map((s, i) => {
                const done = i <= currentIdx;
                return (
                  <div key={s.key} style={{ flex: 1 }}>
                    <div style={{ height: 5, borderRadius: 999, background: done ? "var(--caramel)" : "var(--line)", transition: "background .25s" }} />
                    <div style={{ fontSize: 10.5, marginTop: 6, fontWeight: done ? 600 : 500, color: done ? "var(--ink)" : "var(--muted)" }}>
                      {s.label}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 12 }}>
              <EditOrderSheet
                id={order.id}
                canCancel={order.status !== "delivered" && order.status !== "cancelled"}
                initial={{
                  title: order.title ?? "",
                  price: order.price ?? 0,
                  deposit: order.deposit ?? 0,
                  delivery_date: order.delivery_date ?? "",
                  delivery_slot: order.delivery_slot ?? "",
                  delivery_area: order.delivery_area ?? "",
                  cold_chain_notes: order.cold_chain_notes ?? "",
                  notes: order.notes ?? "",
                }}
              />
            </div>
            {NEXT_STAGE_LABEL[order.status] && (
              <form
                action={advanceStage.bind(null, order.id, order.status)}
                style={{ marginTop: 14 }}
              >
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "11px 16px",
                    background: "var(--caramel)",
                    color: "var(--surface)",
                    border: "1px solid var(--caramel-deep)",
                    borderRadius: "var(--r)",
                    fontFamily: "inherit",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  {NEXT_STAGE_LABEL[order.status]} →
                </button>
              </form>
            )}
          </Card>

          {/* Customer */}
          {customer && (
            <>
              <SectionHeader>Customer</SectionHeader>
              <Card padding={0}>
                <Link href={`/customers/${order.customer_id}`} style={{ display: "block", padding: 14, textDecoration: "none", color: "inherit" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar
                      name={customer.name}
                      tone={(customer.avatar_tone as "caramel" | "rose" | "sage") || "caramel"}
                      size={42}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{customer.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        {customer.area}
                        {customer.tags?.map((t) => (
                          <Pill key={t} tone={t === "VIP" ? "caramel" : t === "Eggless" ? "sage" : "neutral"} size="xs">
                            {t}
                          </Pill>
                        ))}
                      </div>
                    </div>
                    <Icon.Chevron size={16} style={{ color: "var(--muted)" }} />
                  </div>
                </Link>
              </Card>
            </>
          )}

          {/* Theme */}
          {order.theme && (
            <>
              <SectionHeader>Theme</SectionHeader>
              <Card padding={14}>
                <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{order.theme}</div>
                {Array.isArray(order.add_ons) && order.add_ons.length > 0 && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line-soft)" }}>
                    <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                      Add-ons
                    </div>
                    {order.add_ons.map((a: string, i: number) => (
                      <div key={i} style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                        <Icon.Check size={14} style={{ color: "var(--caramel)" }} /> {a}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}

          {/* Recipe */}
          {recipe && (
            <>
              <SectionHeader>Recipe</SectionHeader>
              <Card padding={0}>
                <Link href={`/recipes/${recipe.id}`} style={{ display: "block", padding: 14, textDecoration: "none", color: "inherit" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <CakeArt tone="caramel" size={44} label={recipe.name.split(" ")[0]} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{recipe.name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                        {recipe.prep_mins}m prep · {recipe.bake_mins}m bake · cost {fmtMoney(recipe.cost_per_cake)}
                      </div>
                    </div>
                    <Icon.Chevron size={16} style={{ color: "var(--muted)" }} />
                  </div>
                </Link>
              </Card>
            </>
          )}

          {/* Delivery */}
          <SectionHeader>Delivery</SectionHeader>
          <Card padding={0}>
            <div style={{ padding: 14, display: "flex", gap: 12 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: "var(--caramel-soft)",
                  color: "var(--caramel-deep)",
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "DM Serif Display, serif",
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9.5, opacity: 0.8 }}>
                    {order.delivery_date ? new Date(order.delivery_date).toLocaleString("en-US", { weekday: "short" }).toUpperCase() : "—"}
                  </div>
                  <div style={{ fontSize: 18 }}>{order.delivery_date ? new Date(order.delivery_date).getDate() : "—"}</div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                  {fmtDate(order.delivery_date, { showYear: true })} · {order.delivery_slot}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                  <Icon.Pin size={11} /> {order.delivery_area}
                </div>
              </div>
            </div>
            {order.cold_chain_notes && (
              <div
                style={{
                  margin: "0 14px 14px",
                  padding: "10px 12px",
                  background: "oklch(0.95 0.04 200)",
                  border: "1px solid oklch(0.82 0.07 200)",
                  borderRadius: "var(--r-sm)",
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                <Icon.Sparkle size={14} style={{ color: "oklch(0.40 0.10 200)", flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10.5, color: "oklch(0.32 0.10 200)", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 700 }}>
                    Cold chain
                  </div>
                  <div style={{ fontSize: 12, color: "oklch(0.30 0.07 200)", marginTop: 3, lineHeight: 1.45 }}>
                    {order.cold_chain_notes}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Payment */}
          <SectionHeader>Payment</SectionHeader>
          <Card padding={0}>
            <div style={{ padding: 14, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>Total</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{fmtMoney(order.price ?? 0)}</span>
            </div>
            <div style={{ padding: "0 14px 4px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>
                Deposit received{order.payment_mode ? ` · ${order.payment_mode}` : ""}
              </span>
              <span style={{ fontSize: 14, color: "var(--ok)" }}>−{fmtMoney(order.deposit ?? 0)}</span>
            </div>
            {(order.deposit ?? 0) > 0 && order.payment_mode === "UPI" && (
              <div style={{ padding: "0 14px 4px" }}>
                {order.upi_reference_utr ? (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 11.5, color: "var(--muted)" }}>
                    <span>UTR · {order.payer_vpa || "VPA not captured"}</span>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", color: "var(--ink-soft)" }}>
                      {order.upi_reference_utr}
                    </span>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "oklch(0.95 0.07 80)",
                      border: "1px solid oklch(0.82 0.12 80)",
                      color: "oklch(0.38 0.10 70)",
                      padding: "8px 10px",
                      borderRadius: "var(--r-sm)",
                      fontSize: 11.5,
                    }}
                  >
                    <Icon.Bell size={13} />
                    <span style={{ flex: 1 }}>UTR missing — reconciliation will need manual matching</span>
                  </div>
                )}
              </div>
            )}
            <div
              style={{
                padding: 14,
                paddingTop: 10,
                borderTop: "1px solid var(--line-soft)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600 }}>Balance due</span>
              <span
                style={{
                  fontFamily: "DM Serif Display, serif",
                  fontSize: 18,
                  color: (order.balance ?? 0) > 0 ? "var(--ink)" : "var(--ok)",
                }}
              >
                {fmtMoney(order.balance ?? 0)}
              </span>
            </div>
          </Card>

          {order.notes && (
            <>
              <SectionHeader>Notes</SectionHeader>
              <Card padding={14}>
                <div style={{ fontSize: 13, lineHeight: 1.5, fontStyle: "italic", color: "var(--ink-soft)" }}>
                  &ldquo;{order.notes}&rdquo;
                </div>
              </Card>
            </>
          )}

          <div style={{ height: 14 }} />
        </div>
      </div>
    </PhoneShell>
  );
}

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
