import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { PhoneShell } from "@/components/PhoneShell";
import { Card, CakeArt, Pill, SectionHeader, StatTile } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { fmtMoney } from "@/lib/format";
import { EditRecipeSheet } from "./EditRecipeSheet";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { deleteRecipe } from "./actions";
import { AttachmentGrid } from "@/components/AttachmentGrid";
import { listAttachments } from "@/lib/attachments-actions";

// Single-recipe page changes rarely; edit actions revalidate this path.
export const revalidate = 3600;

type Ingredient = { item: string; qty: string; stockKey?: string };

type Recipe = {
  id: string;
  name: string;
  category: string | null;
  eggless: boolean | null;
  yield_note: string | null;
  prep_mins: number | null;
  bake_mins: number | null;
  cost_per_cake: number | null;
  ingredients: Ingredient[] | null;
  method: string[] | null;
};

type Stock = { id: string; qty: number; reorder_at: number };

// Parse a step string for an embedded duration, e.g. "Bake at 180°C for 35 minutes".
function parseStepDuration(text: string): number | null {
  if (!text) return null;
  let m = text.match(/(\d+(?:\.\d+)?)\s*(?:min(?:ute)?s?|m\b)/i);
  if (m) return Math.round(parseFloat(m[1]) * 60 * 1000);
  m = text.match(/(\d+)\s*(?:sec(?:ond)?s?|s\b)/i);
  if (m) return parseInt(m[1], 10) * 1000;
  return null;
}

function fmtTimerTime(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const [{ data: recipeRow }, { data: inventory }] = await Promise.all([
    supabase
      .from("recipes")
      .select(
        "id, name, category, eggless, yield_note, prep_mins, bake_mins, cost_per_cake, ingredients, method",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("inventory_items").select("id, qty, reorder_at"),
  ]);

  if (!recipeRow) notFound();
  const r = recipeRow as Recipe;
  const ingredients: Ingredient[] = Array.isArray(r.ingredients) ? r.ingredients : [];
  const method: string[] = Array.isArray(r.method) ? r.method : [];
  const stockMap = new Map<string, Stock>();
  (inventory as Stock[] | null)?.forEach((s) => stockMap.set(s.id, s));

  const tone = r.eggless ? "sage" : "caramel";
  const totalMins = (r.prep_mins ?? 0) + (r.bake_mins ?? 0);

  const gallery = await listAttachments("recipe", r.id);

  return (
    <PhoneShell>
      <div data-screen-label="Recipe Detail">
        <header style={chromeHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 32 }}>
            <Link href="/recipes" style={chromeBtn} aria-label="Back">
              <Icon.ChevronLeft size={22} />
            </Link>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--font-serif), DM Serif Display, serif", fontSize: 21, lineHeight: 1.15 }}>
                {r.name}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                {r.category}
                {r.yield_note ? ` · ${r.yield_note}` : ""}
              </div>
            </div>
          </div>
        </header>

        <div style={{ padding: "0 0 100px", overflowY: "auto", flex: 1, minHeight: 0 }}>
          <CakeArt tone={tone} label={r.name} style={{ width: "100%", height: 180 }} />

          <div style={{ padding: "18px 18px 0" }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
              {r.category && (
                <Pill tone="caramel" size="xs">
                  {r.category}
                </Pill>
              )}
              {r.eggless && (
                <Pill tone="sage" size="xs">
                  Eggless
                </Pill>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              <StatTile label="Prep" value={`${r.prep_mins ?? 0}m`} tone="rose" />
              <StatTile label="Bake" value={`${r.bake_mins ?? 0}m`} tone="caramel" />
              <StatTile label="Cost" value={fmtMoney(r.cost_per_cake ?? 0)} tone="sage" />
            </div>

            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
              {totalMins}m total ·{" "}
              {ingredients.length} ingredient{ingredients.length === 1 ? "" : "s"} ·{" "}
              {method.length} step{method.length === 1 ? "" : "s"}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <EditRecipeSheet
                id={r.id}
                initial={{
                  name: r.name,
                  category: r.category ?? "Other",
                  eggless: !!r.eggless,
                  yield_note: r.yield_note ?? "",
                  prep_mins: r.prep_mins ?? 0,
                  bake_mins: r.bake_mins ?? 0,
                  cost_per_cake: r.cost_per_cake ?? 0,
                  ingredients,
                  method,
                }}
              />
              <ConfirmDelete
                label={r.name}
                description="Removes this recipe permanently. Orders that reference it by flavor name keep history but lose the recipe link."
                confirmWord="DELETE"
                buttonLabel="Delete recipe"
                onConfirm={deleteRecipe.bind(null, r.id)}
              />
            </div>

            <SectionHeader>Gallery</SectionHeader>
            <AttachmentGrid
              entityType="recipe"
              entityId={r.id}
              kind="gallery"
              initial={gallery}
              emptyHint="Add finished cake photos — feeds the website and the order conversation."
            />

            {ingredients.length > 0 && (
              <>
                <SectionHeader>Ingredients</SectionHeader>
                <Card padding={0}>
                  {ingredients.map((ing, i) => {
                    const stock = ing.stockKey ? stockMap.get(ing.stockKey) : null;
                    const low =
                      stock != null && Number(stock.qty) < Number(stock.reorder_at);
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 14px",
                          borderBottom:
                            i < ingredients.length - 1 ? "1px solid var(--line-soft)" : "none",
                        }}
                      >
                        <span
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 8,
                            background: low ? "oklch(0.95 0.07 80)" : "var(--surface-3)",
                            color: low ? "oklch(0.42 0.12 70)" : "var(--muted)",
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          {low ? <Icon.Bell size={13} /> : <Icon.Check size={13} />}
                        </span>
                        <div style={{ flex: 1, fontSize: 13.5 }}>{ing.item}</div>
                        <span
                          style={{
                            fontSize: 12.5,
                            color: "var(--ink-soft)",
                            fontFamily: "var(--font-mono), JetBrains Mono, monospace",
                          }}
                        >
                          {ing.qty}
                        </span>
                      </div>
                    );
                  })}
                </Card>
              </>
            )}

            {method.length > 0 && (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    margin: "20px 4px 10px",
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "var(--font-serif), DM Serif Display, serif",
                      fontSize: 15,
                      fontWeight: 400,
                      margin: 0,
                      color: "var(--ink)",
                      letterSpacing: "0.005em",
                      textTransform: "uppercase",
                      opacity: 0.7,
                    }}
                  >
                    Method
                  </h3>
                  <Link
                    href="/kitchen"
                    style={{
                      fontSize: 12,
                      color: "var(--caramel-deep)",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    Kitchen →
                  </Link>
                </div>
                <Card padding={14}>
                  {method.map((m, i) => {
                    const ms = parseStepDuration(m);
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          gap: 12,
                          padding: "8px 0",
                          alignItems: "flex-start",
                          borderTop: i === 0 ? "none" : "1px solid var(--line-soft)",
                        }}
                      >
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 999,
                            background: "var(--caramel-soft)",
                            color: "var(--caramel-deep)",
                            display: "grid",
                            placeItems: "center",
                            fontSize: 11,
                            fontWeight: 700,
                            flexShrink: 0,
                            marginTop: 4,
                          }}
                        >
                          {i + 1}
                        </span>
                        <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.55, paddingTop: 4 }}>
                          {m}
                        </div>
                        {ms != null && (
                          <Link
                            href="/kitchen"
                            title={`Suggested ${fmtTimerTime(ms)} timer — open the kitchen rack`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              background: "var(--caramel-soft)",
                              color: "var(--caramel-deep)",
                              border: "1px solid var(--caramel)",
                              borderRadius: 999,
                              padding: "4px 10px",
                              fontSize: 11,
                              fontWeight: 600,
                              textDecoration: "none",
                              marginTop: 2,
                              flexShrink: 0,
                            }}
                          >
                            <Icon.Clock size={11} />
                            {fmtTimerTime(ms)}
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </Card>
              </>
            )}
          </div>
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
