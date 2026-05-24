// Order status colour / label helpers — ported from app/src/data.jsx.

export type OrderStatus =
  | "delivered"
  | "ready"
  | "in-production"
  | "confirmed"
  | "draft"
  | string;

export const statusColor = (status: OrderStatus) => {
  switch (status) {
    case "delivered":
      return { bg: "var(--sage-soft)", fg: "oklch(0.34 0.07 145)", dot: "var(--ok)" };
    case "ready":
      return { bg: "oklch(0.93 0.05 180)", fg: "oklch(0.32 0.07 200)", dot: "oklch(0.55 0.10 200)" };
    case "in-production":
      return { bg: "var(--caramel-soft)", fg: "var(--caramel-deep)", dot: "var(--caramel)" };
    case "confirmed":
      return { bg: "var(--rose-soft)", fg: "oklch(0.38 0.10 25)", dot: "var(--rose)" };
    case "draft":
      return { bg: "oklch(0.94 0.005 70)", fg: "var(--muted)", dot: "var(--muted)" };
    default:
      return { bg: "oklch(0.94 0.005 70)", fg: "var(--muted)", dot: "var(--muted)" };
  }
};

export const statusLabel = (s: OrderStatus): string =>
  ({
    delivered: "Delivered",
    ready: "Ready to ship",
    "in-production": "Baking",
    confirmed: "Confirmed",
    draft: "Draft",
  } as Record<string, string>)[s] || s;
