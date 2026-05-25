"use client";

import { useState, useTransition } from "react";
import { Sheet } from "@/components/ui-client";
import { Icon } from "@/components/Icon";

/**
 * Two-step delete with typed confirmation. The caller passes the entity's
 * label and an action that performs the actual delete.
 *
 * <ConfirmDelete
 *   label="Aanya Reddy"
 *   description="Removes this customer. Their past orders keep history but lose the link."
 *   confirmWord="DELETE"
 *   onConfirm={async () => { await deleteCustomer(id); }}
 *   buttonLabel="Delete customer"
 * />
 */
export function ConfirmDelete({
  label,
  description,
  confirmWord = "DELETE",
  buttonLabel,
  onConfirm,
}: {
  label: string;
  description: string;
  confirmWord?: string;
  buttonLabel: string;
  onConfirm: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setTyped("");
    setError(null);
  }

  function commit() {
    if (typed.trim() !== confirmWord) {
      setError(`Type "${confirmWord}" to confirm.`);
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await onConfirm();
        close();
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
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 14px",
          fontSize: 13,
          fontWeight: 600,
          background: "transparent",
          color: "var(--danger)",
          border: "1px solid var(--danger)",
          borderRadius: "var(--r)",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        <Icon.X size={14} /> {buttonLabel}
      </button>

      <Sheet open={open} onClose={close} title={buttonLabel}>
        <div style={{ paddingBottom: 24 }}>
          <div
            style={{
              padding: "10px 12px",
              borderRadius: "var(--r)",
              background: "oklch(0.94 0.05 28)",
              border: "1px solid var(--danger)",
              color: "var(--danger)",
              fontSize: 13,
              lineHeight: 1.5,
              marginBottom: 16,
            }}
          >
            <strong>{label}</strong> — {description}
          </div>

          <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 6 }}>
            Type <code style={{ fontWeight: 700 }}>{confirmWord}</code> to confirm:
          </div>
          <input
            value={typed}
            onChange={(e) => {
              setTyped(e.target.value);
              setError(null);
            }}
            placeholder={confirmWord}
            autoFocus
            style={{
              width: "100%",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 14,
              padding: "11px 12px",
              border: "1px solid " + (error ? "var(--danger)" : "var(--line)"),
              borderRadius: "var(--r)",
              background: "var(--surface)",
              outline: "none",
              boxSizing: "border-box",
              letterSpacing: "0.04em",
            }}
          />
          {error && (
            <div style={{ fontSize: 11.5, color: "var(--danger)", marginTop: 6 }}>{error}</div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button
              type="button"
              onClick={close}
              autoFocus
              style={{
                flex: 1,
                padding: "12px",
                fontSize: 14,
                fontWeight: 600,
                background: "var(--surface)",
                color: "var(--ink)",
                border: "1px solid var(--line)",
                borderRadius: "var(--r)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={commit}
              disabled={isPending || typed.trim() !== confirmWord}
              style={{
                flex: 1,
                padding: "12px",
                fontSize: 14,
                fontWeight: 600,
                background: typed.trim() === confirmWord ? "var(--danger)" : "var(--surface-3)",
                color: typed.trim() === confirmWord ? "var(--surface)" : "var(--muted)",
                border: "1px solid " + (typed.trim() === confirmWord ? "var(--danger)" : "var(--line)"),
                borderRadius: "var(--r)",
                cursor: isPending || typed.trim() !== confirmWord ? "not-allowed" : "pointer",
                opacity: isPending ? 0.6 : 1,
                fontFamily: "inherit",
              }}
            >
              {isPending ? "Deleting…" : buttonLabel}
            </button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
