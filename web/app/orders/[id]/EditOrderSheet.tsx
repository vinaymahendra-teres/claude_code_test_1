"use client";

import { useState, useTransition } from "react";
import { Field } from "@/components/ui";
import { Sheet, TextInput, Button } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { updateOrder, cancelOrder, deleteOrder, type OrderEdit } from "./actions";

const SLOTS = ["9 AM", "11 AM", "1 PM", "3 PM", "5 PM", "7 PM", "8 PM", "Anytime"];

export function EditOrderSheet({
  id,
  initial,
  canCancel,
}: {
  id: string;
  initial: OrderEdit;
  canCancel: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initial.title);
  const [price, setPrice] = useState(String(initial.price));
  const [deposit, setDeposit] = useState(String(initial.deposit));
  const [date, setDate] = useState(initial.delivery_date);
  const [slot, setSlot] = useState(initial.delivery_slot);
  const [area, setArea] = useState(initial.delivery_area);
  const [cold, setCold] = useState(initial.cold_chain_notes);
  const [notes, setNotes] = useState(initial.notes);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setError(null);
  }

  function submit() {
    setError(null);
    const p = parseFloat(price) || 0;
    const d = parseFloat(deposit) || 0;
    if (d > p) {
      setError("Deposit cannot exceed price");
      return;
    }
    startTransition(async () => {
      try {
        await updateOrder(id, {
          title,
          price: p,
          deposit: d,
          delivery_date: date,
          delivery_slot: slot,
          delivery_area: area,
          cold_chain_notes: cold,
          notes,
        });
        close();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  function doCancel() {
    startTransition(async () => {
      try {
        await cancelOrder(id);
        close();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={editBtn}>
        <Icon.Edit size={14} /> Edit order
      </button>

      <Sheet open={open} onClose={close} title="Edit order" snap="full">
        <div style={{ paddingBottom: 24 }}>
          <Field label="Order name">
            <TextInput value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Field label="Price">
              <TextInput
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))}
                prefix="₹"
              />
            </Field>
            <Field label="Deposit">
              <TextInput
                value={deposit}
                onChange={(e) => setDeposit(e.target.value.replace(/[^0-9.]/g, ""))}
                prefix="₹"
              />
            </Field>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: -8, marginBottom: 14 }}>
            Balance on delivery:{" "}
            <strong>
              ₹{Math.max(0, (parseFloat(price) || 0) - (parseFloat(deposit) || 0)).toLocaleString("en-IN")}
            </strong>
          </div>

          <Field label="Delivery date">
            <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Time slot">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
              {SLOTS.map((s) => {
                const sel = slot === s;
                return (
                  <div
                    key={s}
                    onClick={() => setSlot(s)}
                    style={{
                      padding: "9px 4px",
                      fontSize: 12.5,
                      border: "1.5px solid " + (sel ? "var(--caramel)" : "var(--line)"),
                      background: sel ? "var(--caramel-soft)" : "var(--surface)",
                      borderRadius: "var(--r)",
                      textAlign: "center",
                      cursor: "pointer",
                      fontWeight: sel ? 600 : 500,
                    }}
                  >
                    {s}
                  </div>
                );
              })}
            </div>
          </Field>
          <Field label="Area / address">
            <TextInput value={area} onChange={(e) => setArea(e.target.value)} />
          </Field>
          <Field label="Cold-chain notes" optional>
            <TextInput value={cold} onChange={(e) => setCold(e.target.value)} />
          </Field>
          <Field label="Internal notes" optional>
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
            <Button variant="primary" size="lg" full onClick={submit} disabled={isPending}>
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>

          <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--line-soft)" }}>
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 8 }}>
              Danger zone
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {canCancel && (
                <button
                  type="button"
                  onClick={doCancel}
                  disabled={isPending}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    background: "var(--surface)",
                    color: "var(--warn)",
                    border: "1px solid var(--warn)",
                    borderRadius: "var(--r)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  <Icon.X size={14} /> Cancel order
                </button>
              )}
              <ConfirmDelete
                label={title || `Order ${id}`}
                description="Permanently removes this order. Cancelling instead keeps it in history."
                confirmWord="DELETE"
                buttonLabel="Delete order"
                onConfirm={deleteOrder.bind(null, id)}
              />
            </div>
          </div>
        </div>
      </Sheet>
    </>
  );
}

const editBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  fontSize: 13,
  fontWeight: 600,
  background: "var(--surface)",
  color: "var(--ink)",
  border: "1px solid var(--line)",
  borderRadius: "var(--r)",
  cursor: "pointer",
  fontFamily: "inherit",
};
