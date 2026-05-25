"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

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
  if (error) {
    throw new Error(`Failed to add expense: ${error.message}`);
  }

  revalidatePath("/books");
  revalidatePath("/reports");
  revalidatePath("/");
}
