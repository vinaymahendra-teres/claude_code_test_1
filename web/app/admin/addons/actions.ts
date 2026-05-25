"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { ADDON_CATEGORIES, type AddonCategory } from "@/lib/customisation";

export type AddonRow = {
  id: string;
  name: string;
  category: AddonCategory;
  default_cost: number;
  default_qty: number;
  unit: string | null;
  stock_item_id: string | null;
  notes: string | null;
  is_active: boolean;
  sort_order: number;
};

export type AddonInput = {
  name: string;
  category: AddonCategory;
  default_cost: number;
  default_qty: number;
  unit: string;
  stock_item_id: string | null;
  notes: string;
  is_active: boolean;
  sort_order: number;
};

function assertCategory(c: string): asserts c is AddonCategory {
  if (!ADDON_CATEGORIES.includes(c as AddonCategory)) {
    throw new Error(`Unknown category "${c}"`);
  }
}

export async function listAddons(): Promise<AddonRow[]> {
  await requireAuth();
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase
    .from("customisation_addons")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(`Failed to list addons: ${error.message}`);
  return (data ?? []) as AddonRow[];
}

export async function createAddon(input: AddonInput): Promise<string> {
  await requireRole("admin");
  if (!input.name.trim()) throw new Error("Name is required");
  assertCategory(input.category);
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const slug = input.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  const id = `ca-${slug || "addon"}-${Date.now().toString(36)}`;
  const { error } = await supabase.from("customisation_addons").insert({
    id,
    name: input.name.trim(),
    category: input.category,
    default_cost: Math.max(0, Math.round(input.default_cost)),
    default_qty: input.default_qty,
    unit: input.unit.trim() || null,
    stock_item_id: input.stock_item_id || null,
    notes: input.notes.trim() || null,
    is_active: input.is_active,
    sort_order: input.sort_order,
  });
  if (error) throw new Error(`Failed to add addon: ${error.message}`);
  revalidatePath("/admin/addons");
  return id;
}

export async function updateAddon(id: string, patch: AddonInput) {
  await requireRole("admin");
  if (!patch.name.trim()) throw new Error("Name is required");
  assertCategory(patch.category);
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase
    .from("customisation_addons")
    .update({
      name: patch.name.trim(),
      category: patch.category,
      default_cost: Math.max(0, Math.round(patch.default_cost)),
      default_qty: patch.default_qty,
      unit: patch.unit.trim() || null,
      stock_item_id: patch.stock_item_id || null,
      notes: patch.notes.trim() || null,
      is_active: patch.is_active,
      sort_order: patch.sort_order,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(`Failed to update addon: ${error.message}`);
  revalidatePath("/admin/addons");
}

export async function deleteAddon(id: string) {
  await requireRole("admin");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  // Orders snapshot the addon in their jsonb, so deleting the catalogue row
  // doesn't break historical orders.
  const { error } = await supabase.from("customisation_addons").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete addon: ${error.message}`);
  revalidatePath("/admin/addons");
}
