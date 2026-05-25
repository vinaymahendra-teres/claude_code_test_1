"use client";

import Link from "next/link";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { Card, Field, SectionHeader } from "@/components/ui";
import { Button, IconButton, TextInput, Sheet } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { EditTimerSheet } from "./EditTimerSheet";
import { TemplatesSheet } from "./TemplatesSheet";

const TIMERS_KEY = "tieredcake-timers";
const SOUND_KEY = "tieredcake-timers-sound";

type TimerColor = "caramel" | "rose" | "sage" | "plum";

const TIMER_COLORS: Record<TimerColor, { ring: string; soft: string; deep: string }> = {
  caramel: { ring: "var(--caramel)", soft: "var(--caramel-soft)", deep: "var(--caramel-deep)" },
  rose: { ring: "var(--rose)", soft: "var(--rose-soft)", deep: "oklch(0.38 0.10 25)" },
  sage: { ring: "var(--sage)", soft: "var(--sage-soft)", deep: "oklch(0.34 0.07 145)" },
  plum: { ring: "var(--plum)", soft: "oklch(0.93 0.04 340)", deep: "oklch(0.32 0.10 340)" },
};

type TimerStatus = "running" | "paused" | "done";

type Timer = {
  id: string;
  label: string;
  color: TimerColor;
  totalMs: number;
  status: TimerStatus;
  startedAt: number;
  elapsedBeforePause: number;
  doneAt?: number | null;
  createdAt: number;
};

type DecoratedTimer = Timer & { remainingMs: number };

function fmtTimerTime(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function computeRemaining(t: Timer, now: number): number {
  if (t.status === "done") return 0;
  if (t.status === "paused") return Math.max(0, t.totalMs - t.elapsedBeforePause);
  const runElapsed = now - t.startedAt;
  return Math.max(0, t.totalMs - t.elapsedBeforePause - runElapsed);
}

let _audioCtx: AudioContext | null = null;
function chime() {
  if (typeof window === "undefined") return;
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!_audioCtx) _audioCtx = new Ctor();
    const ctx = _audioCtx;
    const now = ctx.currentTime;
    [880, 660].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gain).connect(ctx.destination);
      const t = now + i * 0.18;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  } catch {
    /* audio may be blocked until user gesture */
  }
}

function useTimers() {
  const [timers, setTimers] = useState<Timer[]>([]);
  const [, force] = useReducer((x: number) => x + 1, 0);
  const [soundOn, setSoundOn] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TIMERS_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setTimers(arr as Timer[]);
      }
      const v = localStorage.getItem(SOUND_KEY);
      if (v != null) setSoundOn(v === "1");
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(TIMERS_KEY, JSON.stringify(timers));
    } catch {
      /* ignore */
    }
  }, [timers, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(SOUND_KEY, soundOn ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [soundOn, hydrated]);

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      setTimers((prev) => {
        let mutated = false;
        const next = prev.map((t) => {
          if (t.status !== "running") return t;
          const remaining = computeRemaining(t, now);
          if (remaining <= 0) {
            mutated = true;
            if (!firedRef.current.has(t.id)) {
              firedRef.current.add(t.id);
              if (soundOn) chime();
            }
            return { ...t, status: "done" as const, doneAt: now };
          }
          return t;
        });
        return mutated ? next : prev;
      });
      force();
    }, 250);
    return () => clearInterval(id);
  }, [soundOn]);

  const start = useCallback(
    (opts: { label?: string; durationMs: number; color?: TimerColor }) => {
      const id = "t" + Date.now() + Math.random().toString(36).slice(2, 6);
      const t: Timer = {
        id,
        label: opts.label || "Timer",
        color: opts.color || "caramel",
        totalMs: opts.durationMs,
        status: "running",
        startedAt: Date.now(),
        elapsedBeforePause: 0,
        createdAt: Date.now(),
      };
      setTimers((prev) => [...prev, t]);
      return id;
    },
    [],
  );

  const pause = useCallback((id: string) => {
    setTimers((prev) =>
      prev.map((t) => {
        if (t.id !== id || t.status !== "running") return t;
        const elapsed = Date.now() - t.startedAt;
        return { ...t, status: "paused", elapsedBeforePause: t.elapsedBeforePause + elapsed };
      }),
    );
  }, []);

  const resume = useCallback((id: string) => {
    setTimers((prev) =>
      prev.map((t) => {
        if (t.id !== id || t.status !== "paused") return t;
        return { ...t, status: "running", startedAt: Date.now() };
      }),
    );
  }, []);

  const addMs = useCallback((id: string, ms: number) => {
    setTimers((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        if (t.status === "done") {
          firedRef.current.delete(t.id);
          return {
            ...t,
            status: "running",
            totalMs: ms,
            elapsedBeforePause: 0,
            startedAt: Date.now(),
            doneAt: null,
          };
        }
        return { ...t, totalMs: t.totalMs + ms };
      }),
    );
  }, []);

  const dismiss = useCallback((id: string) => {
    firedRef.current.delete(id);
    setTimers((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Edit an existing timer's label / color / total duration. If the new
  // duration is shorter than the time already elapsed the timer flips to
  // "done"; otherwise we reset elapsedBeforePause to keep the math sane.
  const updateTimer = useCallback(
    (
      id: string,
      patch: { label?: string; color?: TimerColor; totalMs?: number },
    ) => {
      firedRef.current.delete(id);
      setTimers((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          const next = { ...t };
          if (patch.label !== undefined) next.label = patch.label;
          if (patch.color !== undefined) next.color = patch.color;
          if (patch.totalMs !== undefined && patch.totalMs > 0) {
            next.totalMs = patch.totalMs;
            // Re-arm so the new duration is the remaining time, regardless of
            // prior status.
            next.startedAt = Date.now();
            next.elapsedBeforePause = 0;
            next.doneAt = null;
            next.status = "running";
          }
          return next;
        }),
      );
    },
    [],
  );

  const muteToggle = useCallback(() => setSoundOn((v) => !v), []);

  const now = Date.now();
  const decorated: DecoratedTimer[] = timers.map((t) => ({
    ...t,
    remainingMs: computeRemaining(t, now),
  }));

  return {
    timers: decorated,
    running: decorated.filter((t) => t.status === "running"),
    paused: decorated.filter((t) => t.status === "paused"),
    done: decorated.filter((t) => t.status === "done"),
    soundOn,
    muteToggle,
    start,
    pause,
    resume,
    addMs,
    dismiss,
    updateTimer,
  };
}

function TimerRing({
  progress,
  color = "caramel",
  size = 56,
  stroke = 4,
  children,
}: {
  progress: number;
  color?: TimerColor;
  size?: number;
  stroke?: number;
  children: React.ReactNode;
}) {
  const c = TIMER_COLORS[color];
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.max(0, Math.min(1, progress));
  return (
    <div style={{ width: size, height: size, position: "relative", flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={c.ring}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          style={{ transition: "stroke-dasharray .3s linear" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          fontSize: size >= 56 ? 12 : 10,
          fontWeight: 600,
          color: c.deep,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function TimerCard({
  t,
  onPause,
  onResume,
  onAdd,
  onDismiss,
  onEdit,
}: {
  t: DecoratedTimer;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onAdd: (id: string, ms: number) => void;
  onDismiss: (id: string) => void;
  onEdit: (t: DecoratedTimer) => void;
}) {
  const progress = t.status === "done" ? 1 : 1 - t.remainingMs / t.totalMs;
  const c = TIMER_COLORS[t.color];
  const isDone = t.status === "done";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 12px",
        borderRadius: "var(--r-lg)",
        background: isDone ? c.soft : "var(--surface)",
        border: "1px solid " + (isDone ? c.ring : "var(--line-soft)"),
        animation: isDone ? "pulse 1.4s ease-in-out infinite" : undefined,
      }}
    >
      <TimerRing progress={progress} color={t.color} size={56}>
        {isDone ? "DONE" : fmtTimerTime(t.remainingMs)}
      </TimerRing>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            lineHeight: 1.3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {t.label}
        </div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
          {isDone
            ? "tap +1m to extend or dismiss"
            : t.status === "paused"
              ? "paused"
              : `${fmtTimerTime(t.totalMs)} total`}
        </div>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        <IconButton onClick={() => onEdit(t)} title="Edit">
          <Icon.Edit size={16} />
        </IconButton>
        {isDone ? (
          <>
            <IconButton onClick={() => onAdd(t.id, 60000)} title="+1 min">
              <span style={{ fontSize: 11, fontWeight: 700, color: c.deep }}>+1m</span>
            </IconButton>
            <IconButton onClick={() => onDismiss(t.id)} title="Dismiss">
              <Icon.Check size={18} />
            </IconButton>
          </>
        ) : (
          <>
            <IconButton onClick={() => onAdd(t.id, 60000)} title="+1 min">
              <span style={{ fontSize: 11, fontWeight: 700 }}>+1m</span>
            </IconButton>
            {t.status === "running" ? (
              <IconButton onClick={() => onPause(t.id)} title="Pause">
                <span style={{ display: "inline-flex", gap: 2 }}>
                  <span style={{ width: 3, height: 12, background: "currentColor", borderRadius: 1 }} />
                  <span style={{ width: 3, height: 12, background: "currentColor", borderRadius: 1 }} />
                </span>
              </IconButton>
            ) : (
              <IconButton onClick={() => onResume(t.id)} title="Resume">
                <span
                  style={{
                    width: 0,
                    height: 0,
                    borderTop: "7px solid transparent",
                    borderBottom: "7px solid transparent",
                    borderLeft: "11px solid currentColor",
                  }}
                />
              </IconButton>
            )}
            <IconButton onClick={() => onDismiss(t.id)} title="Stop">
              <Icon.X size={18} />
            </IconButton>
          </>
        )}
      </div>
    </div>
  );
}

const PRESETS: Array<{ label: string; mins: number; color: TimerColor }> = [
  { label: "Preheat", mins: 15, color: "rose" },
  { label: "Bake", mins: 35, color: "caramel" },
  { label: "Cool", mins: 20, color: "sage" },
  { label: "Whip", mins: 5, color: "plum" },
  { label: "Proof", mins: 60, color: "caramel" },
  { label: "Chill", mins: 30, color: "sage" },
];

function NewTimerForm({
  onStart,
  onClose,
}: {
  onStart: (opts: { label: string; durationMs: number; color: TimerColor }) => void;
  onClose: () => void;
}) {
  const [label, setLabel] = useState("");
  const [minutes, setMinutes] = useState("5");
  const [color, setColor] = useState<TimerColor>("caramel");

  function submit() {
    const mins = parseFloat(minutes);
    if (!isFinite(mins) || mins <= 0) return;
    onStart({
      label: label || `${mins}-min timer`,
      durationMs: Math.round(mins * 60 * 1000),
      color,
    });
    onClose();
  }

  return (
    <div style={{ padding: "4px 0 24px" }}>
      <Field label="Label">
        <TextInput
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Belgian Dark — bake"
          autoFocus
        />
      </Field>

      <Field label="Quick presets">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {PRESETS.map((p) => (
            <span
              key={p.label}
              onClick={() => {
                setLabel(label || p.label);
                setMinutes(String(p.mins));
                setColor(p.color);
              }}
              style={{
                padding: "8px 12px",
                border: "1px solid var(--line)",
                background: "var(--surface)",
                borderRadius: 999,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: TIMER_COLORS[p.color].ring,
                }}
              />
              {p.label} · {p.mins}m
            </span>
          ))}
        </div>
      </Field>

      <Field label="Minutes">
        <TextInput
          value={minutes}
          onChange={(e) => setMinutes(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="0"
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

      <div style={{ marginTop: 22, display: "flex", gap: 10 }}>
        <Button variant="secondary" size="lg" full onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" size="lg" full onClick={submit} icon={<Icon.Clock size={16} />}>
          Start
        </Button>
      </div>
    </div>
  );
}

export default function KitchenPage() {
  const timers = useTimers();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<DecoratedTimer | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  return (
    <PhoneShell>
      <div data-screen-label="Kitchen">
        <header style={chromeHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 32 }}>
            <Link href="/" style={chromeBtn} aria-label="Back">
              <Icon.ChevronLeft size={22} />
            </Link>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 21, lineHeight: 1.15 }}>
                Kitchen
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                {timers.running.length} running · {timers.done.length} done · IST
              </div>
            </div>
            <IconButton onClick={() => setTemplatesOpen(true)} title="Templates">
              <Icon.Sparkle size={19} />
            </IconButton>
            <IconButton onClick={timers.muteToggle} title={timers.soundOn ? "Mute" : "Unmute"}>
              {timers.soundOn ? <Icon.Bell size={19} /> : <Icon.BellOff size={19} />}
            </IconButton>
            <IconButton
              onClick={() => setAdding(true)}
              title="New timer"
              style={{ background: "var(--caramel)", color: "var(--surface)", width: 34, height: 34 }}
            >
              <Icon.Plus size={20} />
            </IconButton>
          </div>
        </header>

        <div style={{ padding: "14px 18px 100px", overflowY: "auto", flex: 1, minHeight: 0 }}>
          {timers.timers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "var(--surface-3)",
                  display: "inline-grid",
                  placeItems: "center",
                  color: "var(--caramel)",
                  marginBottom: 14,
                }}
              >
                <Icon.Clock size={32} />
              </div>
              <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 20, color: "var(--ink)" }}>
                No timers yet
              </div>
              <div style={{ fontSize: 13, marginTop: 6 }}>
                Start a timer from a recipe step,
                <br />
                an order, or tap + here.
              </div>
              <Button
                variant="primary"
                size="lg"
                style={{ marginTop: 18 }}
                onClick={() => setAdding(true)}
                icon={<Icon.Plus size={16} />}
              >
                Start a timer
              </Button>
            </div>
          ) : (
            <>
              {timers.done.length > 0 && (
                <>
                  <SectionHeader>Done</SectionHeader>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                    {timers.done.map((t) => (
                      <TimerCard
                        key={t.id}
                        t={t}
                        onPause={timers.pause}
                        onResume={timers.resume}
                        onAdd={timers.addMs}
                        onDismiss={timers.dismiss}
                        onEdit={setEditing}
                      />
                    ))}
                  </div>
                </>
              )}

              {timers.running.length > 0 && (
                <>
                  <SectionHeader>Running</SectionHeader>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                    {timers.running
                      .slice()
                      .sort((a, b) => a.remainingMs - b.remainingMs)
                      .map((t) => (
                        <TimerCard
                          key={t.id}
                          t={t}
                          onPause={timers.pause}
                          onResume={timers.resume}
                          onAdd={timers.addMs}
                          onDismiss={timers.dismiss}
                        onEdit={setEditing}
                        />
                      ))}
                  </div>
                </>
              )}

              {timers.paused.length > 0 && (
                <>
                  <SectionHeader>Paused</SectionHeader>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {timers.paused.map((t) => (
                      <TimerCard
                        key={t.id}
                        t={t}
                        onPause={timers.pause}
                        onResume={timers.resume}
                        onAdd={timers.addMs}
                        onDismiss={timers.dismiss}
                        onEdit={setEditing}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <Sheet open={adding} onClose={() => setAdding(false)} title="New timer">
          <NewTimerForm onStart={timers.start} onClose={() => setAdding(false)} />
        </Sheet>

        <EditTimerSheet
          open={editing != null}
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) => {
            if (!editing) return;
            timers.updateTimer(editing.id, patch);
          }}
        />

        <TemplatesSheet
          open={templatesOpen}
          onClose={() => setTemplatesOpen(false)}
          onStart={timers.start}
        />
      </div>
    </PhoneShell>
  );
}

const chromeHeader: React.CSSProperties = {
  position: "sticky",
  top: 0,
  background: "var(--bg)",
  padding: "54px 18px 14px",
  borderBottom: "1px solid var(--line-soft)",
  zIndex: 5,
};

const chromeBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 36,
  height: 36,
  borderRadius: 999,
  background: "transparent",
  color: "var(--ink)",
  textDecoration: "none",
};
