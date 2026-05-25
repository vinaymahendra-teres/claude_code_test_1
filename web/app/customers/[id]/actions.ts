"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

/**
 * Flip a customer's marketing_consent between 'Y' and 'N'.
 * DPDP Act 2023 compliance — every change carries a date stamp.
 *
 * Bound from the page like:
 *   const action = toggleConsent.bind(null, customerId, 'Y');
 *   <form action={action}>...</form>
 */
export async function toggleConsent(
  customerId: string,
  nextState: "Y" | "N",
) {
  if (nextState !== "Y" && nextState !== "N") {
    throw new Error("nextState must be 'Y' or 'N'");
  }
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Anchored to seed-data baseline so today's relative dates stay readable.
  const today = "2026-05-24";

  const { error } = await supabase
    .from("customers")
    .update({
      marketing_consent: nextState,
      consent_date: nextState === "Y" ? today : null,
    })
    .eq("id", customerId);

  if (error) {
    throw new Error(`Failed to update consent for ${customerId}: ${error.message}`);
  }

  // Refresh both this customer's page and the customers list so the dot updates
  revalidatePath(`/customers/${customerId}`);
  revalidatePath(`/customers`);
}
