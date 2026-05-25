"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { requireAuth, requireRole } from "@/lib/auth-helpers";

export type Ingredient = { item: string; qty: string; stockKey?: string };

export type RecipeEdit = {
  name: string;
  category: string;
  eggless: boolean;
  yield_note: string;
  prep_mins: number;
  bake_mins: number;
  cost_per_cake: number;
  ingredients: Ingredient[];
  method: string[];
};

export async function updateRecipe(id: string, patch: RecipeEdit) {
  await requireAuth();
  if (!patch.name.trim()) throw new Error("Recipe name is required");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase
    .from("recipes")
    .update({
      name: patch.name.trim(),
      category: patch.category,
      eggless: patch.eggless,
      yield_note: patch.yield_note.trim() || null,
      prep_mins: Math.max(0, Math.round(patch.prep_mins)),
      bake_mins: Math.max(0, Math.round(patch.bake_mins)),
      cost_per_cake: Math.max(0, Math.round(patch.cost_per_cake)),
      ingredients: patch.ingredients,
      method: patch.method,
    })
    .eq("id", id);
  if (error) throw new Error(`Failed to update recipe: ${error.message}`);
  revalidatePath(`/recipes/${id}`);
  revalidatePath("/recipes");
}

export async function createRecipe(input: RecipeEdit): Promise<string> {
  await requireAuth();
  if (!input.name.trim()) throw new Error("Recipe name is required");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24);
  const id = `r-${slug || "new"}-${Date.now().toString(36)}`;
  const { error } = await supabase.from("recipes").insert({
    id,
    name: input.name.trim(),
    category: input.category,
    eggless: input.eggless,
    yield_note: input.yield_note.trim() || null,
    prep_mins: input.prep_mins,
    bake_mins: input.bake_mins,
    cost_per_cake: Math.round(input.cost_per_cake),
    ingredients: input.ingredients,
    method: input.method,
  });
  if (error) throw new Error(`Failed to create recipe: ${error.message}`);
  revalidatePath("/recipes");
  return id;
}

export async function deleteRecipe(id: string) {
  await requireRole("admin");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete recipe: ${error.message}`);
  revalidatePath("/recipes");
  redirect("/recipes");
}
