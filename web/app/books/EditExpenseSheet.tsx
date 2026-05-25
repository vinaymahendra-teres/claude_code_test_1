"use client";

import { useState, useTransition } from "react";
import { Field } from "@/components/ui";
import { Sheet, TextInput, Button, SegmentedControl } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { updateExpense, deleteExpense, type ExpenseEdit } from "./actions";

const CATEGORIES = ["Ingredients", "Premium", "Packaging", "Rent", "Utilities", "Marketing", "Equipment", "Compliance", "Other"];
const METHODS = ["UPI", "Cash", "Card", "Bank transfer"];

export function EditExpenseSheet({
  id,
  initial,
}: {
  id: string;
  initial: ExpenseEdit;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(initial.date);
  const [vendor, setVendor] = useState(initial.vendor);
  const [category, setCategory] = useState(initial.category);
  const [amount, setAmount] = useState(String(initial.amount));
  const [method, setMethod] = useState(initial.method || "UPI");
  const [utr, setUtr] = useState(initial.upi_reference_utr);
  const [note, setNote] = useState(initial.note);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setError(null);
  }

  function submit() {
    setError(null);
    const amt = parseFloat(amount);
    if (!isFinite(amt) || amt <= 0) {
      setError("Amount must be greater than 0");
      return;
    }
    startTransition(async () => {
      try {
        await updateExpense(id, {
          date,
          vendor,
          category,
          amount: amt,
          method,
          note,
          upi_reference_utr: method === "UPI" ? utr : "",
        });
        close();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Edit ${initial.vendor}`}
        title="Edit"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 26,
          height: 26,
          borderRadius: 999,
          background: "var(--surface-3)",
          color: "var(--ink-soft)",
          border: "none",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <Icon.Edit size={13} />
      </button>

      <Sheet open={open} onClose={close} title="Edit expense">
        <div style={{ paddingBottom: 24 }}>
          <Field label="Date">
            <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Vendor">
            <TextInput value={vendor} onChange={(e) => setVendor(e.target.value)} />
          </Field>
          <Field label="Amount">
            <TextInput
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              prefix="₹"
            />
          </Field>
          <Field label="Category">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {CATEGORIES.map((c) => {
                const sel = category === c;
                return (
                  <span
                    key={c}
                    onClick={() => setCategory(c)}
                    style={{
                      padding: "6px 12px",
                      fontSize: 12.5,
                      fontWeight: 600,
                      borderRadius: 999,
                      border: "1.5px solid " + (sel ? "var(--caramel)" : "var(--line)"),
                      background: sel ? "var(--caramel-soft)" : "var(--surface)",
                      color: sel ? "var(--caramel-deep)" : "var(--ink-soft)",
                      cursor: "pointer",
                    }}
                  >
                    {c}
                  </span>
                );
              })}
            </div>
          </Field>
          <Field label="Method">
            <SegmentedControl value={method} onChange={setMethod} options={METHODS} />
          </Field>
          {method === "UPI" && (
            <Field label="UPI reference (UTR)" optional>
              <TextInput
                value={utr}
                onChange={(e) => setUtr(e.target.value.replace(/[^0-9]/g, "").slice(0, 12))}
              />
            </Field>
          )}
          <Field label="Note" optional>
            <TextInput multiline value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>

          {error && (
            <div
              style={{
                padding: 10,
                background: "oklch(0.94 0.05 28)",
                border: "1px solid var(--danger)",
                borderRadius: "var(--r)",
                fontSize: 12.5,
                color: "var(--danger)",
                marginBottom: 12,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 8, marginBottom: 14 }}>
            <Button variant="secondary" size="lg" full onClick={close}>
              Cancel
            </Button>
            <Button variant="primary" size="lg" full onClick={submit} disabled={isPending}>
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>

          <div style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 14 }}>
            <ConfirmDelete
              label={`${initial.vendor} · ₹${initial.amount.toLocaleString("en-IN")}`}
              description="Removes this expense permanently from the books."
              confirmWord="DELETE"
              buttonLabel="Delete expense"
              onConfirm={async () => {
                await deleteExpense(id);
                close();
              }}
            />
          </div>
        </div>
      </Sheet>
    </>
  );
}
