import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { auth, hasRole } from "@/auth";
import { PhoneShell } from "@/components/PhoneShell";
import { Card, Pill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { fmtMoney } from "@/lib/format";
import { AddLineButton } from "./AddLineButton";
import { LineRowActions } from "./LineRowActions";
import type { ProductLineRow } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProductLinesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/product-lines");
  if (!hasRole(session.user.role, "admin")) redirect("/");

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data } = await supabase
    .from("product_lines")
    .select("*")
    .order("sort_order");
  const rows = (data as ProductLineRow[] | null) ?? [];

  return (
    <PhoneShell>
      <div data-screen-label="Product lines">
        <header style={chromeHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 32 }}>
            <Link href="/" style={chromeBtn} aria-label="Back">
              <Icon.ChevronLeft size={22} />
            </Link>
            <div style={{ flex: 1 }}>
              <div
                style={{ fontFamily: "DM Serif Display, serif", fontSize: 21, lineHeight: 1.15 }}
              >
                Product lines
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                {rows.length} in catalogue · {rows.filter((r) => r.is_active).length} active
              </div>
            </div>
            <AddLineButton />
          </div>
        </header>

        <div style={{ padding: "12px 18px 100px", overflowY: "auto", flex: 1, minHeight: 0 }}>
          {rows.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 28 }}>
              <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 18, marginBottom: 6 }}>
                Empty catalogue
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
                Run <code>npm run seed:product-lines</code> for the starter set, or tap + to add the
                first line.
              </div>
            </Card>
          ) : (
            <Card padding={0}>
              {rows.map((r, i) => (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "12px 14px",
                    borderBottom: i < rows.length - 1 ? "1px solid var(--line-soft)" : "none",
                    opacity: r.is_active ? 1 : 0.55,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{r.label}</span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--muted)",
                          fontFamily: "JetBrains Mono, monospace",
                        }}
                      >
                        {r.name}
                      </span>
                      {!r.is_active && (
                        <Pill tone="neutral" size="xs">
                          inactive
                        </Pill>
                      )}
                    </div>
                    {r.description && (
                      <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
                        {r.description}
                      </div>
                    )}
                    {Array.isArray(r.sizes) && r.sizes.length > 0 && (
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 11.5,
                          color: "var(--ink-soft)",
                          lineHeight: 1.5,
                        }}
                      >
                        {r.sizes.map((s, idx) => (
                          <span key={idx}>
                            {idx > 0 && " · "}
                            <strong>{s.name}</strong>
                            <span style={{ color: "var(--muted)" }}>
                              {" "}
                              {s.servings}p
                              {s.price_hint ? ` · ${fmtMoney(s.price_hint)}` : ""}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <LineRowActions row={r} />
                </div>
              ))}
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
