"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { requireAuth, requireRole } from "@/lib/auth-helpers";

export type ProductLineSize = {
  name: string;
  servings: number;
  price_hint?: number;
  notes?: string;
};

export type ProductLineRow = {
  id: string;
  name: string;
  label: string;
  description: string | null;
  sizes: ProductLineSize[];
  default_unit: string | null;
  is_active: boolean;
  sort_order: number;
};

export type ProductLineInput = {
  name: string;
  label: string;
  description: string;
  default_unit: string;
  sizes: ProductLineSize[];
  is_active: boolean;
  sort_order: number;
};

export async function listProductLines(): Promise<ProductLineRow[]> {
  await requireAuth();
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase
    .from("product_lines")
    .select("*")
    .order("sort_order");
  if (error) throw new Error(`Failed to list product lines: ${error.message}`);
  return (data ?? []) as ProductLineRow[];
}

export async function createProductLine(input: ProductLineInput): Promise<string> {
  await requireRole("admin");
  if (!input.name.trim()) throw new Error("Name (machine-friendly) is required");
  if (!input.label.trim()) throw new Error("Label is required");
  const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const id = `pl-${slug || "line"}-${Date.now().toString(36)}`;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.from("product_lines").insert({
    id,
    name: slug,
    label: input.label.trim(),
    description: input.description.trim() || null,
    default_unit: input.default_unit.trim() || null,
    sizes: input.sizes,
    is_active: input.is_active,
    sort_order: input.sort_order,
  });
  if (error) throw new Error(`Failed to add product line: ${error.message}`);
  revalidatePath("/admin/product-lines");
  return id;
}

export async function updateProductLine(id: string, patch: ProductLineInput) {
  await requireRole("admin");
  if (!patch.label.trim()) throw new Error("Label is required");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase
    .from("product_lines")
    .update({
      label: patch.label.trim(),
      description: patch.description.trim() || null,
      default_unit: patch.default_unit.trim() || null,
      sizes: patch.sizes,
      is_active: patch.is_active,
      sort_order: patch.sort_order,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(`Failed to update product line: ${error.message}`);
  revalidatePath("/admin/product-lines");
}

export async function deleteProductLine(id: string) {
  await requireRole("admin");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.from("product_lines").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete product line: ${error.message}`);
  revalidatePath("/admin/product-lines");
}
