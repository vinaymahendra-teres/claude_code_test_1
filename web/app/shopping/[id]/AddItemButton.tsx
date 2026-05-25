"use client";

import { useState, useTransition } from "react";
import { Field } from "@/components/ui";
import { Sheet, TextInput, Button } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { addShoppingItem } from "../actions";

export function AddItemButton({ listId }: { listId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("");
  const [supplier, setSupplier] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    setName("");
    setQty("");
    setUnit("");
    setSupplier("");
    setCost("");
    setNotes("");
    setError(null);
    setOpen(false);
  }

  function submit() {
    setError(null);
    if (!name.trim()) {
      setError("Item name is required");
      return;
    }
    startTransition(async () => {
      try {
        await addShoppingItem(listId, {
          item_name: name,
          qty: qty ? parseFloat(qty) : null,
          unit,
          supplier,
          estimated_cost: parseFloat(cost) || 0,
          notes,
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
        aria-label="Add item"
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

      <Sheet open={open} onClose={close} title="Add item">
        <div style={{ paddingBottom: 24 }}>
          <Field label="Item">
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Vanilla extract"
              autoFocus
            />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8 }}>
            <Field label="Quantity" optional>
              <TextInput value={qty} onChange={(e) => setQty(e.target.value.replace(/[^0-9.]/g, ""))} />
            </Field>
            <Field label="Unit" optional>
              <TextInput value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="ml" />
            </Field>
          </div>
          <Field label="Supplier" optional>
            <TextInput value={supplier} onChange={(e) => setSupplier(e.target.value)} />
          </Field>
          <Field label="Estimated cost" optional>
            <TextInput value={cost} onChange={(e) => setCost(e.target.value.replace(/[^0-9.]/g, ""))} prefix="₹" />
          </Field>
          <Field label="Notes" optional>
            <TextInput multiline value={notes} onChange={(e) => setNotes(e.target.value)} />
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
