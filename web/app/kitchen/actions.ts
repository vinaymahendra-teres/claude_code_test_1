"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { requireAuth, requireRole } from "@/lib/auth-helpers";

export type TimerColor = "caramel" | "rose" | "sage" | "plum";

export type TimerTemplateInput = {
  label: string;
  duration_ms: number;
  color: TimerColor;
};

export async function listTimerTemplates() {
  await requireAuth();
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data } = await supabase
    .from("timer_templates")
    .select("id, label, duration_ms, color, sort_order")
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });
  return (data ?? []) as Array<{
    id: string;
    label: string;
    duration_ms: number;
    color: TimerColor;
    sort_order: number;
  }>;
}

export async function createTimerTemplate(input: TimerTemplateInput): Promise<string> {
  await requireAuth();
  if (!input.label.trim()) throw new Error("Label is required");
  if (input.duration_ms <= 0) throw new Error("Duration must be positive");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const slug = input.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24);
  const id = `tt-${slug || "preset"}-${Date.now().toString(36)}`;
  const { error } = await supabase.from("timer_templates").insert({
    id,
    label: input.label.trim(),
    duration_ms: Math.round(input.duration_ms),
    color: input.color,
  });
  if (error) throw new Error(`Failed to save template: ${error.message}`);
  revalidatePath("/kitchen");
  revalidatePath("/tools");
  return id;
}

export async function updateTimerTemplate(id: string, patch: TimerTemplateInput) {
  await requireAuth();
  if (!patch.label.trim()) throw new Error("Label is required");
  if (patch.duration_ms <= 0) throw new Error("Duration must be positive");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase
    .from("timer_templates")
    .update({
      label: patch.label.trim(),
      duration_ms: Math.round(patch.duration_ms),
      color: patch.color,
    })
    .eq("id", id);
  if (error) throw new Error(`Failed to update template: ${error.message}`);
  revalidatePath("/kitchen");
  revalidatePath("/tools");
}

export async function deleteTimerTemplate(id: string) {
  await requireRole("admin");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.from("timer_templates").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete template: ${error.message}`);
  revalidatePath("/kitchen");
  revalidatePath("/tools");
}
