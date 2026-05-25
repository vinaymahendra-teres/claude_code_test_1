"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Field } from "@/components/ui";
import { Sheet, TextInput, Button } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { createShoppingList, type AutoFillMode } from "./actions";

const AUTOFILL_OPTIONS: Array<{ v: AutoFillMode; label: string; desc: string }> = [
  { v: "low-stock", label: "Low stock", desc: "Items below their reorder point" },
  { v: "orders", label: "Upcoming orders", desc: "Ingredients for orders in the horizon" },
  { v: "both", label: "Both", desc: "Pull low-stock items and order requirements" },
  { v: "none", label: "Blank list", desc: "Add items by hand" },
];

export function NewListButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [autofill, setAutofill] = useState<AutoFillMode>("low-stock");
  const [horizon, setHorizon] = useState("7");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    setName("");
    setNotes("");
    setAutofill("low-stock");
    setHorizon("7");
    setError(null);
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
        const id = await createShoppingList({
          name,
          notes,
          autofill,
          ordersHorizonDays: Math.max(1, parseInt(horizon || "7", 10)),
        });
        close();
        router.push(`/shopping/${id}`);
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
        aria-label="New shopping list"
        title="New list"
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

      <Sheet open={open} onClose={close} title="New shopping list">
        <div style={{ paddingBottom: 24 }}>
          <Field label="Name">
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Weekend pickup · Karwa"
              autoFocus
            />
          </Field>
          <Field label="Notes" optional>
            <TextInput multiline value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>

          <Field label="Auto-fill">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {AUTOFILL_OPTIONS.map((o) => {
                const sel = autofill === o.v;
                return (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => setAutofill(o.v)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: "var(--r)",
                      border: "1.5px solid " + (sel ? "var(--caramel)" : "var(--line)"),
                      background: sel ? "var(--caramel-soft)" : "var(--surface)",
                      color: "var(--ink)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 999,
                        border: "1.5px solid " + (sel ? "var(--caramel-deep)" : "var(--line)"),
                        background: sel ? "var(--caramel)" : "transparent",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      {sel && <Icon.Check size={11} />}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{o.label}</div>
                      <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 1 }}>
                        {o.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Field>

          {(autofill === "orders" || autofill === "both") && (
            <Field label="Orders horizon (days)" hint="Look this far ahead for upcoming orders">
              <TextInput
                value={horizon}
                onChange={(e) => setHorizon(e.target.value.replace(/[^0-9]/g, ""))}
              />
            </Field>
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
            <Button variant="secondary" size="lg" full onClick={close}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="lg"
              full
              onClick={submit}
              disabled={isPending || !name.trim()}
            >
              {isPending ? "Creating…" : "Create list"}
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
