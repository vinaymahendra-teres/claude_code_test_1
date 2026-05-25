"use client";

import { useState, useTransition } from "react";
import { Field } from "@/components/ui";
import { Sheet, TextInput, Button, Toggle } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { createCalendarEvent } from "./actions";
import { EVENT_KINDS, type EventKind } from "./kinds";

const KIND_LABEL: Record<EventKind, string> = {
  event: "Event",
  festival: "Festival",
  milestone: "Milestone",
  marketing: "Marketing",
  personal: "Personal",
  reminder: "Reminder",
};

export function NewEventButton({ initialDate }: { initialDate: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(initialDate);
  const [endDate, setEndDate] = useState("");
  const [kind, setKind] = useState<EventKind>("event");
  const [notes, setNotes] = useState("");
  const [allDay, setAllDay] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    setTitle("");
    setDate(initialDate);
    setEndDate("");
    setKind("event");
    setNotes("");
    setAllDay(true);
    setError(null);
    setOpen(false);
  }

  function submit() {
    setError(null);
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    startTransition(async () => {
      try {
        await createCalendarEvent({
          title,
          date,
          end_date: endDate,
          kind,
          notes,
          all_day: allDay,
        });
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
        title="Add event"
        aria-label="Add event"
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

      <Sheet open={open} onClose={close} title="Add event">
        <div style={{ paddingBottom: 24 }}>
          <Field label="Title">
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Diwali pop-up · Provincia"
              autoFocus
            />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Field label="Date">
              <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Ends" optional>
              <TextInput type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Field>
          </div>
          <Field label="Type">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {EVENT_KINDS.map((k) => {
                const sel = kind === k;
                return (
                  <span
                    key={k}
                    onClick={() => setKind(k)}
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
                    {KIND_LABEL[k]}
                  </span>
                );
              })}
            </div>
          </Field>
          <Field label="All day">
            <Toggle checked={allDay} onChange={setAllDay} label={allDay ? "Yes" : "No (time-bound)"} />
          </Field>
          <Field label="Notes" optional>
            <TextInput multiline value={notes} onChange={(e) => setNotes(e.target.value)} />
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
            <Button
              variant="primary"
              size="lg"
              full
              onClick={submit}
              disabled={isPending || !title.trim() || !date}
            >
              {isPending ? "Saving…" : "Add event"}
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
