"use client";

import { useState, useTransition } from "react";
import { Field } from "@/components/ui";
import { Sheet, TextInput, Button } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { createInventoryItem } from "./actions";

const CATEGORIES = ["Staples", "Dairy", "Sweeteners", "Premium", "Decor", "Packaging", "Other"];

export function AddInventoryButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Staples");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("kg");
  const [reorderAt, setReorderAt] = useState("");
  const [reorderQty, setReorderQty] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [supplier, setSupplier] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName("");
    setCategory("Staples");
    setQty("");
    setUnit("kg");
    setReorderAt("");
    setReorderQty("");
    setUnitCost("");
    setSupplier("");
    setError(null);
  }
  function close() {
    reset();
    setOpen(false);
  }

  function submit() {
    setError(null);
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    startTransition(async () => {
      try {
        await createInventoryItem({
          name,
          category,
          qty: parseFloat(qty) || 0,
          unit: unit || "kg",
          reorder_at: parseFloat(reorderAt) || 0,
          unit_cost: parseFloat(unitCost) || 0,
          supplier,
          reorder_qty: parseFloat(reorderQty) || 0,
          days_cover_at_typical_use: null,
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
        title="Add item"
        aria-label="Add inventory item"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 34,
          height: 34,
          background: "var(--caramel)",
          color: "var(--surface)",
          border: "1px solid var(--caramel-deep)",
          borderRadius: 999,
          cursor: "pointer",
        }}
      >
        <Icon.Plus size={20} />
      </button>

      <Sheet open={open} onClose={close} title="Add inventory item">
        <div style={{ paddingBottom: 24 }}>
          <Field label="Name">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pistachio paste" autoFocus />
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
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8 }}>
            <Field label="On-hand">
              <TextInput value={qty} onChange={(e) => setQty(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0" />
            </Field>
            <Field label="Unit">
              <TextInput value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="kg" />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Field label="Reorder at">
              <TextInput value={reorderAt} onChange={(e) => setReorderAt(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0" />
            </Field>
            <Field label="Reorder qty">
              <TextInput value={reorderQty} onChange={(e) => setReorderQty(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0" />
            </Field>
          </div>
          <Field label="Unit cost (₹)">
            <TextInput value={unitCost} onChange={(e) => setUnitCost(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0" prefix="₹" />
          </Field>
          <Field label="Supplier" optional>
            <TextInput value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Karwa Bakery Supplies" />
          </Field>

          {error && (
            <div style={{ padding: 10, background: "oklch(0.94 0.05 28)", border: "1px solid var(--danger)", borderRadius: "var(--r)", fontSize: 12.5, color: "var(--danger)", marginBottom: 12 }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="secondary" size="lg" full onClick={close}>
              Cancel
            </Button>
            <Button variant="primary" size="lg" full onClick={submit} disabled={isPending || !name.trim()}>
              {isPending ? "Saving…" : "Add item"}
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
