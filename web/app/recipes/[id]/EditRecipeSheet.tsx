"use client";

import { useState, useTransition } from "react";
import { Field } from "@/components/ui";
import { Sheet, TextInput, Button, Toggle } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { updateRecipe, type RecipeEdit, type Ingredient } from "./actions";

const CATEGORIES = ["Signature", "Classic", "Eggless", "Seasonal", "Cupcake", "Other"];

export function EditRecipeSheet({
  id,
  initial,
}: {
  id: string;
  initial: RecipeEdit;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial.name);
  const [category, setCategory] = useState(initial.category);
  const [eggless, setEggless] = useState(initial.eggless);
  const [yieldNote, setYieldNote] = useState(initial.yield_note);
  const [prepMins, setPrepMins] = useState(String(initial.prep_mins));
  const [bakeMins, setBakeMins] = useState(String(initial.bake_mins));
  const [costPerCake, setCostPerCake] = useState(String(initial.cost_per_cake));
  const [ingredients, setIngredients] = useState<Ingredient[]>(initial.ingredients);
  const [method, setMethod] = useState<string[]>(initial.method);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setError(null);
  }

  function setIng(i: number, patch: Partial<Ingredient>) {
    setIngredients((arr) => arr.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  function addIng() {
    setIngredients((arr) => [...arr, { item: "", qty: "" }]);
  }
  function removeIng(i: number) {
    setIngredients((arr) => arr.filter((_, idx) => idx !== i));
  }
  function setStep(i: number, value: string) {
    setMethod((arr) => arr.map((x, idx) => (idx === i ? value : x)));
  }
  function addStep() {
    setMethod((arr) => [...arr, ""]);
  }
  function removeStep(i: number) {
    setMethod((arr) => arr.filter((_, idx) => idx !== i));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        await updateRecipe(id, {
          name,
          category,
          eggless,
          yield_note: yieldNote,
          prep_mins: parseFloat(prepMins) || 0,
          bake_mins: parseFloat(bakeMins) || 0,
          cost_per_cake: parseFloat(costPerCake) || 0,
          ingredients: ingredients.filter((x) => x.item.trim()),
          method: method.filter((x) => x.trim()),
        });
        close();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={editBtn}>
        <Icon.Edit size={14} /> Edit recipe
      </button>

      <Sheet open={open} onClose={close} title="Edit recipe" snap="full">
        <div style={{ paddingBottom: 24 }}>
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
          <Field label="Eggless?">
            <Toggle
              checked={eggless}
              onChange={setEggless}
              label={eggless ? "Yes — eggless build" : "Contains eggs"}
            />
          </Field>
          <Field label="Yield" optional>
            <TextInput
              value={yieldNote}
              onChange={(e) => setYieldNote(e.target.value)}
              placeholder="e.g. one 6-inch cake"
            />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <Field label="Prep (m)">
              <TextInput
                value={prepMins}
                onChange={(e) => setPrepMins(e.target.value.replace(/[^0-9]/g, ""))}
              />
            </Field>
            <Field label="Bake (m)">
              <TextInput
                value={bakeMins}
                onChange={(e) => setBakeMins(e.target.value.replace(/[^0-9]/g, ""))}
              />
            </Field>
            <Field label="Cost (₹)">
              <TextInput
                value={costPerCake}
                onChange={(e) => setCostPerCake(e.target.value.replace(/[^0-9]/g, ""))}
                prefix="₹"
              />
            </Field>
          </div>

          <Field label="Ingredients">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {ingredients.map((ing, i) => (
                <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    value={ing.item}
                    onChange={(e) => setIng(i, { item: e.target.value })}
                    placeholder="Item"
                    style={ingInput}
                  />
                  <input
                    value={ing.qty}
                    onChange={(e) => setIng(i, { qty: e.target.value })}
                    placeholder="Qty"
                    style={{ ...ingInput, width: 96, flexShrink: 0 }}
                  />
                  <button
                    type="button"
                    onClick={() => removeIng(i)}
                    style={removeBtn}
                    aria-label="Remove"
                  >
                    <Icon.X size={14} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addIng} style={addRow}>
                <Icon.Plus size={14} /> Add ingredient
              </button>
            </div>
          </Field>

          <Field label="Method">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {method.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <span style={stepNum}>{i + 1}</span>
                  <textarea
                    value={step}
                    onChange={(e) => setStep(i, e.target.value)}
                    placeholder={`Step ${i + 1}`}
                    style={{ ...ingInput, minHeight: 50, resize: "vertical" }}
                  />
                  <button
                    type="button"
                    onClick={() => removeStep(i)}
                    style={removeBtn}
                    aria-label="Remove"
                  >
                    <Icon.X size={14} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addStep} style={addRow}>
                <Icon.Plus size={14} /> Add step
              </button>
            </div>
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
              {isPending ? "Saving…" : "Save recipe"}
            </Button>
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

const ingInput: React.CSSProperties = {
  flex: 1,
  fontFamily: "inherit",
  fontSize: 13,
  padding: "9px 10px",
  border: "1px solid var(--line)",
  borderRadius: "var(--r)",
  background: "var(--surface)",
  color: "var(--ink)",
  outline: "none",
  boxSizing: "border-box",
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
  flexShrink: 0,
};

const stepNum: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 999,
  background: "var(--caramel-soft)",
  color: "var(--caramel-deep)",
  display: "grid",
  placeItems: "center",
  fontSize: 11,
  fontWeight: 700,
  flexShrink: 0,
  marginTop: 6,
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
};
