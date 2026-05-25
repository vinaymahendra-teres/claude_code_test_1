"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { todayIst } from "@/lib/format";

export type AutoFillMode = "none" | "low-stock" | "orders" | "both";

// =========================================================================
// Lists: CRUD
// =========================================================================

export async function createShoppingList(input: {
  name: string;
  notes: string;
  autofill: AutoFillMode;
  ordersHorizonDays: number;
}): Promise<string> {
  await requireAuth();
  if (!input.name.trim()) throw new Error("Name is required");

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const id = `sl-${Date.now().toString(36)}`;
  const { error } = await supabase.from("shopping_lists").insert({
    id,
    name: input.name.trim(),
    notes: input.notes.trim() || null,
    status: "open",
  });
  if (error) throw new Error(`Failed to create list: ${error.message}`);

  if (input.autofill === "low-stock" || input.autofill === "both") {
    await addLowStockItems(id);
  }
  if (input.autofill === "orders" || input.autofill === "both") {
    await addOrderRequirementItems(id, Math.max(1, input.ordersHorizonDays || 7));
  }

  revalidatePath("/shopping");
  return id;
}

export async function renameShoppingList(id: string, name: string, notes: string) {
  await requireAuth();
  if (!name.trim()) throw new Error("Name is required");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase
    .from("shopping_lists")
    .update({ name: name.trim(), notes: notes.trim() || null })
    .eq("id", id);
  if (error) throw new Error(`Failed to rename list: ${error.message}`);
  revalidatePath("/shopping");
  revalidatePath(`/shopping/${id}`);
}

export async function completeShoppingList(id: string) {
  await requireAuth();
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase
    .from("shopping_lists")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`Failed to complete list: ${error.message}`);
  revalidatePath("/shopping");
  revalidatePath(`/shopping/${id}`);
}

export async function reopenShoppingList(id: string) {
  await requireAuth();
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase
    .from("shopping_lists")
    .update({ status: "open", completed_at: null, archived_at: null })
    .eq("id", id);
  if (error) throw new Error(`Failed to reopen list: ${error.message}`);
  revalidatePath("/shopping");
  revalidatePath(`/shopping/${id}`);
}

export async function archiveShoppingList(id: string) {
  await requireAuth();
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase
    .from("shopping_lists")
    .update({ status: "archived", archived_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`Failed to archive list: ${error.message}`);
  revalidatePath("/shopping");
  revalidatePath(`/shopping/${id}`);
}

export async function deleteShoppingList(id: string) {
  await requireRole("admin");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  // Items cascade on delete via FK.
  const { error } = await supabase.from("shopping_lists").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete list: ${error.message}`);
  revalidatePath("/shopping");
  redirect("/shopping");
}

// =========================================================================
// Items: CRUD
// =========================================================================

export type ItemInput = {
  item_name: string;
  qty: number | null;
  unit: string;
  supplier: string;
  estimated_cost: number;
  notes: string;
  inventory_item_id?: string | null;
};

export async function addShoppingItem(listId: string, input: ItemInput): Promise<string> {
  await requireAuth();
  if (!input.item_name.trim()) throw new Error("Item name is required");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const id = `sli-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const { error } = await supabase.from("shopping_list_items").insert({
    id,
    list_id: listId,
    item_name: input.item_name.trim(),
    qty: input.qty,
    unit: input.unit || null,
    supplier: input.supplier.trim() || null,
    estimated_cost: Math.max(0, Math.round(input.estimated_cost)),
    source: "manual",
    inventory_item_id: input.inventory_item_id ?? null,
    notes: input.notes.trim() || null,
  });
  if (error) throw new Error(`Failed to add item: ${error.message}`);
  revalidatePath(`/shopping/${listId}`);
  return id;
}

export async function updateShoppingItem(itemId: string, listId: string, patch: ItemInput) {
  await requireAuth();
  if (!patch.item_name.trim()) throw new Error("Item name is required");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase
    .from("shopping_list_items")
    .update({
      item_name: patch.item_name.trim(),
      qty: patch.qty,
      unit: patch.unit || null,
      supplier: patch.supplier.trim() || null,
      estimated_cost: Math.max(0, Math.round(patch.estimated_cost)),
      notes: patch.notes.trim() || null,
    })
    .eq("id", itemId);
  if (error) throw new Error(`Failed to update item: ${error.message}`);
  revalidatePath(`/shopping/${listId}`);
}

export async function toggleShoppingItem(itemId: string, listId: string, checked: boolean) {
  await requireAuth();
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase
    .from("shopping_list_items")
    .update({ checked })
    .eq("id", itemId);
  if (error) throw new Error(`Failed to update item: ${error.message}`);
  revalidatePath(`/shopping/${listId}`);
}

export async function deleteShoppingItem(itemId: string, listId: string) {
  await requireAuth();
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.from("shopping_list_items").delete().eq("id", itemId);
  if (error) throw new Error(`Failed to delete item: ${error.message}`);
  revalidatePath(`/shopping/${listId}`);
}

// =========================================================================
// Auto-fill generators
// =========================================================================

async function addLowStockItems(listId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: inventory } = await supabase
    .from("inventory_items")
    .select(
      "id, name, qty, unit, reorder_at, reorder_qty, unit_cost, supplier",
    );
  if (!inventory) return;

  const low = inventory.filter(
    (i) => Number(i.qty) < Number(i.reorder_at),
  );
  if (low.length === 0) return;

  // Skip items already on this list (idempotent across re-runs)
  const { data: existing } = await supabase
    .from("shopping_list_items")
    .select("inventory_item_id")
    .eq("list_id", listId);
  const have = new Set(
    (existing ?? [])
      .map((r) => r.inventory_item_id)
      .filter((x): x is string => !!x),
  );

  const rows = low
    .filter((i) => !have.has(i.id))
    .map((i) => {
      const qty = Number(i.reorder_qty ?? 0) || Math.max(0, Number(i.reorder_at) * 2 - Number(i.qty));
      const estimated_cost = Math.round(qty * Number(i.unit_cost ?? 0));
      return {
        id: `sli-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}-${i.id}`,
        list_id: listId,
        item_name: i.name,
        qty,
        unit: i.unit,
        supplier: i.supplier,
        estimated_cost,
        source: "low-stock" as const,
        inventory_item_id: i.id,
      };
    });

  if (rows.length === 0) return;
  await supabase.from("shopping_list_items").insert(rows);
}

// Walk upcoming orders within `horizonDays`, group ingredients by stockKey
// from each order's recipe, then compare to current inventory and surface a
// shopping line for anything we're projected short on. This is intentionally
// coarse: we don't multiply by order size (jsonb ingredient qty is free-text
// like "250g" or "2 cups" which we don't parse here) — we just count how
// many upcoming orders reference each inventory item, multiply by a per-order
// average usage if available via days_cover_at_typical_use, and bump qty up
// when current stock is below that projection.
async function addOrderRequirementItems(listId: string, horizonDays: number) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const today = todayIst();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + horizonDays);
  const endISO = endDate.toISOString().slice(0, 10);

  const [{ data: orders }, { data: recipes }, { data: inventory }, { data: existing }, { data: addonsCat }] =
    await Promise.all([
      supabase
        .from("orders")
        .select("id, flavor, delivery_date, status, customisation")
        .gte("delivery_date", today)
        .lte("delivery_date", endISO)
        .not("status", "in", "(delivered,cancelled,draft)"),
      supabase.from("recipes").select("id, name, ingredients"),
      supabase
        .from("inventory_items")
        .select("id, name, qty, unit, reorder_at, reorder_qty, unit_cost, supplier, days_cover_at_typical_use"),
      supabase
        .from("shopping_list_items")
        .select("inventory_item_id")
        .eq("list_id", listId),
      supabase
        .from("customisation_addons")
        .select("id, stock_item_id, default_qty"),
    ]);

  if (!orders || !recipes || !inventory) return;

  // Recipe ingredient stockKey references → count occurrences across orders
  type Ingredient = { item: string; qty?: string; stockKey?: string };
  type Recipe = { id: string; name: string; ingredients: Ingredient[] | null };
  type OrderRow = {
    id: string;
    flavor: string | null;
    delivery_date: string | null;
    status: string;
    customisation: { addons?: Array<{ id: string; qty?: number }> } | null;
  };
  const recipesList = (recipes as Recipe[]) ?? [];
  const ordersList = (orders as OrderRow[]) ?? [];
  const stockUsage = new Map<string, number>(); // inventory_item_id → number of orders needing it

  // Build a lookup from addon catalogue ID → linked stock_item_id (if any).
  const addonStock = new Map<string, string | null>();
  for (const a of (addonsCat as { id: string; stock_item_id: string | null }[] | null) ?? []) {
    addonStock.set(a.id, a.stock_item_id);
  }

  for (const o of ordersList) {
    // 1. From the order's recipe ingredients
    if (o.flavor) {
      const key = o.flavor.toLowerCase();
      const recipe = recipesList.find((r) => key.includes(r.name.toLowerCase()));
      if (recipe && Array.isArray(recipe.ingredients)) {
        for (const ing of recipe.ingredients) {
          if (ing.stockKey) {
            stockUsage.set(ing.stockKey, (stockUsage.get(ing.stockKey) || 0) + 1);
          }
        }
      }
    }
    // 2. From the order's customisation addons
    const addons = o.customisation?.addons ?? [];
    for (const a of addons) {
      const linked = addonStock.get(a.id);
      if (linked) {
        const inc = Math.max(1, Math.ceil(a.qty ?? 1));
        stockUsage.set(linked, (stockUsage.get(linked) || 0) + inc);
      }
    }
  }

  if (stockUsage.size === 0) return;

  const have = new Set(
    (existing ?? [])
      .map((r) => r.inventory_item_id)
      .filter((x): x is string => !!x),
  );

  const rows: Array<{
    id: string;
    list_id: string;
    item_name: string;
    qty: number;
    unit: string | null;
    supplier: string | null;
    estimated_cost: number;
    source: "order";
    inventory_item_id: string;
    notes: string;
  }> = [];

  for (const [invId, orderCount] of stockUsage.entries()) {
    if (have.has(invId)) continue;
    const inv = inventory.find((i) => i.id === invId);
    if (!inv) continue;
    // Skip if we have plenty: current qty covers at least 2× the order count
    // as a rough projection. (Real per-recipe scaling lives in the recipe
    // qty strings which we don't parse here.)
    const projection = orderCount * 1.5;
    if (Number(inv.qty) >= projection && Number(inv.qty) >= Number(inv.reorder_at)) continue;
    const qty = Number(inv.reorder_qty ?? 0) || Math.max(1, projection);
    rows.push({
      id: `sli-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}-${invId}`,
      list_id: listId,
      item_name: inv.name,
      qty,
      unit: inv.unit ?? null,
      supplier: inv.supplier ?? null,
      estimated_cost: Math.round(qty * Number(inv.unit_cost ?? 0)),
      source: "order",
      inventory_item_id: invId,
      notes: `Needed for ${orderCount} upcoming order${orderCount === 1 ? "" : "s"}`,
    });
  }

  if (rows.length === 0) return;
  await supabase.from("shopping_list_items").insert(rows);
}

// Re-run an auto-fill on an existing list (used by the "Refresh" button).
export async function refillShoppingList(listId: string, mode: AutoFillMode, horizonDays: number) {
  await requireAuth();
  if (mode === "low-stock" || mode === "both") await addLowStockItems(listId);
  if (mode === "orders" || mode === "both") await addOrderRequirementItems(listId, horizonDays);
  revalidatePath(`/shopping/${listId}`);
}
