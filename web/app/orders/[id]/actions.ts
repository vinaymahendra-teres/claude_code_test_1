"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

const STAGE_ORDER = ["draft", "confirmed", "in-production", "ready", "delivered"] as const;
type Stage = (typeof STAGE_ORDER)[number];

export async function advanceStage(orderId: string, fromStatus: string) {
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
  if (error) {
    throw new Error(`Failed to advance order ${orderId}: ${error.message}`);
  }

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  revalidatePath("/bakes");
  revalidatePath("/");
}
