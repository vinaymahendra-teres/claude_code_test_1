"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { requireAuth, requireRole } from "@/lib/auth-helpers";

export type AddExpenseInput = {
  date: string;
  vendor: string;
  category: string;
  amount: number;
  method: string;
  note: string;
  upi_reference_utr?: string;
};

export async function addExpense(input: AddExpenseInput) {
  await requireAuth();
  if (!input.date) throw new Error("Date is required");
  if (!input.vendor) throw new Error("Vendor is required");
  if (!input.amount || input.amount <= 0) throw new Error("Amount must be greater than 0");

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const id = `e-${Date.now().toString(36)}`;
  const { error } = await supabase.from("expenses").insert({
    id,
    date: input.date,
    vendor: input.vendor,
    category: input.category || "Other",
    amount: Math.round(input.amount),
    method: input.method || null,
    note: input.note || null,
    upi_reference_utr: input.upi_reference_utr || null,
    receipt: false,
  });
  if (error) throw new Error(`Failed to add expense: ${error.message}`);
  revalidatePath("/books");
  revalidatePath("/reports");
  revalidatePath("/");
}

export type ExpenseEdit = {
  date: string;
  vendor: string;
  category: string;
  amount: number;
  method: string;
  note: string;
  upi_reference_utr: string;
};

export async function updateExpense(id: string, patch: ExpenseEdit) {
  await requireAuth();
  if (!patch.date || !patch.vendor) throw new Error("Date and vendor are required");
  if (patch.amount <= 0) throw new Error("Amount must be greater than 0");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase
    .from("expenses")
    .update({
      date: patch.date,
      vendor: patch.vendor,
      category: patch.category || "Other",
      amount: Math.round(patch.amount),
      method: patch.method || null,
      note: patch.note || null,
      upi_reference_utr: patch.upi_reference_utr || null,
    })
    .eq("id", id);
  if (error) throw new Error(`Failed to update expense: ${error.message}`);
  revalidatePath("/books");
  revalidatePath("/reports");
  revalidatePath("/");
}

export async function deleteExpense(id: string) {
  await requireRole("admin");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete expense: ${error.message}`);
  revalidatePath("/books");
  revalidatePath("/reports");
  revalidatePath("/");
}
