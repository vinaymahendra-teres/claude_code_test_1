"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { todayIst } from "@/lib/format";

import type { Customisation } from "@/lib/customisation";

export type CreateOrderInput = {
  customerId: string | null;
  newCustomer: {
    name: string;
    phone: string;
    instagram: string;
  } | null;
  productLine: string;
  title: string;
  flavor: string;
  size: string;
  servings: number;
  eggless: boolean;
  // Legacy: a single sentence about the brief; new code passes "" and uses
  // customisation.brief.theme instead.
  theme: string;
  addOns: string[];
  customisation: Customisation;
  deliveryDate: string;
  deliverySlot: string;
  deliveryArea: string;
  coldChainNotes: string;
  price: number;
  deposit: number;
  notes: string;
};

export async function createOrder(input: CreateOrderInput): Promise<string> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  let customerId = input.customerId;

  if (!customerId && input.newCustomer && input.newCustomer.name) {
    const slug = input.newCustomer.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 24);
    const ts = Date.now().toString(36);
    customerId = `c-${slug || "new"}-${ts}`;

    const { error: cErr } = await supabase.from("customers").insert({
      id: customerId,
      name: input.newCustomer.name,
      phone: input.newCustomer.phone || null,
      instagram: input.newCustomer.instagram || null,
      since: todayIst(),
      order_count: 0,
      lifetime_value: 0,
      avatar_tone: "caramel",
      marketing_consent: "N",
    });
    if (cErr) {
      throw new Error(`Failed to create customer: ${cErr.message}`);
    }
  }

  if (!customerId) {
    throw new Error("A customer is required to create an order.");
  }

  const orderId = `o-${Date.now().toString(36)}`;
  const balance = Math.max(0, input.price - input.deposit);

  const { error } = await supabase.from("orders").insert({
    id: orderId,
    customer_id: customerId,
    product_line: input.productLine || "cake",
    title: input.title,
    flavor: input.flavor,
    size: input.size,
    servings: input.servings,
    eggless: input.eggless,
    theme: input.theme,
    add_ons: input.addOns,
    customisation: input.customisation ?? {},
    price: input.price,
    deposit: input.deposit,
    balance,
    delivery_date: input.deliveryDate,
    delivery_slot: input.deliverySlot,
    delivery_area: input.deliveryArea,
    cold_chain_notes: input.coldChainNotes || null,
    notes: input.notes || null,
    status: "confirmed",
    channel: "manual",
    reference_count: 0,
    feedback_received: "N",
  });
  if (error) {
    throw new Error(`Failed to create order: ${error.message}`);
  }

  revalidatePath("/orders");
  revalidatePath("/");
  revalidatePath("/bakes");
  redirect(`/orders/${orderId}`);
}
