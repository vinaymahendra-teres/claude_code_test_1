"use client";

import { useState, useTransition } from "react";
import { Field } from "@/components/ui";
import { Sheet, TextInput, Button } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import {
  type InventoryEdit,
  updateInventoryItem,
  restockItem,
  deleteInventoryItem,
} from "./actions";

const CATEGORIES = ["Staples", "Dairy", "Sweeteners", "Premium", "Decor", "Packaging", "Other"];

type Item = InventoryEdit & { id: string };

export function InventoryItemSheet({ item }: { item: Item }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"menu" | "restock" | "edit">("menu");

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMode("menu");
          setOpen(true);
        }}
        title="Actions"
        aria-label={`${item.name} actions`}
        style={iconBtn}
      >
        <Icon.More size={16} />
      </button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={item.name}
      >
        {mode === "menu" && (
          <MenuView
            item={item}
            onRestock={() => setMode("restock")}
            onEdit={() => setMode("edit")}
            onClose={() => setOpen(false)}
          />
        )}
        {mode === "restock" && (
          <RestockView item={item} onBack={() => setMode("menu")} onDone={() => setOpen(false)} />
        )}
        {mode === "edit" && (
          <EditView item={item} onBack={() => setMode("menu")} onDone={() => setOpen(false)} />
        )}
      </Sheet>
    </>
  );
}

function MenuView({
  item,
  onRestock,
  onEdit,
  onClose,
}: {
  item: Item;
  onRestock: () => void;
  onEdit: () => void;
  onClose: () => void;
}) {
  return (
    <div style={{ paddingBottom: 24 }}>
      <div
        style={{
          fontSize: 12.5,
          color: "var(--muted)",
          marginBottom: 10,
        }}
      >
        Current: <strong>{item.qty}{item.unit}</strong> · reorder at {item.reorder_at}{item.unit} · cost ₹
        {item.unit_cost}/unit · supplier {item.supplier || "—"}
      </div>

      <button type="button" onClick={onRestock} style={rowAction("caramel")}>
        <Icon.Plus size={18} />
        <div>
          <div style={rowLabel}>Restock</div>
          <div style={rowDesc}>Add stock arrived from supplier</div>
        </div>
      </button>

      <button type="button" onClick={onEdit} style={rowAction("rose")}>
        <Icon.Edit size={18} />
        <div>
          <div style={rowLabel}>Edit details</div>
          <div style={rowDesc}>Rename, change reorder point, unit cost, supplier</div>
        </div>
      </button>

      <div style={{ height: 1, background: "var(--line-soft)", margin: "12px 0" }} />

      <ConfirmDelete
        label={item.name}
        description="Removes this inventory item permanently. Recipes referencing it stay but lose the stock link."
        confirmWord="DELETE"
        buttonLabel="Delete item"
        onConfirm={async () => {
          await deleteInventoryItem(item.id);
          onClose();
        }}
      />
    </div>
  );
}

function RestockView({
  item,
  onBack,
  onDone,
}: {
  item: Item;
  onBack: () => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const num = parseFloat(amount);
  const newQty = isFinite(num) && num > 0 ? Number(item.qty) + num : null;

  function submit() {
    setError(null);
    if (!isFinite(num) || num <= 0) {
      setError("Enter a positive amount");
      return;
    }
    startTransition(async () => {
      try {
        await restockItem(item.id, num);
        onDone();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      <button onClick={onBack} type="button" style={backLink}>
        <Icon.ChevronLeft size={14} /> Back
      </button>
      <Field label={`Add to ${item.qty}${item.unit} on hand`}>
        <TextInput
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="0"
          autoFocus
          style={{
            fontSize: 22,
            padding: "14px 12px",
            fontWeight: 600,
            fontFamily: "DM Serif Display, serif",
          }}
        />
      </Field>
      {newQty != null && (
        <div
          style={{
            padding: 12,
            background: "var(--sage-soft)",
            border: "1px solid var(--sage)",
            borderRadius: "var(--r)",
            fontSize: 13,
            color: "oklch(0.32 0.06 145)",
            marginBottom: 12,
          }}
        >
          New on-hand: <strong>{newQty}{item.unit}</strong>
        </div>
      )}
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
        <Button variant="secondary" size="lg" full onClick={onBack}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="lg"
          full
          onClick={submit}
          disabled={isPending || newQty == null}
        >
          {isPending ? "Saving…" : "Confirm restock"}
        </Button>
      </div>
    </div>
  );
}

function EditView({
  item,
  onBack,
  onDone,
}: {
  item: Item;
  onBack: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category);
  const [qty, setQty] = useState(String(item.qty));
  const [unit, setUnit] = useState(item.unit);
  const [reorderAt, setReorderAt] = useState(String(item.reorder_at));
  const [unitCost, setUnitCost] = useState(String(item.unit_cost));
  const [supplier, setSupplier] = useState(item.supplier);
  const [reorderQty, setReorderQty] = useState(String(item.reorder_qty));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    const next: InventoryEdit = {
      name,
      category,
      qty: parseFloat(qty) || 0,
      unit,
      reorder_at: parseFloat(reorderAt) || 0,
      unit_cost: parseFloat(unitCost) || 0,
      supplier,
      reorder_qty: parseFloat(reorderQty) || 0,
      days_cover_at_typical_use: item.days_cover_at_typical_use,
    };
    startTransition(async () => {
      try {
        await updateInventoryItem(item.id, next);
        onDone();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      <button onClick={onBack} type="button" style={backLink}>
        <Icon.ChevronLeft size={14} /> Back
      </button>
      <Field label="Name">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} autoFocus />
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
          <TextInput
            value={qty}
            onChange={(e) => setQty(e.target.value.replace(/[^0-9.]/g, ""))}
          />
        </Field>
        <Field label="Unit">
          <TextInput value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="kg" />
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Field label="Reorder at">
          <TextInput
            value={reorderAt}
            onChange={(e) => setReorderAt(e.target.value.replace(/[^0-9.]/g, ""))}
          />
        </Field>
        <Field label="Reorder qty">
          <TextInput
            value={reorderQty}
            onChange={(e) => setReorderQty(e.target.value.replace(/[^0-9.]/g, ""))}
          />
        </Field>
      </div>
      <Field label="Unit cost (₹)">
        <TextInput
          value={unitCost}
          onChange={(e) => setUnitCost(e.target.value.replace(/[^0-9.]/g, ""))}
          prefix="₹"
        />
      </Field>
      <Field label="Supplier" optional>
        <TextInput value={supplier} onChange={(e) => setSupplier(e.target.value)} />
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
        <Button variant="secondary" size="lg" full onClick={onBack}>
          Cancel
        </Button>
        <Button variant="primary" size="lg" full onClick={submit} disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 30,
  height: 30,
  borderRadius: 999,
  background: "var(--surface-3)",
  color: "var(--ink-soft)",
  border: "none",
  cursor: "pointer",
  flexShrink: 0,
};

function rowAction(tone: "caramel" | "rose"): React.CSSProperties {
  const palette = {
    caramel: { bg: "var(--caramel-soft)", fg: "var(--caramel-deep)" },
    rose: { bg: "var(--rose-soft)", fg: "oklch(0.38 0.10 25)" },
  } as const;
  return {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    padding: "12px 14px",
    marginBottom: 8,
    background: palette[tone].bg,
    color: palette[tone].fg,
    border: "none",
    borderRadius: "var(--r)",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
  };
}

const rowLabel: React.CSSProperties = { fontSize: 14, fontWeight: 700 };
const rowDesc: React.CSSProperties = { fontSize: 12, opacity: 0.85, marginTop: 2 };
const backLink: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  background: "transparent",
  color: "var(--muted)",
  border: "none",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
  padding: 0,
  margin: "0 0 14px",
  fontFamily: "inherit",
};
