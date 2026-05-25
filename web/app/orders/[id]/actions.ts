"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { requireAuth, requireRole } from "@/lib/auth-helpers";

const STAGE_ORDER = ["draft", "confirmed", "in-production", "ready", "delivered"] as const;
type Stage = (typeof STAGE_ORDER)[number];

export async function advanceStage(orderId: string, fromStatus: string) {
  await requireAuth();
  const idx = STAGE_ORDER.indexOf(fromStatus as Stage);
  if (idx < 0 || idx >= STAGE_ORDER.length - 1) {
    throw new Error(`Cannot advance from status "${fromStatus}"`);
  }
  const nextStatus = STAGE_ORDER[idx + 1];

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase
    .from("orders")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", orderId);
  if (error) throw new Error(`Failed to advance order: ${error.message}`);

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  revalidatePath("/bakes");
  revalidatePath("/");
}

export type OrderEdit = {
  title: string;
  price: number;
  deposit: number;
  delivery_date: string;
  delivery_slot: string;
  delivery_area: string;
  cold_chain_notes: string;
  notes: string;
};

export async function updateOrder(orderId: string, patch: OrderEdit) {
  await requireAuth();
  if (patch.price < 0 || patch.deposit < 0) throw new Error("Price and deposit must be non-negative");
  if (patch.deposit > patch.price) throw new Error("Deposit cannot exceed price");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const balance = Math.max(0, patch.price - patch.deposit);
  const { error } = await supabase
    .from("orders")
    .update({
      title: patch.title.trim() || null,
      price: Math.round(patch.price),
      deposit: Math.round(patch.deposit),
      balance,
      delivery_date: patch.delivery_date || null,
      delivery_slot: patch.delivery_slot || null,
      delivery_area: patch.delivery_area.trim() || null,
      cold_chain_notes: patch.cold_chain_notes.trim() || null,
      notes: patch.notes.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);
  if (error) throw new Error(`Failed to update order: ${error.message}`);
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  revalidatePath("/bakes");
  revalidatePath("/");
}

export async function cancelOrder(orderId: string) {
  await requireAuth();
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase
    .from("orders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", orderId);
  if (error) throw new Error(`Failed to cancel order: ${error.message}`);
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  revalidatePath("/bakes");
  revalidatePath("/");
}

export async function deleteOrder(orderId: string) {
  await requireRole("admin");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.from("orders").delete().eq("id", orderId);
  if (error) throw new Error(`Failed to delete order: ${error.message}`);
  revalidatePath("/orders");
  revalidatePath("/bakes");
  revalidatePath("/");
  redirect("/orders");
}
