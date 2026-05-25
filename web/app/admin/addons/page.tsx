import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { auth, hasRole } from "@/auth";
import { PhoneShell } from "@/components/PhoneShell";
import { Card, Pill, SectionHeader } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { fmtMoney } from "@/lib/format";
import { AddAddonButton } from "./AddAddonButton";
import { AddonRowActions } from "./AddonRowActions";
import type { AddonRow } from "./actions";

export const dynamic = "force-dynamic";

export default async function AddonsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/addons");
  if (!hasRole(session.user.role, "admin")) redirect("/");

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const [{ data: addons }, { data: inventory }] = await Promise.all([
    supabase
      .from("customisation_addons")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("inventory_items")
      .select("id, name, unit")
      .order("name"),
  ]);

  const rows = (addons as AddonRow[] | null) ?? [];
  const grouped = new Map<string, AddonRow[]>();
  for (const r of rows) {
    const key = r.category;
    const list = grouped.get(key) ?? [];
    list.push(r);
    grouped.set(key, list);
  }

  const invList = (inventory ?? []).map((i) => ({ id: i.id, name: i.name, unit: i.unit ?? "" }));

  return (
    <PhoneShell>
      <div data-screen-label="Customisation addons">
        <header style={chromeHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 32 }}>
            <Link href="/" style={chromeBtn} aria-label="Back">
              <Icon.ChevronLeft size={22} />
            </Link>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 21, lineHeight: 1.15 }}>
                Customisation addons
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                {rows.length} in catalogue · {rows.filter((r) => r.is_active).length} active
              </div>
            </div>
            <AddAddonButton inventory={invList} />
          </div>
        </header>

        <div style={{ padding: "12px 18px 100px", overflowY: "auto", flex: 1 }}>
          {Array.from(grouped.entries()).map(([cat, list]) => (
            <div key={cat} style={{ marginBottom: 16 }}>
              <SectionHeader>{cat}</SectionHeader>
              <Card padding={0}>
                {list.map((a, i) => (
                  <div
                    key={a.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "11px 14px",
                      borderBottom: i < list.length - 1 ? "1px solid var(--line-soft)" : "none",
                      opacity: a.is_active ? 1 : 0.5,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600 }}>{a.name}</span>
                        {!a.is_active && (
                          <Pill tone="neutral" size="xs">
                            inactive
                          </Pill>
                        )}
                        {a.stock_item_id && (
                          <Pill tone="sage" size="xs">
                            stock-linked
                          </Pill>
                        )}
                      </div>
                      {a.notes && (
                        <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                          {a.notes}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {a.default_cost === 0 ? "free" : fmtMoney(a.default_cost)}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                        {a.default_qty}
                        {a.unit ? ` ${a.unit}` : ""}
                      </div>
                    </div>
                    <AddonRowActions addon={a} inventory={invList} />
                  </div>
                ))}
              </Card>
            </div>
          ))}

          {rows.length === 0 && (
            <Card style={{ textAlign: "center", padding: 28 }}>
              <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 18, marginBottom: 6 }}>
                Empty catalogue
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
                Run <code>npm run seed:addons</code> for the starter set, or tap + to add the first
                addon.
              </div>
            </Card>
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
