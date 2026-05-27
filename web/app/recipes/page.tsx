import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { PhoneShell } from "@/components/PhoneShell";
import { Card, CakeArt, Pill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { fmtMoney } from "@/lib/format";

// Recipes catalogue changes rarely — bump TTL to an hour. Admin mutations
// already call revalidatePath('/recipes') so an edit invalidates the
// cache immediately rather than waiting on this TTL to expire.
export const revalidate = 3600;

const TABS = [
  { value: "all", label: "All" },
  { value: "signature", label: "Signature" },
  { value: "eggless", label: "Eggless" },
];

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const tab = TABS.some((t) => t.value === rawTab) ? rawTab! : "all";

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data } = await supabase
    .from("recipes")
    .select("id, name, category, eggless, yield_note, prep_mins, bake_mins, cost_per_cake")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  const all = data ?? [];
  const list =
    tab === "eggless"
      ? all.filter((r) => r.eggless)
      : tab === "signature"
        ? all.filter((r) => r.category === "Signature")
        : all;

  return (
    <PhoneShell>
      <div data-screen-label="Recipes">
        <header style={chromeHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 32 }}>
            <Link href="/" style={chromeBtn} aria-label="Back">
              <Icon.ChevronLeft size={22} />
            </Link>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--font-serif), DM Serif Display, serif", fontSize: 21, lineHeight: 1.15 }}>
                Recipes
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                {all.length} on the menu
              </div>
            </div>
          </div>
        </header>

        <div
          style={{
            padding: "10px 18px 8px",
            borderBottom: "1px solid var(--line-soft)",
            background: "var(--bg)",
          }}
        >
          <TabRow current={tab} />
        </div>

        <div style={{ padding: "12px 18px 100px", overflowY: "auto", flex: 1, minHeight: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {list.map((r) => (
              <Link
                key={r.id}
                href={`/recipes/${r.id}`}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line-soft)",
                  borderRadius: "var(--r-lg)",
                  padding: 10,
                  boxShadow: "var(--shadow-sm)",
                  textDecoration: "none",
                  color: "inherit",
                  display: "block",
                }}
              >
                <CakeArt
                  tone={r.eggless ? "sage" : r.category === "Signature" ? "caramel" : "rose"}
                  size={170}
                  label={r.name}
                  style={{ width: "100%", height: 110, borderRadius: 12, marginBottom: 10 }}
                />
                <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{r.name}</div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    marginTop: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Icon.Clock size={11} /> {Number(r.prep_mins) + Number(r.bake_mins)}m
                  <span
                    style={{
                      marginLeft: "auto",
                      color: "var(--ink)",
                      fontWeight: 600,
                    }}
                  >
                    {fmtMoney(r.cost_per_cake ?? 0)}
                  </span>
                </div>
                {r.eggless && (
                  <Pill tone="sage" size="xs" style={{ marginTop: 6 }}>
                    Eggless
                  </Pill>
                )}
              </Link>
            ))}
          </div>

          {list.length === 0 && (
            <Card style={{ textAlign: "center", padding: 28 }}>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>Nothing in this filter.</div>
            </Card>
          )}
        </div>
      </div>
    </PhoneShell>
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
            href={`/recipes?tab=${t.value}`}
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
