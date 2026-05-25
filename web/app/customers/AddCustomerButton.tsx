"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Field } from "@/components/ui";
import { Sheet, TextInput, Button } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { createCustomer } from "./[id]/actions";

const TAG_OPTIONS = ["VIP", "Eggless", "Allergy-egg", "Allergy-nut", "Festival regular"];

export function AddCustomerButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [area, setArea] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName("");
    setPhone("");
    setInstagram("");
    setArea("");
    setTags([]);
    setError(null);
  }
  function close() {
    reset();
    setOpen(false);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        const id = await createCustomer({ name, phone, instagram, area, tags });
        close();
        router.push(`/customers/${id}`);
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
        title="Add customer"
        aria-label="Add customer"
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

      <Sheet open={open} onClose={close} title="Add customer">
        <div style={{ paddingBottom: 24 }}>
          <Field label="Full name">
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aanya Reddy"
              autoFocus
            />
          </Field>
          <Field label="Phone" hint="Phone or Instagram required">
            <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 …" />
          </Field>
          <Field label="Instagram" optional>
            <TextInput
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="username"
              prefix="@"
            />
          </Field>
          <Field label="Area" optional>
            <TextInput
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Madhapur, near IKEA"
            />
          </Field>
          <Field label="Tags" optional>
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

          {error && (
            <div
              style={{
                marginTop: 4,
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
              disabled={isPending || !name.trim()}
            >
              {isPending ? "Saving…" : "Add customer"}
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
