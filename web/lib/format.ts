/**
 * Shared formatters — ported from app/src/data.jsx (window.fmtMoney etc.)
 */

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
