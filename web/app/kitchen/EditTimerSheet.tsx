"use client";

import { useEffect, useState, useTransition } from "react";
import { Field } from "@/components/ui";
import { Sheet, TextInput, Button, Toggle } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { createTimerTemplate, type TimerColor } from "./actions";

const TIMER_COLORS: Record<TimerColor, { ring: string }> = {
  caramel: { ring: "var(--caramel)" },
  rose: { ring: "var(--rose)" },
  sage: { ring: "var(--sage)" },
  plum: { ring: "var(--plum)" },
};

export type TimerLike = {
  id: string;
  label: string;
  color: TimerColor;
  totalMs: number;
};

export function EditTimerSheet({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: TimerLike | null;
  onClose: () => void;
  onSave: (patch: { label: string; color: TimerColor; totalMs: number }) => void;
}) {
  const [label, setLabel] = useState("");
  const [minutes, setMinutes] = useState("");
  const [color, setColor] = useState<TimerColor>("caramel");
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!initial) return;
    setLabel(initial.label);
    setMinutes(String(Math.round((initial.totalMs / 60000) * 100) / 100));
    setColor(initial.color);
    setSaveAsTemplate(false);
    setTemplateError(null);
  }, [initial]);

  function submit() {
    if (!initial) return;
    const mins = parseFloat(minutes);
    if (!isFinite(mins) || mins <= 0) return;
    const totalMs = Math.round(mins * 60 * 1000);
    onSave({ label: label.trim() || initial.label, color, totalMs });

    if (saveAsTemplate) {
      startTransition(async () => {
        try {
          await createTimerTemplate({
            label: label.trim() || initial.label,
            duration_ms: totalMs,
            color,
          });
        } catch (e) {
          setTemplateError(e instanceof Error ? e.message : String(e));
          return;
        }
        onClose();
      });
    } else {
      onClose();
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Edit timer">
      <div style={{ padding: "4px 0 24px" }}>
        <Field label="Label">
          <TextInput value={label} onChange={(e) => setLabel(e.target.value)} autoFocus />
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
                  background: TIMER_COLORS[k].ring,
                  cursor: "pointer",
                  boxShadow:
                    color === k
                      ? "0 0 0 3px var(--bg), 0 0 0 5px " + TIMER_COLORS[k].ring
                      : "none",
                }}
              />
            ))}
          </div>
        </Field>

        <Field label="Save as template" optional>
          <Toggle
            checked={saveAsTemplate}
            onChange={setSaveAsTemplate}
            label={saveAsTemplate ? "Yes — keep as a preset" : "No — just this timer"}
          />
        </Field>

        {templateError && (
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
            {templateError}
          </div>
        )}

        <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
          <Button variant="secondary" size="lg" full onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="lg"
            full
            onClick={submit}
            disabled={isPending}
            icon={<Icon.Check size={16} />}
          >
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
