"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import type { EventKind } from "./kinds";

export type CalendarEventInput = {
  title: string;
  date: string;
  end_date: string;
  kind: EventKind;
  notes: string;
  all_day: boolean;
};

export async function createCalendarEvent(input: CalendarEventInput): Promise<string> {
  await requireAuth();
  if (!input.title.trim()) throw new Error("Title is required");
  if (!input.date) throw new Error("Date is required");
  if (input.end_date && input.end_date < input.date)
    throw new Error("End date must be on or after start date");

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const id = `ce-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const { error } = await supabase.from("calendar_events").insert({
    id,
    title: input.title.trim(),
    date: input.date,
    end_date: input.end_date || null,
    kind: input.kind,
    notes: input.notes.trim() || null,
    all_day: input.all_day,
  });
  if (error) throw new Error(`Failed to create event: ${error.message}`);
  revalidatePath("/calendar");
  revalidatePath("/");
  return id;
}

export async function updateCalendarEvent(id: string, patch: CalendarEventInput) {
  await requireAuth();
  if (!patch.title.trim()) throw new Error("Title is required");
  if (!patch.date) throw new Error("Date is required");
  if (patch.end_date && patch.end_date < patch.date)
    throw new Error("End date must be on or after start date");

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase
    .from("calendar_events")
    .update({
      title: patch.title.trim(),
      date: patch.date,
      end_date: patch.end_date || null,
      kind: patch.kind,
      notes: patch.notes.trim() || null,
      all_day: patch.all_day,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(`Failed to update event: ${error.message}`);
  revalidatePath("/calendar");
  revalidatePath("/");
}

export async function deleteCalendarEvent(id: string) {
  await requireRole("admin");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.from("calendar_events").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete event: ${error.message}`);
  revalidatePath("/calendar");
  revalidatePath("/");
}
