"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { fmtDate } from "@/lib/format";
import { EditEventSheet } from "./EditEventSheet";
import { EVENT_KINDS, type EventKind } from "./kinds";
import type { CalendarEntry } from "./page";

const KIND_DOT: Record<CalendarEntry["kind"], string> = {
  event: "var(--sage)",
  festival: "var(--caramel)",
  milestone: "var(--plum)",
  marketing: "var(--rose)",
  personal: "oklch(0.55 0.10 240)",
  reminder: "oklch(0.55 0.12 60)",
  order: "var(--ink-soft)",
  compliance: "var(--danger)",
  "festival-block": "var(--caramel)",
};

const KIND_LABEL: Record<CalendarEntry["kind"], string> = {
  event: "Event",
  festival: "Festival",
  milestone: "Milestone",
  marketing: "Marketing",
  personal: "Personal",
  reminder: "Reminder",
  order: "Order",
  compliance: "Compliance",
  "festival-block": "Festival/block",
};

const FILTER_OPTIONS: Array<{ v: string; label: string }> = [
  { v: "all", label: "All" },
  { v: "event", label: "Events" },
  { v: "festival", label: "Festivals" },
  { v: "milestone", label: "Milestones" },
  { v: "marketing", label: "Marketing" },
  { v: "personal", label: "Personal" },
  { v: "reminder", label: "Reminders" },
  { v: "order", label: "Orders" },
  { v: "compliance", label: "Compliance" },
];

const DOW = ["S", "M", "T", "W", "T", "F", "S"];

export function CalendarView({
  month,
  today,
  entries,
  initialKind,
  initialSort,
  initialQuery,
}: {
  month: string;
  today: string;
  entries: CalendarEntry[];
  initialKind: string;
  initialSort: "asc" | "desc";
  initialQuery: string;
}) {
  const [view, setView] = useState<"month" | "list">("month");
  const [kind, setKind] = useState(initialKind);
  const [sort, setSort] = useState<"asc" | "desc">(initialSort);
  const [query, setQuery] = useState(initialQuery);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editing, setEditing] = useState<CalendarEntry | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = entries;
    if (kind !== "all") rows = rows.filter((e) => e.kind === kind);
    if (q) {
      rows = rows.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.meta ?? "").toLowerCase().includes(q) ||
          (e.notes ?? "").toLowerCase().includes(q),
      );
    }
    return [...rows].sort((a, b) => (sort === "asc" ? 1 : -1) * a.date.localeCompare(b.date));
  }, [entries, kind, sort, query]);

  const byDate = useMemo(() => {
    const m = new Map<string, CalendarEntry[]>();
    for (const e of filtered) {
      const arr = m.get(e.date) ?? [];
      arr.push(e);
      m.set(e.date, arr);
    }
    return m;
  }, [filtered]);

  const days = monthGrid(month);
  const monthIso = month + "-01";

  // Default the agenda-list expanded day to "today" if within view, else first.
  const focusDate =
    selectedDate ??
    (days.find((d) => d.iso === today)?.iso ??
      days.find((d) => d.inMonth)?.iso ??
      days[0]?.iso ??
      today);

  const prevMonth = shiftMonth(month, -1);
  const nextMonth = shiftMonth(month, 1);

  return (
    <div style={{ padding: "10px 18px 14px", overflowY: "auto", flex: 1, minHeight: 0 }}>
      {/* Month nav + view toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <Link href={`/calendar?month=${prevMonth}`} style={chevBtn} aria-label="Previous month">
          <Icon.ChevronLeft size={16} />
        </Link>
        <div style={{ flex: 1, fontFamily: "DM Serif Display, serif", fontSize: 17, textAlign: "center" }}>
          {new Intl.DateTimeFormat("en-IN", {
            timeZone: "Asia/Kolkata",
            month: "long",
            year: "numeric",
          }).format(new Date(monthIso))}
        </div>
        <Link href={`/calendar?month=${nextMonth}`} style={chevBtn} aria-label="Next month">
          <Icon.Chevron size={16} />
        </Link>
        <button
          type="button"
          onClick={() => setView((v) => (v === "month" ? "list" : "month"))}
          style={{
            ...chevBtn,
            width: "auto",
            padding: "0 10px",
            background: "var(--surface)",
            border: "1px solid var(--line)",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--ink-soft)",
          }}
        >
          {view === "month" ? "Agenda" : "Month"}
        </button>
      </div>

      {/* Filter / Sort / Search */}
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Icon.Search
            size={14}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--muted)",
            }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title or notes"
            style={searchInput}
          />
        </div>
        <button
          type="button"
          onClick={() => setSort((s) => (s === "asc" ? "desc" : "asc"))}
          title={`Sort ${sort === "asc" ? "ascending" : "descending"}`}
          style={{
            ...chevBtn,
            width: "auto",
            padding: "0 10px",
            background: "var(--surface)",
            border: "1px solid var(--line)",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {sort === "asc" ? "↑" : "↓"}
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          padding: "0 0 8px",
          scrollbarWidth: "none",
        }}
      >
        {FILTER_OPTIONS.map((f) => {
          const active = kind === f.v;
          return (
            <button
              key={f.v}
              type="button"
              onClick={() => setKind(f.v)}
              style={{
                flexShrink: 0,
                padding: "5px 10px",
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 999,
                border: "1.5px solid " + (active ? "var(--caramel)" : "var(--line)"),
                background: active ? "var(--caramel)" : "var(--surface)",
                color: active ? "var(--surface)" : "var(--ink-soft)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {view === "month" ? (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 4,
              fontSize: 10.5,
              color: "var(--muted)",
              marginBottom: 4,
              padding: "0 2px",
            }}
          >
            {DOW.map((d, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                {d}
              </div>
            ))}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 4,
            }}
          >
            {days.map((d) => {
              const list = byDate.get(d.iso) ?? [];
              const isToday = d.iso === today;
              const isFocus = d.iso === focusDate;
              const colors = list
                .slice(0, 3)
                .map((e) => KIND_DOT[e.kind]);
              return (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => setSelectedDate(d.iso)}
                  style={{
                    aspectRatio: "1",
                    padding: 4,
                    borderRadius: 8,
                    border:
                      "1.5px solid " +
                      (isFocus
                        ? "var(--caramel)"
                        : isToday
                          ? "var(--caramel-deep)"
                          : "transparent"),
                    background: d.inMonth ? "var(--surface)" : "transparent",
                    color: d.inMonth ? "var(--ink)" : "var(--muted)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: isToday ? 700 : 500 }}>
                    {Number(d.iso.slice(8))}
                  </span>
                  <span
                    style={{
                      display: "flex",
                      gap: 2,
                      marginTop: 2,
                      flexWrap: "wrap",
                      justifyContent: "center",
                    }}
                  >
                    {colors.map((c, i) => (
                      <span
                        key={i}
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: 999,
                          background: c,
                        }}
                      />
                    ))}
                    {list.length > 3 && (
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: 999,
                          background: "var(--muted)",
                        }}
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Focused-day agenda */}
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                margin: "0 4px 6px",
              }}
            >
              <h3
                style={{
                  fontFamily: "DM Serif Display, serif",
                  fontSize: 15,
                  fontWeight: 400,
                  margin: 0,
                  letterSpacing: "0.005em",
                  textTransform: "uppercase",
                  opacity: 0.7,
                }}
              >
                {fmtDate(focusDate, { showYear: true })}
              </h3>
              <span style={{ fontSize: 11.5, color: "var(--muted)" }}>
                {(byDate.get(focusDate) ?? []).length} entries
              </span>
            </div>
            <Card padding={0}>
              {(byDate.get(focusDate) ?? []).length === 0 ? (
                <div style={{ padding: 16, color: "var(--muted)", fontSize: 12.5, textAlign: "center" }}>
                  Nothing scheduled.
                </div>
              ) : (
                (byDate.get(focusDate) ?? []).map((e, i, arr) => (
                  <EntryRow
                    key={e.id}
                    entry={e}
                    last={i === arr.length - 1}
                    onEdit={(x) => setEditing(x)}
                  />
                ))
              )}
            </Card>
          </div>
        </>
      ) : (
        <Card padding={0}>
          {filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
              No entries match.
            </div>
          ) : (
            filtered.map((e, i, arr) => (
              <EntryRow
                key={e.id}
                entry={e}
                last={i === arr.length - 1}
                showDate
                onEdit={(x) => setEditing(x)}
              />
            ))
          )}
        </Card>
      )}

      <EditEventSheet
        open={editing != null}
        entry={editing && editing.editable ? editing : null}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}

function EntryRow({
  entry,
  last,
  showDate,
  onEdit,
}: {
  entry: CalendarEntry;
  last: boolean;
  showDate?: boolean;
  onEdit: (e: CalendarEntry) => void;
}) {
  const body = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 14px",
        borderBottom: last ? "none" : "1px solid var(--line-soft)",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: KIND_DOT[entry.kind],
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25 }}>
          {entry.title}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
          {showDate ? fmtDate(entry.date, { showYear: true }) : KIND_LABEL[entry.kind]}
          {entry.meta ? ` · ${entry.meta}` : ""}
          {entry.endDate && entry.endDate !== entry.date
            ? ` → ${fmtDate(entry.endDate, { showYear: true })}`
            : ""}
        </div>
      </div>
      {entry.editable && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit(entry);
          }}
          aria-label="Edit"
          style={{
            width: 26,
            height: 26,
            borderRadius: 999,
            background: "var(--surface-3)",
            color: "var(--ink-soft)",
            border: "none",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon.Edit size={12} />
        </button>
      )}
      {entry.ref && (
        <Icon.Chevron size={14} style={{ color: "var(--muted)", flexShrink: 0 }} />
      )}
    </div>
  );

  if (entry.ref) {
    return (
      <Link
        href={entry.ref.href}
        style={{ display: "block", textDecoration: "none", color: "inherit" }}
      >
        {body}
      </Link>
    );
  }
  return body;
}

// Returns 6 rows × 7 columns covering the month, with prev/next-month gutter days
function monthGrid(month: string): Array<{ iso: string; inMonth: boolean }> {
  const firstOfMonth = new Date(month + "-01");
  const start = new Date(firstOfMonth);
  start.setDate(1 - start.getDay()); // back up to Sunday
  const cells: Array<{ iso: string; inMonth: boolean }> = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push({
      iso: d.toISOString().slice(0, 10),
      inMonth: d.getMonth() === firstOfMonth.getMonth(),
    });
  }
  return cells;
}

function shiftMonth(monthIso: string, delta: number): string {
  const d = new Date(monthIso + "-01");
  d.setMonth(d.getMonth() + delta);
  return d.toISOString().slice(0, 7);
}

const chevBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 30,
  height: 30,
  borderRadius: 8,
  background: "var(--surface-3)",
  color: "var(--ink-soft)",
  border: "none",
  cursor: "pointer",
  textDecoration: "none",
  flexShrink: 0,
};

const searchInput: React.CSSProperties = {
  width: "100%",
  fontFamily: "inherit",
  fontSize: 13,
  padding: "8px 12px 8px 30px",
  borderRadius: "var(--r)",
  border: "1px solid var(--line)",
  background: "var(--surface)",
  outline: "none",
  boxSizing: "border-box",
};

// Make this available for callers if they want to render kind chips
export { EVENT_KINDS, KIND_LABEL };
export type { EventKind };
