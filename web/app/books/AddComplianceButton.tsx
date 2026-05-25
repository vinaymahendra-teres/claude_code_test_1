"use client";

import { useState, useTransition } from "react";
import { Field } from "@/components/ui";
import { Sheet, TextInput, Button } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { createCompliance } from "./compliance-actions";

const TYPES = [
  { v: "licence", label: "Licence" },
  { v: "tax-return", label: "Tax return" },
  { v: "advance-tax", label: "Advance tax" },
  { v: "insurance", label: "Insurance" },
  { v: "renewal", label: "Renewal" },
];

export function AddComplianceButton() {
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState("");
  const [type, setType] = useState("renewal");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setItem("");
    setType("renewal");
    setDueDate("");
    setNote("");
    setError(null);
  }
  function close() {
    reset();
    setOpen(false);
  }
  function submit() {
    setError(null);
    if (!item.trim()) {
      setError("Item is required");
      return;
    }
    if (!dueDate) {
      setError("Due date is required");
      return;
    }
    startTransition(async () => {
      try {
        await createCompliance({ item, type, due_date: dueDate, note });
        close();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={addBtn}>
        <Icon.Plus size={14} /> Add
      </button>

      <Sheet open={open} onClose={close} title="Add compliance item">
        <div style={{ paddingBottom: 24 }}>
          <Field label="Item">
            <TextInput
              value={item}
              onChange={(e) => setItem(e.target.value)}
              placeholder="e.g. FSSAI licence renewal"
              autoFocus
            />
          </Field>
          <Field label="Type">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {TYPES.map((t) => {
                const sel = type === t.v;
                return (
                  <span
                    key={t.v}
                    onClick={() => setType(t.v)}
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
                    {t.label}
                  </span>
                );
              })}
            </div>
          </Field>
          <Field label="Due date">
            <TextInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
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

          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="secondary" size="lg" full onClick={close}>
              Cancel
            </Button>
            <Button variant="primary" size="lg" full onClick={submit} disabled={isPending}>
              {isPending ? "Saving…" : "Add item"}
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}

const addBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  padding: "5px 10px",
  fontSize: 12,
  fontWeight: 600,
  background: "var(--caramel-soft)",
  color: "var(--caramel-deep)",
  border: "1px solid var(--caramel)",
  borderRadius: 999,
  cursor: "pointer",
  fontFamily: "inherit",
};
