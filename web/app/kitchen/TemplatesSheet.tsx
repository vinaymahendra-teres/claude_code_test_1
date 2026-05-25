"use client";

import { useEffect, useState, useTransition } from "react";
import { Field } from "@/components/ui";
import { Sheet, TextInput, Button } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import {
  listTimerTemplates,
  createTimerTemplate,
  updateTimerTemplate,
  deleteTimerTemplate,
  type TimerColor,
} from "./actions";

const TIMER_COLORS: Record<TimerColor, string> = {
  caramel: "var(--caramel)",
  rose: "var(--rose)",
  sage: "var(--sage)",
  plum: "var(--plum)",
};

type Template = {
  id: string;
  label: string;
  duration_ms: number;
  color: TimerColor;
  sort_order: number;
};

function fmt(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

export function TemplatesSheet({
  open,
  onClose,
  onStart,
}: {
  open: boolean;
  onClose: () => void;
  onStart: (opts: { label: string; durationMs: number; color: TimerColor }) => void;
}) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [mode, setMode] = useState<"list" | "edit">("list");
  const [editing, setEditing] = useState<Template | null>(null);
  const [label, setLabel] = useState("");
  const [minutes, setMinutes] = useState("");
  const [color, setColor] = useState<TimerColor>("caramel");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listTimerTemplates()
      .then((rows) => setTemplates(rows as Template[]))
      .finally(() => setLoading(false));
  }, [open]);

  function startEdit(t: Template | null) {
    setEditing(t);
    setLabel(t?.label ?? "");
    setMinutes(t ? String(Math.round((t.duration_ms / 60000) * 100) / 100) : "");
    setColor(t?.color ?? "caramel");
    setError(null);
    setMode("edit");
  }

  function back() {
    setMode("list");
    setEditing(null);
    setError(null);
  }

  function save() {
    const mins = parseFloat(minutes);
    if (!label.trim() || !isFinite(mins) || mins <= 0) {
      setError("Need a label and a positive duration");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        if (editing) {
          await updateTimerTemplate(editing.id, {
            label,
            duration_ms: Math.round(mins * 60 * 1000),
            color,
          });
        } else {
          await createTimerTemplate({
            label,
            duration_ms: Math.round(mins * 60 * 1000),
            color,
          });
        }
        const rows = await listTimerTemplates();
        setTemplates(rows as Template[]);
        back();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  async function remove(id: string) {
    await deleteTimerTemplate(id);
    const rows = await listTimerTemplates();
    setTemplates(rows as Template[]);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Timer templates">
      {mode === "list" && (
        <div style={{ paddingBottom: 24 }}>
          <p
            style={{
              fontSize: 12.5,
              color: "var(--muted)",
              margin: "0 0 12px",
              lineHeight: 1.5,
            }}
          >
            Saved presets you can start with one tap.
          </p>

          {loading && (
            <div style={{ padding: 16, color: "var(--muted)", fontSize: 13 }}>Loading…</div>
          )}

          {!loading && templates.length === 0 && (
            <div
              style={{
                padding: 16,
                color: "var(--muted)",
                fontSize: 13,
                textAlign: "center",
                background: "var(--surface-2)",
                borderRadius: "var(--r)",
                border: "1px dashed var(--line)",
              }}
            >
              No templates yet. Save one from the Edit Timer sheet or add below.
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {templates.map((t) => (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  background: "var(--surface)",
                  border: "1px solid var(--line-soft)",
                  borderRadius: "var(--r)",
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: TIMER_COLORS[t.color],
                    flexShrink: 0,
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    onStart({
                      label: t.label,
                      durationMs: t.duration_ms,
                      color: t.color,
                    });
                    onClose();
                  }}
                  style={{
                    flex: 1,
                    textAlign: "left",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    padding: 0,
                  }}
                >
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>
                    {fmt(t.duration_ms)} · tap to start
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(t)}
                  aria-label="Edit"
                  style={iconBtn}
                >
                  <Icon.Edit size={14} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <Button variant="secondary" size="lg" full onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              size="lg"
              full
              onClick={() => startEdit(null)}
              icon={<Icon.Plus size={16} />}
            >
              New template
            </Button>
          </div>
        </div>
      )}

      {mode === "edit" && (
        <div style={{ paddingBottom: 24 }}>
          <button type="button" onClick={back} style={backLink}>
            <Icon.ChevronLeft size={14} /> Back
          </button>
          <Field label="Label">
            <TextInput
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Belgian Dark — bake"
              autoFocus
            />
          </Field>
          <Field label="Minutes">
            <TextInput
              value={minutes}
              onChange={(e) => setMinutes(e.target.value.replace(/[^0-9.]/g, ""))}
              style={{
                fontSize: 22,
                padding: "14px 12px",
                fontWeight: 600,
                fontFamily: "DM Serif Display, serif",
              }}
            />
          </Field>
          <Field label="Color">
            <div style={{ display: "flex", gap: 8 }}>
              {(Object.keys(TIMER_COLORS) as TimerColor[]).map((k) => (
                <span
                  key={k}
                  onClick={() => setColor(k)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: TIMER_COLORS[k],
                    cursor: "pointer",
                    boxShadow:
                      color === k
                        ? "0 0 0 3px var(--bg), 0 0 0 5px " + TIMER_COLORS[k]
                        : "none",
                  }}
                />
              ))}
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
            <Button variant="secondary" size="lg" full onClick={back}>
              Cancel
            </Button>
            <Button variant="primary" size="lg" full onClick={save} disabled={isPending}>
              {isPending ? "Saving…" : editing ? "Save changes" : "Add template"}
            </Button>
          </div>

          {editing && (
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--line-soft)" }}>
              <ConfirmDelete
                label={editing.label}
                description="Removes this template. Existing running timers aren't affected."
                confirmWord="DELETE"
                buttonLabel="Delete template"
                onConfirm={async () => {
                  await remove(editing.id);
                  back();
                }}
              />
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}

const iconBtn: React.CSSProperties = {
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
};

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
