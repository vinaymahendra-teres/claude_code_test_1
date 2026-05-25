"use client";

import { useState, useTransition } from "react";
import { Field, Pill } from "@/components/ui";
import { Sheet, TextInput, Button } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { fmtMoney } from "@/lib/format";
import {
  toggleShoppingItem,
  updateShoppingItem,
  deleteShoppingItem,
} from "../actions";

type Item = {
  id: string;
  list_id: string;
  item_name: string;
  qty: number | null;
  unit: string | null;
  supplier: string | null;
  estimated_cost: number;
  source: "manual" | "low-stock" | "order";
  inventory_item_id: string | null;
  checked: boolean;
  notes: string | null;
};

export function ItemRow({ item, last }: { item: Item; last: boolean }) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  function toggle() {
    // Optimistic via revalidatePath; for a small list this is fine.
    startTransition(async () => {
      try {
        await toggleShoppingItem(item.id, item.list_id, !item.checked);
      } catch {
        /* ignore — revalidate will pull truth */
      }
    });
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "11px 14px",
          borderBottom: last ? "none" : "1px solid var(--line-soft)",
          opacity: item.checked ? 0.55 : 1,
        }}
      >
        <button
          type="button"
          onClick={toggle}
          aria-label={item.checked ? "Mark unchecked" : "Mark checked"}
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            border: "1.5px solid " + (item.checked ? "var(--ok)" : "var(--line)"),
            background: item.checked ? "var(--ok)" : "transparent",
            color: "var(--surface)",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          {item.checked && <Icon.Check size={14} />}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                textDecoration: item.checked ? "line-through" : "none",
              }}
            >
              {item.item_name}
            </span>
            {item.source === "low-stock" && (
              <Pill tone="warn" size="xs">
                low
              </Pill>
            )}
            {item.source === "order" && (
              <Pill tone="caramel" size="xs">
                order
              </Pill>
            )}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
            {item.qty != null ? `${item.qty}${item.unit ?? ""}` : "—"}
            {item.notes ? ` · ${item.notes}` : ""}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{fmtMoney(item.estimated_cost)}</div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Edit item"
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            border: "none",
            background: "var(--surface-3)",
            color: "var(--ink-soft)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon.Edit size={13} />
        </button>
      </div>

      <EditItemSheet open={open} onClose={() => setOpen(false)} item={item} />
    </>
  );
}

function EditItemSheet({
  open,
  onClose,
  item,
}: {
  open: boolean;
  onClose: () => void;
  item: Item;
}) {
  const [name, setName] = useState(item.item_name);
  const [qty, setQty] = useState(item.qty != null ? String(item.qty) : "");
  const [unit, setUnit] = useState(item.unit ?? "");
  const [supplier, setSupplier] = useState(item.supplier ?? "");
  const [cost, setCost] = useState(String(item.estimated_cost));
  const [notes, setNotes] = useState(item.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    setName(item.item_name);
    setQty(item.qty != null ? String(item.qty) : "");
    setUnit(item.unit ?? "");
    setSupplier(item.supplier ?? "");
    setCost(String(item.estimated_cost));
    setNotes(item.notes ?? "");
    setError(null);
    onClose();
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        await updateShoppingItem(item.id, item.list_id, {
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
    <Sheet open={open} onClose={close} title="Edit item">
      <div style={{ paddingBottom: 24 }}>
        <Field label="Item">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8 }}>
          <Field label="Quantity">
            <TextInput value={qty} onChange={(e) => setQty(e.target.value.replace(/[^0-9.]/g, ""))} />
          </Field>
          <Field label="Unit">
            <TextInput value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="kg" />
          </Field>
        </div>
        <Field label="Supplier" optional>
          <TextInput value={supplier} onChange={(e) => setSupplier(e.target.value)} />
        </Field>
        <Field label="Estimated cost">
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

        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <Button variant="secondary" size="lg" full onClick={close}>
            Cancel
          </Button>
          <Button variant="primary" size="lg" full onClick={submit} disabled={isPending}>
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>

        <div style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 14 }}>
          <ConfirmDelete
            label={item.item_name}
            description="Removes this item from the list."
            confirmWord="DELETE"
            buttonLabel="Delete item"
            onConfirm={async () => {
              await deleteShoppingItem(item.id, item.list_id);
              onClose();
            }}
          />
        </div>
      </div>
    </Sheet>
  );
}
