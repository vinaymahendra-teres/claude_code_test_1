"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

/**
 * Mark an order's feedback as received. Removes it from the review queue.
 * Bind from the page with `markReceived.bind(null, order.id)`.
 */
export async function markReceived(orderId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase
    .from("orders")
    .update({ feedback_received: "Y" })
    .eq("id", orderId);
  if (error) throw new Error(`markReceived ${orderId}: ${error.message}`);
  revalidatePath("/reviews");
  revalidatePath("/");
}
