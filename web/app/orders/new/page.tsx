import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { NewOrderForm } from "./NewOrderForm";
import { todayIst } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const TODAY = todayIst();

  const [
    { data: customers },
    { data: recipes },
    { data: blocked },
    { data: orders },
    { data: settings },
    { data: productLines },
    { data: addons },
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("id, name, phone, instagram, area, tags, order_count, avatar_tone")
      .order("name"),
    supabase
      .from("recipes")
      .select("id, name, eggless, cost_per_cake")
      .order("name"),
    supabase.from("blocked_dates").select("date, reason, type"),
    supabase.from("orders").select("delivery_date, status").gte("delivery_date", TODAY),
    supabase.from("bakery_settings").select("value").eq("key", "calendar").maybeSingle(),
    supabase
      .from("product_lines")
      .select("id, name, label, sizes, default_unit, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("customisation_addons")
      .select("id, name, category, default_cost, default_qty, unit, is_active, sort_order, notes, stock_item_id")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  const calendarValue = (settings?.value as { capacityCeiling?: number } | undefined) ?? {};
  const capacityCeiling =
    typeof calendarValue.capacityCeiling === "number" ? calendarValue.capacityCeiling : 3;

  const loadByDate: Record<string, number> = {};
  (orders ?? []).forEach((o) => {
    if (!o.delivery_date || o.status === "draft") return;
    loadByDate[o.delivery_date] = (loadByDate[o.delivery_date] || 0) + 1;
  });

  const blockedByDate: Record<string, { reason: string; type: string | null }> = {};
  (blocked ?? []).forEach((b) => {
    if (b.date) blockedByDate[b.date] = { reason: b.reason, type: b.type };
  });

  return (
    <NewOrderForm
      customers={
        (customers ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone ?? "",
          instagram: c.instagram ?? "",
          area: c.area ?? "",
          tags: c.tags ?? [],
          orderCount: c.order_count ?? 0,
          avatarTone: c.avatar_tone ?? "caramel",
        })) as Customer[]
      }
      recipes={
        (recipes ?? []).map((r) => ({
          id: r.id,
          name: r.name,
          eggless: !!r.eggless,
          costPerCake: r.cost_per_cake ?? 0,
        })) as Recipe[]
      }
      capacityCeiling={capacityCeiling}
      loadByDate={loadByDate}
      blockedByDate={blockedByDate}
      today={TODAY}
      productLines={
        (productLines ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          label: p.label,
          default_unit: p.default_unit ?? "",
          sizes: Array.isArray(p.sizes) ? (p.sizes as ProductLineSize[]) : [],
        })) as ProductLine[]
      }
      addons={
        (addons ?? []).map((a) => ({
          id: a.id,
          name: a.name,
          category: a.category,
          default_cost: a.default_cost ?? 0,
          default_qty: Number(a.default_qty ?? 1),
          unit: a.unit ?? "",
          stock_item_id: a.stock_item_id ?? null,
          notes: a.notes ?? null,
          is_active: !!a.is_active,
          sort_order: a.sort_order ?? 999,
        }))
      }
    />
  );
}

export type ProductLineSize = {
  name: string;
  servings: number;
  price_hint?: number;
  notes?: string;
};

export type ProductLine = {
  id: string;
  name: string;
  label: string;
  default_unit: string;
  sizes: ProductLineSize[];
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  instagram: string;
  area: string;
  tags: string[];
  orderCount: number;
  avatarTone: string;
};

export type Recipe = {
  id: string;
  name: string;
  eggless: boolean;
  costPerCake: number;
};
