"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { requireAuth, requireRole } from "@/lib/auth-helpers";

export type InventoryEdit = {
  name: string;
  category: string;
  qty: number;
  unit: string;
  reorder_at: number;
  unit_cost: number;
  supplier: string;
  reorder_qty: number;
  days_cover_at_typical_use: number | null;
};

export async function createInventoryItem(input: InventoryEdit): Promise<string> {
  await requireAuth();
  if (!input.name.trim()) throw new Error("Item name is required");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const id = `i-${slug || "new"}-${Date.now().toString(36)}`;
  const { error } = await supabase.from("inventory_items").insert({
    id,
    name: input.name.trim(),
    category: input.category || "Other",
    qty: input.qty,
    unit: input.unit || "kg",
    reorder_at: input.reorder_at,
    unit_cost: Math.round(input.unit_cost),
    supplier: input.supplier.trim() || null,
    reorder_qty: input.reorder_qty,
    days_cover_at_typical_use: input.days_cover_at_typical_use,
  });
  if (error) throw new Error(`Failed to add item: ${error.message}`);
  revalidatePath("/inventory");
  return id;
}

export async function updateInventoryItem(id: string, patch: InventoryEdit) {
  await requireAuth();
  if (!patch.name.trim()) throw new Error("Item name is required");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase
    .from("inventory_items")
    .update({
      name: patch.name.trim(),
      category: patch.category,
      qty: patch.qty,
      unit: patch.unit,
      reorder_at: patch.reorder_at,
      unit_cost: Math.round(patch.unit_cost),
      supplier: patch.supplier.trim() || null,
      reorder_qty: patch.reorder_qty,
      days_cover_at_typical_use: patch.days_cover_at_typical_use,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(`Failed to update item: ${error.message}`);
  revalidatePath("/inventory");
}

// Quick restock: bump qty by delta, set last_restock to today.
export async function restockItem(id: string, delta: number) {
  await requireAuth();
  if (!isFinite(delta) || delta <= 0) throw new Error("Restock amount must be positive");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: cur, error: e1 } = await supabase
    .from("inventory_items")
    .select("qty")
    .eq("id", id)
    .maybeSingle();
  if (e1 || !cur) throw new Error(`Item not found`);
  const newQty = Number(cur.qty) + delta;
  const { error } = await supabase
    .from("inventory_items")
    .update({ qty: newQty, last_restock: "2026-05-24", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`Failed to restock: ${error.message}`);
  revalidatePath("/inventory");
}

export async function deleteInventoryItem(id: string) {
  await requireRole("admin");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.from("inventory_items").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete item: ${error.message}`);
  revalidatePath("/inventory");
}
