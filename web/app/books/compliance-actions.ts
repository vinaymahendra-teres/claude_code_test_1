"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { requireAuth, requireRole } from "@/lib/auth-helpers";

export type ComplianceInput = {
  item: string;
  type: string;
  due_date: string;
  note: string;
};

export async function createCompliance(input: ComplianceInput): Promise<string> {
  await requireAuth();
  if (!input.item.trim()) throw new Error("Item is required");
  if (!input.due_date) throw new Error("Due date is required");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const id = `co-${Date.now().toString(36)}`;
  const { error } = await supabase.from("compliance_items").insert({
    id,
    item: input.item.trim(),
    type: input.type || "renewal",
    due_date: input.due_date,
    note: input.note.trim() || null,
    status: "open",
  });
  if (error) throw new Error(`Failed to add compliance item: ${error.message}`);
  revalidatePath("/books");
  return id;
}

export async function setComplianceStatus(
  id: string,
  status: "open" | "completed" | "dismissed",
) {
  await requireAuth();
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase
    .from("compliance_items")
    .update({
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) throw new Error(`Failed to update item: ${error.message}`);
  revalidatePath("/books");
}

export async function deleteCompliance(id: string) {
  await requireRole("admin");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.from("compliance_items").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete item: ${error.message}`);
  revalidatePath("/books");
}
