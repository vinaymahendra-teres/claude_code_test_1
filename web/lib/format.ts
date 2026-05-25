/**
 * Shared formatters — ported from app/src/data.jsx (window.fmtMoney etc.)
 *
 * Operators are in Hyderabad and read everything in IST. Any time/date format
 * here that takes a Date or ISO string runs through Asia/Kolkata explicitly so
 * a server in UTC and a phone in any other zone all render the same string.
 */

export const IST = "Asia/Kolkata";

// YYYY-MM-DD in Asia/Kolkata, independent of the server's timezone. Use this
// instead of `new Date().toISOString().slice(0, 10)` (which is UTC).
export function todayIst(): string {
  // en-CA's short-date format is YYYY-MM-DD which is exactly what we want.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function plusDaysIst(iso: string, n: number): string {
  // Treat the YYYY-MM-DD as a local calendar day (noon to dodge DST nuances),
  // shift, and serialise back. Equivalent to "add N calendar days in IST."
  const d = new Date(iso + "T12:00:00+05:30");
  d.setDate(d.getDate() + n);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

// Long date label like "Monday, 25 May" in IST.
export function fmtIstDayLabel(iso?: string | Date | null): string {
  const date = iso ? (typeof iso === "string" ? new Date(iso + "T12:00:00+05:30") : iso) : new Date();
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export const fmtIstTime = (d: Date | string | null | undefined) => {
  if (d == null) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

export const fmtIstDateTime = (d: Date | string | null | undefined) => {
  if (d == null) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

export const fmtMoney = (n: number | null | undefined, decimals = 0) => {
  if (n == null || Number.isNaN(n)) return "—";
  const sign = n < 0 ? "-" : "";
  const v = Math.abs(n);
  return (
    sign +
    "₹" +
    v.toLocaleString("en-IN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );
};

export const fmtCompactMoney = (n: number | null | undefined): string => {
  if (n == null) return "—";
  const abs = Math.abs(n);
  if (abs >= 100000) return (n / 100000).toFixed(abs >= 1000000 ? 0 : 1) + "L";
  if (abs >= 1000) return (n / 1000).toFixed(abs >= 10000 ? 0 : 1) + "k";
  return String(n);
};

export const fmtDate = (iso: string | null | undefined, { showYear = false } = {}) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()} ${months[d.getMonth()]}${showYear ? " " + d.getFullYear() : ""}`;
};

export const fmtRelative = (iso: string | null | undefined) => {
  if (!iso) return "—";
  // Anchor to "today in IST" so the relative copy follows the operator's day.
  const today = new Date(todayIst() + "T12:00:00+05:30");
  const d = new Date(iso.length === 10 ? iso + "T12:00:00+05:30" : iso);
  const days = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days > 1 && days < 7) return `In ${days} days`;
  if (days < -1 && days > -7) return `${-days}d ago`;
  return fmtDate(iso);
};
