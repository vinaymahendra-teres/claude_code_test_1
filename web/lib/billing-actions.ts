"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { todayIst } from "@/lib/format";
import { addonsTotal, type Customisation, type CustomisationAddon } from "@/lib/customisation";

// ---------- Shared types ----------

export type InvoiceLineItem = {
  description: string;
  qty: number;
  unit_price: number;
  total: number;
  hsn?: string;
};

export type InvoiceStatus = "draft" | "issued" | "paid" | "cancelled" | "voided";

// ---------- Generators ----------

/**
 * Build an invoice for an order: snapshots the customer + branch + line
 * items, assigns a sequential per-branch number, marks status=issued.
 * Re-issuing on a paid order is allowed (creates a second invoice — the
 * caller is responsible for voiding the prior one).
 */
export async function createInvoiceForOrder(orderId: string): Promise<string> {
  await requireAuth();
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: order, error: oErr } = await supabase
    .from("orders")
    .select(
      "id, branch_id, customer_id, title, flavor, size, servings, price, balance, deposit, customisation, product_line",
    )
    .eq("id", orderId)
    .maybeSingle();
  if (oErr || !order) throw new Error("Order not found");
  if (!order.branch_id) throw new Error("Order has no branch — set it before invoicing");

  const [{ data: branch }, { data: customer }] = await Promise.all([
    supabase.from("branches").select("*").eq("id", order.branch_id).maybeSingle(),
    order.customer_id
      ? supabase
          .from("customers")
          .select("id, name, phone, instagram, area, address_detail")
          .eq("id", order.customer_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  if (!branch) throw new Error("Branch not found");

  // Build line items so the subtotal exactly equals the quoted order.price.
  // The operator quotes a single all-in price; addons are itemised for the
  // customer's benefit and the cake line absorbs the residual. Otherwise
  // counting the cake at order.price AND the addons separately would
  // double-charge any addon the operator already folded into the quote.
  const lineItems: InvoiceLineItem[] = [];
  const cust = (order.customisation as Customisation | null) ?? {};
  const addons: CustomisationAddon[] = (cust.addons ?? []).filter((a) => (a.price ?? 0) > 0);
  const addonsCost = addonsTotal(addons);
  const quoted = order.price ?? 0;
  const cakePortion = Math.max(0, quoted - addonsCost);

  lineItems.push({
    description: [order.product_line, order.title, order.flavor, order.size]
      .filter(Boolean)
      .join(" · "),
    qty: 1,
    unit_price: cakePortion,
    total: cakePortion,
  });

  for (const a of addons) {
    lineItems.push({
      description: `${a.name}${a.qty !== 1 ? ` × ${a.qty}` : ""}`,
      qty: a.qty ?? 1,
      unit_price: a.price ?? 0,
      total: (a.price ?? 0) * (a.qty ?? 1),
    });
  }

  const subtotal = lineItems.reduce((s, l) => s + l.total, 0);
  // Tax left at 0 unless GST is on; the operator can enable per branch on
  // /admin/branches when they register.
  const taxTotal = 0;
  const total = subtotal + taxTotal;

  // Get a fresh number atomically via the SQL function from migration 0009.
  const { data: numRes, error: numErr } = await supabase
    .rpc("next_invoice_number", { p_branch_id: order.branch_id });
  if (numErr || !numRes) throw new Error(`Failed to allocate number: ${numErr?.message}`);
  const number = numRes as string;

  const id = `inv-${branch.id}-${Date.now().toString(36)}`;

  const { error } = await supabase.from("invoices").insert({
    id,
    number,
    branch_id: order.branch_id,
    order_id: order.id,
    customer_id: order.customer_id,
    status: "issued",
    issue_date: todayIst(),
    subtotal,
    tax_total: taxTotal,
    total,
    amount_paid: 0,
    line_items: lineItems,
    customer_snapshot: customer
      ? {
          name: customer.name,
          phone: customer.phone,
          instagram: customer.instagram,
          area: customer.area,
          address_detail: customer.address_detail,
        }
      : null,
    branch_snapshot: {
      id: branch.id,
      label: branch.label,
      community: branch.community,
      address: branch.address,
      gstin: branch.gstin,
      operator_id: branch.operator_id,
      bank_name: branch.bank_name,
      bank_account_number: branch.bank_account_number,
      bank_ifsc: branch.bank_ifsc,
      bank_upi: branch.bank_upi,
      signature_label: branch.signature_label,
      invoice_terms: branch.invoice_terms,
      invoice_footer: branch.invoice_footer,
    },
    gst_enabled: !!branch.gst_enabled,
    terms: branch.invoice_terms ?? null,
  });
  if (error) throw new Error(`Failed to create invoice: ${error.message}`);

  revalidatePath(`/orders/${orderId}`);
  revalidatePath(`/invoices`);
  return id;
}

export async function setInvoiceStatus(
  id: string,
  status: InvoiceStatus,
) {
  await requireAuth();
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase
    .from("invoices")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`Failed: ${error.message}`);
  revalidatePath(`/invoices/${id}`);
  revalidatePath(`/invoices`);
}

export async function deleteInvoice(id: string) {
  await requireRole("admin");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.from("invoices").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete invoice: ${error.message}`);
  revalidatePath("/invoices");
  redirect("/invoices");
}

// ---------- Receipts ----------

export type ReceiptInput = {
  orderId: string;
  amount: number;
  method: string;
  upiReferenceUtr: string;
  payerVpa: string;
  notes: string;
  invoiceId?: string;
};

export async function createReceiptForOrder(input: ReceiptInput): Promise<string> {
  await requireAuth();
  if (!input.amount || input.amount <= 0) throw new Error("Amount must be positive");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: order } = await supabase
    .from("orders")
    .select("id, branch_id, customer_id")
    .eq("id", input.orderId)
    .maybeSingle();
  if (!order) throw new Error("Order not found");
  if (!order.branch_id) throw new Error("Order has no branch");

  const [{ data: branch }, { data: customer }] = await Promise.all([
    supabase.from("branches").select("*").eq("id", order.branch_id).maybeSingle(),
    order.customer_id
      ? supabase
          .from("customers")
          .select("name, phone, instagram, area, address_detail")
          .eq("id", order.customer_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  if (!branch) throw new Error("Branch not found");

  const { data: numRes, error: numErr } = await supabase
    .rpc("next_receipt_number", { p_branch_id: order.branch_id });
  if (numErr || !numRes) throw new Error(`Failed to allocate number: ${numErr?.message}`);
  const number = numRes as string;

  const id = `rct-${branch.id}-${Date.now().toString(36)}`;

  const { error } = await supabase.from("payment_receipts").insert({
    id,
    number,
    branch_id: order.branch_id,
    order_id: order.id,
    invoice_id: input.invoiceId ?? null,
    customer_id: order.customer_id,
    receipt_date: todayIst(),
    amount: Math.round(input.amount),
    method: input.method || null,
    upi_reference_utr: input.upiReferenceUtr || null,
    payer_vpa: input.payerVpa || null,
    notes: input.notes || null,
    customer_snapshot: customer
      ? {
          name: customer.name,
          phone: customer.phone,
          area: customer.area,
          address_detail: customer.address_detail,
        }
      : null,
    branch_snapshot: {
      label: branch.label,
      community: branch.community,
      address: branch.address,
      gstin: branch.gstin,
      bank_upi: branch.bank_upi,
      signature_label: branch.signature_label,
    },
  });
  if (error) throw new Error(`Failed to create receipt: ${error.message}`);

  // If the receipt is tied to an invoice, accumulate amount_paid and flip
  // status to "paid" when fully covered.
  if (input.invoiceId) {
    const { data: inv } = await supabase
      .from("invoices")
      .select("amount_paid, total")
      .eq("id", input.invoiceId)
      .maybeSingle();
    if (inv) {
      const nextPaid = (inv.amount_paid ?? 0) + Math.round(input.amount);
      const status = nextPaid >= (inv.total ?? 0) ? "paid" : "issued";
      await supabase
        .from("invoices")
        .update({ amount_paid: nextPaid, status, updated_at: new Date().toISOString() })
        .eq("id", input.invoiceId);
    }
  }

  // Also bump the order's deposit / balance for the day-to-day view.
  const { data: o } = await supabase
    .from("orders")
    .select("deposit, price, balance")
    .eq("id", order.id)
    .maybeSingle();
  if (o) {
    const newDeposit = (o.deposit ?? 0) + Math.round(input.amount);
    const newBalance = Math.max(0, (o.price ?? 0) - newDeposit);
    await supabase
      .from("orders")
      .update({ deposit: newDeposit, balance: newBalance, payment_mode: input.method || null })
      .eq("id", order.id);
  }

  revalidatePath(`/orders/${input.orderId}`);
  revalidatePath("/receipts");
  if (input.invoiceId) revalidatePath(`/invoices/${input.invoiceId}`);
  return id;
}

export async function deleteReceipt(id: string) {
  await requireRole("admin");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.from("payment_receipts").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete receipt: ${error.message}`);
  revalidatePath("/receipts");
}
