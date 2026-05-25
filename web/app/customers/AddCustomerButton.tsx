"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Field } from "@/components/ui";
import { Sheet, TextInput, Button } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { BranchPicker, type BranchOption } from "@/components/BranchPicker";
import { createCustomer } from "./[id]/actions";

const TAG_OPTIONS = ["VIP", "Eggless", "Allergy-egg", "Allergy-nut", "Festival regular"];

export function AddCustomerButton({
  branches,
  defaultBranchId,
}: {
  branches: BranchOption[];
  defaultBranchId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [branchId, setBranchId] = useState(defaultBranchId ?? branches[0]?.id ?? "");
  const [addressDetail, setAddressDetail] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName("");
    setPhone("");
    setInstagram("");
    setBranchId(defaultBranchId ?? branches[0]?.id ?? "");
    setAddressDetail("");
    setTags([]);
    setError(null);
  }
  function close() {
    reset();
    setOpen(false);
  }

  function submit() {
    setError(null);
    if (!branchId) {
      setError("Pick a branch");
      return;
    }
    startTransition(async () => {
      try {
        const id = await createCustomer({
          name,
          phone,
          instagram,
          branchId,
          addressDetail,
          tags,
        });
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
          <Field label="Branch" hint="Which gated community do they live in">
            <BranchPicker branches={branches} value={branchId} onChange={(v) => setBranchId(v ?? "")} />
          </Field>
          <Field label="Tower / flat" optional hint='e.g. "T-3, 1602"'>
            <TextInput
              value={addressDetail}
              onChange={(e) => setAddressDetail(e.target.value)}
              placeholder="Tower + flat"
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
