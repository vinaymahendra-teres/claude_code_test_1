import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { PhoneShell } from "@/components/PhoneShell";
import { Card, Avatar } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { markReceived } from "./actions";
import { todayIst } from "@/lib/format";
import { getActiveBranchId } from "@/lib/branch-context";

export const revalidate = 60;

export default async function ReviewsPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const TODAY = todayIst();
  const activeBranch = await getActiveBranchId();

  let q = supabase
    .from("orders")
    .select(
      "id, customer_id, title, delivery_date, feedback_received, branch_id, customers (name, avatar_tone)",
    )
    .eq("status", "delivered")
    .neq("feedback_received", "Y");
  if (activeBranch) q = q.eq("branch_id", activeBranch);
  const { data: orders } = await q;

  const today = new Date(TODAY);
  const queue = (orders ?? [])
    .map((o) => {
      const d = o.delivery_date ? new Date(o.delivery_date) : null;
      const days = d ? Math.round((today.getTime() - d.getTime()) / 86400000) : 0;
      return { ...o, days };
    })
    .filter((o) => o.days >= 0)
    .sort((a, b) => a.days - b.days);

  return (
    <PhoneShell>
      <div data-screen-label="Reviews">
        <header style={chromeHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 32 }}>
            <Link href="/" style={chromeBtn} aria-label="Back">
              <Icon.ChevronLeft size={22} />
            </Link>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--font-serif), DM Serif Display, serif", fontSize: 21, lineHeight: 1.15 }}>
                Reviews
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                {queue.length === 0
                  ? "All caught up"
                  : `${queue.length} customer${queue.length === 1 ? "" : "s"} to ask`}
              </div>
            </div>
          </div>
        </header>

        <div style={{ padding: "14px 18px 100px", overflowY: "auto", flex: 1, minHeight: 0 }}>
          {queue.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "var(--sage-soft)",
                  color: "oklch(0.34 0.07 145)",
                  display: "inline-grid",
                  placeItems: "center",
                  marginBottom: 14,
                }}
              >
                <Icon.Check size={32} />
              </div>
              <div style={{ fontFamily: "var(--font-serif), DM Serif Display, serif", fontSize: 20, color: "var(--ink)" }}>
                No reviews to ask for
              </div>
              <div style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
                Delivered orders without a recorded review will appear here
                <br />
                on T+2 to remind you.
              </div>
            </div>
          ) : (
            <>
              <p
                style={{
                  fontSize: 12.5,
                  color: "var(--muted)",
                  margin: "0 4px 14px",
                  lineHeight: 1.5,
                }}
              >
                T+2 follow-up — review requests get the best response 2–7 days after delivery while the cake is still memorable.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {queue.map((o) => {
                  const c = Array.isArray(o.customers) ? o.customers[0] : o.customers;
                  const stale = o.days > 7;
                  const boundMark = markReceived.bind(null, o.id);
                  return (
                    <Card
                      key={o.id}
                      padding={0}
                      style={{ border: "1px solid " + (stale ? "var(--line)" : "var(--caramel-soft)") }}
                    >
                      <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                        <Avatar
                          name={c?.name || "?"}
                          tone={(c?.avatar_tone as "caramel" | "rose" | "sage") || "caramel"}
                          size={42}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25 }}>
                            {c?.name}
                          </div>
                          <div
                            style={{
                              fontSize: 11.5,
                              color: "var(--muted)",
                              marginTop: 2,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {o.title}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: stale ? "var(--danger)" : "var(--ink-soft)",
                              marginTop: 4,
                              fontWeight: 500,
                            }}
                          >
                            delivered {o.days === 0 ? "today" : `${o.days}d ago`}
                            {stale && " · stale"}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          borderTop: "1px solid var(--line-soft)",
                        }}
                      >
                        <form action={boundMark}>
                          <button
                            type="submit"
                            style={{
                              background: "transparent",
                              border: "none",
                              borderRight: "1px solid var(--line-soft)",
                              padding: "10px 0",
                              cursor: "pointer",
                              fontFamily: "inherit",
                              fontSize: 12.5,
                              fontWeight: 600,
                              color: "var(--ink-soft)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6,
                              width: "100%",
                            }}
                          >
                            <Icon.Check size={14} /> Mark received
                          </button>
                        </form>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(
                            `Hi ${c?.name?.split(" ")[0] ?? ""}! Hope you enjoyed the cake. If you have a moment, a quick review would mean a lot.`,
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: "10px 0",
                            textDecoration: "none",
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: "var(--caramel-deep)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                          }}
                        >
                          <Icon.Whatsapp size={14} /> Ask for review
                        </a>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
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
