"use client";

import { useState, useTransition } from "react";
import { Field } from "@/components/ui";
import { TextInput, Button, Toggle } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { fmtMoney } from "@/lib/format";
import {
  type ProductLineRow,
  type ProductLineInput,
  type ProductLineSize,
} from "./actions";

export function LineForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
  lockName,
}: {
  initial?: ProductLineRow | null;
  onSubmit: (input: ProductLineInput) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  lockName?: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [defaultUnit, setDefaultUnit] = useState(initial?.default_unit ?? "");
  const [sizes, setSizes] = useState<ProductLineSize[]>(
    Array.isArray(initial?.sizes) ? initial.sizes : [],
  );
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function patchSize(i: number, patch: Partial<ProductLineSize>) {
    setSizes((arr) => arr.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function addSize() {
    setSizes((arr) => [...arr, { name: "", servings: 1, price_hint: 0 }]);
  }
  function removeSize(i: number) {
    setSizes((arr) => arr.filter((_, idx) => idx !== i));
  }

  function submit() {
    setError(null);
    if (!label.trim()) {
      setError("Label is required");
      return;
    }
    const cleanSizes = sizes.filter((s) => s.name.trim());
    startTransition(async () => {
      try {
        await onSubmit({
          name,
          label,
          description,
          default_unit: defaultUnit,
          sizes: cleanSizes,
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
      <Field label="Label" hint="What operators see in the picker">
        <TextInput
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Cupcake box"
          autoFocus
        />
      </Field>
      {!lockName && (
        <Field label="Name (machine-friendly)" hint="Lowercase, no spaces — used internally">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="cupcake"
          />
        </Field>
      )}
      <Field label="Description" optional>
        <TextInput
          multiline
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>
      <Field label="Default unit" optional hint="cake · box · tray · tub · piece">
        <TextInput
          value={defaultUnit}
          onChange={(e) => setDefaultUnit(e.target.value)}
          placeholder="box"
        />
      </Field>

      <Field label="Sizes">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {sizes.map((s, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 70px 80px 28px",
                gap: 6,
                alignItems: "center",
              }}
            >
              <input
                value={s.name}
                onChange={(e) => patchSize(i, { name: e.target.value })}
                placeholder="Box of 12"
                style={ingInput}
              />
              <input
                value={String(s.servings)}
                onChange={(e) =>
                  patchSize(i, { servings: parseInt(e.target.value, 10) || 0 })
                }
                placeholder="servings"
                style={{ ...ingInput, textAlign: "center" }}
              />
              <input
                value={s.price_hint != null ? String(s.price_hint) : ""}
                onChange={(e) =>
                  patchSize(i, { price_hint: parseFloat(e.target.value) || 0 })
                }
                placeholder="₹ hint"
                style={{ ...ingInput, textAlign: "center" }}
              />
              <button
                type="button"
                onClick={() => removeSize(i)}
                aria-label="Remove"
                style={removeBtn}
              >
                <Icon.X size={14} />
              </button>
            </div>
          ))}
          <button type="button" onClick={addSize} style={addRow}>
            <Icon.Plus size={14} /> Add size
          </button>
        </div>
      </Field>

      <Field label="Active">
        <Toggle
          checked={isActive}
          onChange={setIsActive}
          label={isActive ? "Yes — surfaced on New Order" : "Hidden from New Order"}
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

      <div style={{ display: "flex", gap: 10 }}>
        <Button variant="secondary" size="lg" full onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="lg" full onClick={submit} disabled={isPending}>
          {isPending ? "Saving…" : submitLabel}
        </Button>
      </div>

      {sizes.length > 0 && (
        <div
          style={{
            marginTop: 14,
            padding: 10,
            background: "var(--surface-2)",
            border: "1px dashed var(--line)",
            borderRadius: "var(--r)",
            fontSize: 11.5,
            color: "var(--muted)",
            lineHeight: 1.5,
          }}
        >
          {sizes
            .filter((s) => s.name)
            .map((s) => `${s.name} — ${s.servings}p${s.price_hint ? ` · ${fmtMoney(s.price_hint)}` : ""}`)
            .join(" · ")}
        </div>
      )}
    </div>
  );
}

const ingInput: React.CSSProperties = {
  fontFamily: "inherit",
  fontSize: 13,
  padding: "9px 10px",
  border: "1px solid var(--line)",
  borderRadius: "var(--r)",
  background: "var(--surface)",
  color: "var(--ink)",
  outline: "none",
  boxSizing: "border-box",
  width: "100%",
};

const removeBtn: React.CSSProperties = {
  width: 28,
  height: 28,
  border: "none",
  background: "var(--surface-3)",
  color: "var(--muted)",
  borderRadius: 999,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const addRow: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 12px",
  background: "var(--surface-3)",
  border: "1px dashed var(--line)",
  borderRadius: "var(--r)",
  fontSize: 12.5,
  fontWeight: 600,
  color: "var(--ink-soft)",
  cursor: "pointer",
  fontFamily: "inherit",
  alignSelf: "flex-start",
};
