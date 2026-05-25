"use client";

import { useEffect, useState, useTransition } from "react";
import { Field } from "@/components/ui";
import { Sheet, TextInput, Button, Toggle } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { deleteCalendarEvent, updateCalendarEvent } from "./actions";
import { EVENT_KINDS, type EventKind } from "./kinds";
import type { CalendarEntry } from "./page";

const KIND_LABEL: Record<EventKind, string> = {
  event: "Event",
  festival: "Festival",
  milestone: "Milestone",
  marketing: "Marketing",
  personal: "Personal",
  reminder: "Reminder",
};

export function EditEventSheet({
  open,
  entry,
  onClose,
}: {
  open: boolean;
  entry: CalendarEntry | null;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [kind, setKind] = useState<EventKind>("event");
  const [notes, setNotes] = useState("");
  const [allDay, setAllDay] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!entry) return;
    setTitle(entry.title);
    setDate(entry.date);
    setEndDate(entry.endDate ?? "");
    setKind((entry.kind as EventKind) ?? "event");
    setNotes(entry.notes ?? "");
    setAllDay(true);
    setError(null);
  }, [entry]);

  if (!entry) return null;

  function submit() {
    if (!entry) return;
    setError(null);
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    startTransition(async () => {
      try {
        await updateCalendarEvent(entry.id, {
          title,
          date,
          end_date: endDate,
          kind,
          notes,
          all_day: allDay,
        });
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <Sheet open={open} onClose={onClose} title="Edit event">
      <div style={{ paddingBottom: 24 }}>
        <Field label="Title">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
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

        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <Button variant="secondary" size="lg" full onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="lg" full onClick={submit} disabled={isPending}>
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>

        <div style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 14 }}>
          <ConfirmDelete
            label={entry.title}
            description="Removes this event permanently."
            confirmWord="DELETE"
            buttonLabel="Delete event"
            onConfirm={async () => {
              await deleteCalendarEvent(entry.id);
              onClose();
            }}
          />
        </div>
      </div>
    </Sheet>
  );
}
