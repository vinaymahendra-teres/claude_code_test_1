import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { NewOrderForm } from "./NewOrderForm";

export const dynamic = "force-dynamic";

const TODAY = "2026-05-24";

export default async function NewOrderPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const [{ data: customers }, { data: recipes }, { data: blocked }, { data: orders }, { data: settings }] =
    await Promise.all([
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
    />
  );
}

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
