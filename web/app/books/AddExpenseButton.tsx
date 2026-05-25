"use client";

import { useState, useTransition } from "react";
import { Field } from "@/components/ui";
import { Button, TextInput, Sheet, SegmentedControl } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { addExpense } from "./actions";

const CATEGORIES = [
  "Ingredients",
  "Premium",
  "Packaging",
  "Rent",
  "Utilities",
  "Marketing",
  "Equipment",
  "Compliance",
  "Other",
];

const METHODS = ["UPI", "Cash", "Card", "Bank transfer"];

const TODAY = "2026-05-24";

export function AddExpenseButton() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(TODAY);
  const [vendor, setVendor] = useState("");
  const [category, setCategory] = useState("Ingredients");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("UPI");
  const [utr, setUtr] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setVendor("");
    setAmount("");
    setNote("");
    setUtr("");
    setError(null);
  }

  function submit() {
    setError(null);
    const amt = +amount;
    if (!vendor) {
      setError("Vendor is required");
      return;
    }
    if (!amount || isNaN(amt) || amt <= 0) {
      setError("Enter an amount above ₹0");
      return;
    }
    startTransition(async () => {
      try {
        await addExpense({
          date,
          vendor,
          category,
          amount: amt,
          method,
          note,
          upi_reference_utr: method === "UPI" ? utr : "",
        });
        setOpen(false);
        reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 14px",
          fontSize: 13,
          fontWeight: 600,
          background: "var(--caramel)",
          color: "var(--surface)",
          border: "1px solid var(--caramel-deep)",
          borderRadius: 999,
          cursor: "pointer",
        }}
      >
        <Icon.Plus size={14} /> Add expense
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Add expense">
        <div style={{ padding: "4px 0 24px" }}>
          <Field label="Date">
            <TextInput
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>

          <Field label="Vendor">
            <TextInput
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="e.g. Karwa Bakery Supplies"
              autoFocus
            />
          </Field>

          <Field label="Amount">
            <TextInput
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0"
              prefix="₹"
              style={{
                fontSize: 22,
                padding: "14px 12px 14px 30px",
                fontWeight: 600,
                fontFamily: "DM Serif Display, serif",
              }}
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
                placeholder="12-digit number"
              />
            </Field>
          )}

          <Field label="Note" optional>
            <TextInput
              multiline
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What was this for?"
            />
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

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Button variant="secondary" size="lg" full onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="lg"
              full
              onClick={submit}
              disabled={isPending}
              icon={<Icon.Check size={16} />}
            >
              {isPending ? "Saving…" : "Save expense"}
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
