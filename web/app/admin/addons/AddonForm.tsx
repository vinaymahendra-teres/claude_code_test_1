"use client";

import { useState, useTransition } from "react";
import { Field } from "@/components/ui";
import { TextInput, Button, Toggle } from "@/components/ui-client";
import { ADDON_CATEGORIES, type AddonCategory } from "@/lib/customisation";
import { type AddonInput, type AddonRow } from "./actions";

type InventoryItem = { id: string; name: string; unit: string };

export function AddonForm({
  initial,
  inventory,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial?: AddonRow | null;
  inventory: InventoryItem[];
  onSubmit: (input: AddonInput) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<AddonCategory>(initial?.category ?? "decor");
  const [defaultCost, setDefaultCost] = useState(String(initial?.default_cost ?? 0));
  const [defaultQty, setDefaultQty] = useState(String(initial?.default_qty ?? 1));
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [stockItemId, setStockItemId] = useState(initial?.stock_item_id ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    startTransition(async () => {
      try {
        await onSubmit({
          name,
          category,
          default_cost: parseFloat(defaultCost) || 0,
          default_qty: parseFloat(defaultQty) || 1,
          unit,
          stock_item_id: stockItemId || null,
          notes,
          is_active: isActive,
          sort_order: initial?.sort_order ?? 999,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      <Field label="Name">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Hand-piped roses"
          autoFocus
        />
      </Field>
      <Field label="Category">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {ADDON_CATEGORIES.map((c) => {
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Field label="Default cost (₹)">
          <TextInput
            value={defaultCost}
            onChange={(e) => setDefaultCost(e.target.value.replace(/[^0-9.]/g, ""))}
            prefix="₹"
          />
        </Field>
        <Field label="Default qty">
          <TextInput
            value={defaultQty}
            onChange={(e) => setDefaultQty(e.target.value.replace(/[^0-9.]/g, ""))}
          />
        </Field>
      </div>
      <Field label="Unit" optional>
        <TextInput
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="each / set / g"
        />
      </Field>
      <Field label="Linked inventory item" optional hint="So shopping lists know which stock to pull">
        <select
          value={stockItemId}
          onChange={(e) => setStockItemId(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r)",
            fontSize: 14,
            fontFamily: "inherit",
          }}
        >
          <option value="">— none —</option>
          {inventory.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
              {i.unit ? ` (${i.unit})` : ""}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Active">
        <Toggle
          checked={isActive}
          onChange={setIsActive}
          label={isActive ? "Yes — show in pickers" : "No — hidden from pickers"}
        />
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
        <Button variant="secondary" size="lg" full onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="lg" full onClick={submit} disabled={isPending}>
          {isPending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </div>
  );
}
