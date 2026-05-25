"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { todayIst } from "@/lib/format";

export async function toggleConsent(customerId: string, nextState: "Y" | "N") {
  await requireAuth();
  if (nextState !== "Y" && nextState !== "N") {
    throw new Error("nextState must be 'Y' or 'N'");
  }
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const today = todayIst();
  const { error } = await supabase
    .from("customers")
    .update({
      marketing_consent: nextState,
      consent_date: nextState === "Y" ? today : null,
    })
    .eq("id", customerId);
  if (error) throw new Error(`Failed to update consent: ${error.message}`);
  revalidatePath(`/customers/${customerId}`);
  revalidatePath(`/customers`);
}

export type CustomerEdit = {
  name: string;
  phone: string;
  instagram: string;
  // Address is the branch the customer belongs to + a freeform tower/flat
  // detail (e.g. "T-3, 1602"). The old "area" column is kept in sync with
  // the branch's community label so legacy reads don't break.
  branchId: string;
  addressDetail: string;
  tags: string[];
  notes: string;
};

export async function updateCustomer(customerId: string, patch: CustomerEdit) {
  await requireAuth();
  if (!patch.name.trim()) throw new Error("Name cannot be empty");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Derive `area` from the branch's community + tower/flat detail so it
  // reads naturally on legacy screens that still surface it.
  const { data: branch } = await supabase
    .from("branches")
    .select("community")
    .eq("id", patch.branchId)
    .maybeSingle();
  const areaParts = [patch.addressDetail.trim(), branch?.community]
    .filter((s): s is string => !!s && !!s.trim());
  const area = areaParts.join(" · ") || null;

  const { error } = await supabase
    .from("customers")
    .update({
      name: patch.name.trim(),
      phone: patch.phone.trim() || null,
      instagram: patch.instagram.trim() || null,
      branch_id: patch.branchId || null,
      address_detail: patch.addressDetail.trim() || null,
      area,
      tags: patch.tags,
      notes: patch.notes.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", customerId);
  if (error) throw new Error(`Failed to update customer: ${error.message}`);
  revalidatePath(`/customers/${customerId}`);
  revalidatePath(`/customers`);
}

export async function deleteCustomer(customerId: string) {
  await requireRole("admin");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  // FK on orders.customer_id is ON DELETE SET NULL, so order history survives.
  const { error } = await supabase.from("customers").delete().eq("id", customerId);
  if (error) throw new Error(`Failed to delete customer: ${error.message}`);
  revalidatePath(`/customers`);
  revalidatePath(`/orders`);
  redirect("/customers");
}

export type NewCustomerInput = {
  name: string;
  phone: string;
  instagram: string;
  branchId: string;
  addressDetail: string;
  tags: string[];
};

export async function createCustomer(input: NewCustomerInput): Promise<string> {
  await requireAuth();
  if (!input.name.trim()) throw new Error("Name is required");
  if (!input.phone.trim() && !input.instagram.trim()) {
    throw new Error("Add a phone or Instagram handle");
  }
  if (!input.branchId) throw new Error("Pick a branch");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const slug = input.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  const id = `c-${slug || "new"}-${Date.now().toString(36)}`;

  const { data: branch } = await supabase
    .from("branches")
    .select("community")
    .eq("id", input.branchId)
    .maybeSingle();
  const areaParts = [input.addressDetail.trim(), branch?.community]
    .filter((s): s is string => !!s && !!s.trim());
  const area = areaParts.join(" · ") || null;

  const { error } = await supabase.from("customers").insert({
    id,
    name: input.name.trim(),
    phone: input.phone.trim() || null,
    instagram: input.instagram.trim() || null,
    branch_id: input.branchId,
    address_detail: input.addressDetail.trim() || null,
    area,
    tags: input.tags,
    since: todayIst(),
    order_count: 0,
    lifetime_value: 0,
    avatar_tone: "caramel",
    marketing_consent: "N",
  });
  if (error) throw new Error(`Failed to create customer: ${error.message}`);

  revalidatePath("/customers");
  return id;
}
