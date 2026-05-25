"use client";

import { useState, useTransition } from "react";
import { Field } from "@/components/ui";
import { Sheet, TextInput, Button } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import {
  renameShoppingList,
  completeShoppingList,
  reopenShoppingList,
  archiveShoppingList,
  deleteShoppingList,
  refillShoppingList,
  type AutoFillMode,
} from "../actions";

export function ListToolbar({
  id,
  name,
  notes,
  status,
}: {
  id: string;
  name: string;
  notes: string;
  status: "open" | "completed" | "archived";
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"menu" | "rename" | "refill">("menu");
  const [draftName, setDraftName] = useState(name);
  const [draftNotes, setDraftNotes] = useState(notes);
  const [refillMode, setRefillMode] = useState<AutoFillMode>("both");
  const [horizon, setHorizon] = useState("7");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    setMode("menu");
    setDraftName(name);
    setDraftNotes(notes);
    setError(null);
    setOpen(false);
  }

  function run<T>(fn: () => Promise<T>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        close();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={kebabBtn} aria-label="List actions">
        <Icon.More size={18} />
      </button>

      <Sheet open={open} onClose={close} title={name}>
        {mode === "menu" && (
          <div style={{ paddingBottom: 24 }}>
            {status === "open" && (
              <>
                <button type="button" onClick={() => run(() => completeShoppingList(id))} style={actionRow("sage")}>
                  <Icon.Check size={18} />
                  <div>
                    <div style={rowLabel}>Mark complete</div>
                    <div style={rowDesc}>Stamp today; keeps items as history</div>
                  </div>
                </button>
                <button type="button" onClick={() => setMode("refill")} style={actionRow("caramel")}>
                  <Icon.Sparkle size={18} />
                  <div>
                    <div style={rowLabel}>Refill from inventory / orders</div>
                    <div style={rowDesc}>Adds items not already on the list</div>
                  </div>
                </button>
              </>
            )}

            {status !== "open" && (
              <button type="button" onClick={() => run(() => reopenShoppingList(id))} style={actionRow("caramel")}>
                <Icon.Sparkle size={18} />
                <div>
                  <div style={rowLabel}>Reopen list</div>
                  <div style={rowDesc}>Marks back as open for pickup</div>
                </div>
              </button>
            )}

            <button type="button" onClick={() => setMode("rename")} style={actionRow("rose")}>
              <Icon.Edit size={18} />
              <div>
                <div style={rowLabel}>Rename / edit notes</div>
                <div style={rowDesc}>Update the title and free-text notes</div>
              </div>
            </button>

            {status !== "archived" && (
              <button type="button" onClick={() => run(() => archiveShoppingList(id))} style={actionRow("rose")}>
                <Icon.Box size={18} />
                <div>
                  <div style={rowLabel}>Archive</div>
                  <div style={rowDesc}>Hides from active and completed tabs</div>
                </div>
              </button>
            )}

            {error && (
              <div style={errBox}>{error}</div>
            )}

            <div style={{ height: 1, background: "var(--line-soft)", margin: "12px 0" }} />

            <ConfirmDelete
              label={name}
              description="Permanently removes this list and all its items."
              confirmWord="DELETE"
              buttonLabel="Delete list"
              onConfirm={async () => {
                await deleteShoppingList(id);
                close();
              }}
            />

            <div style={{ marginTop: 14 }}>
              <Button variant="secondary" size="lg" full onClick={close}>
                Close
              </Button>
            </div>
          </div>
        )}

        {mode === "rename" && (
          <div style={{ paddingBottom: 24 }}>
            <button onClick={() => setMode("menu")} type="button" style={backLink}>
              <Icon.ChevronLeft size={14} /> Back
            </button>
            <Field label="Name">
              <TextInput value={draftName} onChange={(e) => setDraftName(e.target.value)} autoFocus />
            </Field>
            <Field label="Notes" optional>
              <TextInput multiline value={draftNotes} onChange={(e) => setDraftNotes(e.target.value)} />
            </Field>
            {error && <div style={errBox}>{error}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="secondary" size="lg" full onClick={() => setMode("menu")}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="lg"
                full
                disabled={isPending || !draftName.trim()}
                onClick={() => run(() => renameShoppingList(id, draftName, draftNotes))}
              >
                {isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        )}

        {mode === "refill" && (
          <div style={{ paddingBottom: 24 }}>
            <button onClick={() => setMode("menu")} type="button" style={backLink}>
              <Icon.ChevronLeft size={14} /> Back
            </button>
            <Field label="Pull from">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(
                  [
                    { v: "low-stock", label: "Low stock only" },
                    { v: "orders", label: "Upcoming orders only" },
                    { v: "both", label: "Both" },
                  ] as const
                ).map((o) => {
                  const sel = refillMode === o.v;
                  return (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => setRefillMode(o.v)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        borderRadius: "var(--r)",
                        border: "1.5px solid " + (sel ? "var(--caramel)" : "var(--line)"),
                        background: sel ? "var(--caramel-soft)" : "var(--surface)",
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
                      <div style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>{o.label}</div>
                    </button>
                  );
                })}
              </div>
            </Field>
            {(refillMode === "orders" || refillMode === "both") && (
              <Field label="Orders horizon (days)">
                <TextInput value={horizon} onChange={(e) => setHorizon(e.target.value.replace(/[^0-9]/g, ""))} />
              </Field>
            )}
            {error && <div style={errBox}>{error}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="secondary" size="lg" full onClick={() => setMode("menu")}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="lg"
                full
                disabled={isPending}
                onClick={() =>
                  run(() =>
                    refillShoppingList(id, refillMode, Math.max(1, parseInt(horizon || "7", 10))),
                  )
                }
              >
                {isPending ? "Refilling…" : "Refill"}
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}

const kebabBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 32,
  height: 32,
  borderRadius: 999,
  background: "var(--surface)",
  color: "var(--ink-soft)",
  border: "1px solid var(--line-soft)",
  cursor: "pointer",
  flexShrink: 0,
};

function actionRow(tone: "caramel" | "rose" | "sage"): React.CSSProperties {
  const palette = {
    caramel: { bg: "var(--caramel-soft)", fg: "var(--caramel-deep)" },
    rose: { bg: "var(--rose-soft)", fg: "oklch(0.38 0.10 25)" },
    sage: { bg: "var(--sage-soft)", fg: "oklch(0.34 0.07 145)" },
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
const errBox: React.CSSProperties = {
  padding: 10,
  background: "oklch(0.94 0.05 28)",
  border: "1px solid var(--danger)",
  borderRadius: "var(--r)",
  fontSize: 12.5,
  color: "var(--danger)",
  marginBottom: 12,
};
