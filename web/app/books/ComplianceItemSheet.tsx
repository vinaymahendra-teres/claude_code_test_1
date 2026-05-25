"use client";

import { useState, useTransition } from "react";
import { Sheet, Button } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { setComplianceStatus, deleteCompliance } from "./compliance-actions";

export function ComplianceItemSheet({
  id,
  label,
  dueLabel,
}: {
  id: string;
  label: string;
  dueLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setError(null);
  }

  function setStatus(status: "completed" | "dismissed" | "open") {
    setError(null);
    startTransition(async () => {
      try {
        await setComplianceStatus(id, status);
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
        aria-label={`Actions for ${label}`}
        title="Actions"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 28,
          height: 28,
          borderRadius: 999,
          background: "var(--surface-3)",
          color: "var(--ink-soft)",
          border: "none",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <Icon.More size={14} />
      </button>

      <Sheet open={open} onClose={close} title={label}>
        <div style={{ paddingBottom: 24 }}>
          <div
            style={{
              fontSize: 12,
              color: "var(--muted)",
              marginBottom: 14,
            }}
          >
            {dueLabel}
          </div>

          <button
            type="button"
            onClick={() => setStatus("completed")}
            disabled={isPending}
            style={actionRow("sage")}
          >
            <Icon.Check size={18} />
            <div>
              <div style={rowLabel}>Mark complete</div>
              <div style={rowDesc}>Filed, paid, or renewed — stamp today&rsquo;s date</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatus("dismissed")}
            disabled={isPending}
            style={actionRow("rose")}
          >
            <Icon.X size={18} />
            <div>
              <div style={rowLabel}>Dismiss</div>
              <div style={rowDesc}>Not applicable to this business</div>
            </div>
          </button>

          {error && (
            <div
              style={{
                marginTop: 10,
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

          <div style={{ height: 1, background: "var(--line-soft)", margin: "12px 0" }} />

          <ConfirmDelete
            label={label}
            description="Removes this compliance item permanently."
            confirmWord="DELETE"
            buttonLabel="Delete item"
            onConfirm={async () => {
              await deleteCompliance(id);
              close();
            }}
          />

          <div style={{ marginTop: 14 }}>
            <Button variant="secondary" size="lg" full onClick={close}>
              Close
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}

function actionRow(tone: "sage" | "rose"): React.CSSProperties {
  const palette = {
    sage: { bg: "var(--sage-soft)", fg: "oklch(0.34 0.07 145)" },
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
