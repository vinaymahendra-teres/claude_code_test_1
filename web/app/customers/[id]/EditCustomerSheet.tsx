"use client";

import { useState, useTransition } from "react";
import { Field } from "@/components/ui";
import { Sheet, TextInput, Button } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { updateCustomer, type CustomerEdit } from "./actions";

const TAG_OPTIONS = ["VIP", "Eggless", "Allergy-egg", "Allergy-nut", "Festival regular", "DND"];

export function EditCustomerSheet({
  customerId,
  initial,
}: {
  customerId: string;
  initial: CustomerEdit;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [instagram, setInstagram] = useState(initial.instagram);
  const [area, setArea] = useState(initial.area);
  const [tags, setTags] = useState<string[]>(initial.tags);
  const [notes, setNotes] = useState(initial.notes);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName(initial.name);
    setPhone(initial.phone);
    setInstagram(initial.instagram);
    setArea(initial.area);
    setTags(initial.tags);
    setNotes(initial.notes);
    setError(null);
  }

  function close() {
    reset();
    setOpen(false);
  }

  function submit() {
    setError(null);
    if (!name.trim()) {
      setError("Name cannot be empty");
      return;
    }
    startTransition(async () => {
      try {
        await updateCustomer(customerId, { name, phone, instagram, area, tags, notes });
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  const diff = computeDiff(initial, { name, phone, instagram, area, tags, notes });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={editButton}
      >
        <Icon.Edit size={14} /> Edit details
      </button>

      <Sheet open={open} onClose={close} title="Edit customer">
        <div style={{ paddingBottom: 24 }}>
          <Field label="Full name">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>
          <Field label="Phone">
            <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 …" />
          </Field>
          <Field label="Instagram">
            <TextInput
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="username"
              prefix="@"
            />
          </Field>
          <Field label="Area">
            <TextInput
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Madhapur"
            />
          </Field>
          <Field label="Tags">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {TAG_OPTIONS.map((t) => {
                const sel = tags.includes(t);
                return (
                  <span
                    key={t}
                    onClick={() =>
                      setTags(sel ? tags.filter((x) => x !== t) : [...tags, t])
                    }
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
                    {t}
                  </span>
                );
              })}
            </div>
          </Field>
          <Field label="Notes" optional>
            <TextInput
              multiline
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Allergies, family events, payment preferences…"
            />
          </Field>

          {diff.length > 0 && (
            <div
              style={{
                marginTop: 4,
                padding: 12,
                background: "var(--caramel-soft)",
                border: "1px solid var(--caramel)",
                borderRadius: "var(--r)",
                fontSize: 12,
                lineHeight: 1.6,
                color: "var(--caramel-deep)",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Changes</div>
              {diff.map(([field, before, after]) => (
                <div key={field}>
                  <strong>{field}</strong>: {before || "—"} → {after || "—"}
                </div>
              ))}
            </div>
          )}

          {error && (
            <div
              style={{
                marginTop: 12,
                padding: 10,
                background: "oklch(0.94 0.05 28)",
                border: "1px solid var(--danger)",
                borderRadius: "var(--r)",
                fontSize: 12.5,
                color: "var(--danger)",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <Button variant="secondary" size="lg" full onClick={close}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="lg"
              full
              onClick={submit}
              disabled={isPending || diff.length === 0}
            >
              {isPending ? "Saving…" : diff.length === 0 ? "No changes" : "Save changes"}
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}

function computeDiff(a: CustomerEdit, b: CustomerEdit): Array<[string, string, string]> {
  const out: Array<[string, string, string]> = [];
  const fields: Array<[keyof CustomerEdit, string]> = [
    ["name", "Name"],
    ["phone", "Phone"],
    ["instagram", "Instagram"],
    ["area", "Area"],
    ["notes", "Notes"],
  ];
  for (const [key, label] of fields) {
    const av = String(a[key] ?? "").trim();
    const bv = String(b[key] ?? "").trim();
    if (av !== bv) out.push([label, av, bv]);
  }
  const aTags = [...a.tags].sort().join(", ");
  const bTags = [...b.tags].sort().join(", ");
  if (aTags !== bTags) out.push(["Tags", aTags, bTags]);
  return out;
}

const editButton: React.CSSProperties = {
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
