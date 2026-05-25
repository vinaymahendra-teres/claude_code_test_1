"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// ---------- Mode definitions ----------

export type ModeId = "planning" | "marketing" | "operations" | "finance";

export type ModeDef = {
  id: ModeId;
  label: string;
  short: string;
  desc: string;
  color: "caramel" | "rose" | "sage" | "plum";
  iconKey: string;
  nav: string[]; // route slugs that appear in bottom nav
  morePrimary: string[]; // route slugs surfaced first in More menu
  home: {
    actions: Array<{ id: string; label: string; icon: string; sheet?: boolean }>;
    sections: string[];
  };
};

export const MODES: Record<ModeId, ModeDef> = {
  planning: {
    id: "planning",
    label: "Planning & setup",
    short: "Planning",
    desc: "Recipes, inventory, conversion tools",
    color: "plum",
    iconKey: "Sparkle",
    nav: ["home", "orders", "recipes", "inventory", "more"],
    morePrimary: ["recipes", "inventory", "shopping", "tools"],
    home: {
      // Planning is build-the-menu, not take-the-work. New Order is not a
      // primary action here — operators in this mode are setting up.
      actions: [
        { id: "recipes", label: "Recipes", icon: "Cake" },
        { id: "tools", label: "Scale", icon: "Sparkle" },
        { id: "inventory", label: "Restock", icon: "Box" },
        { id: "shopping", label: "Shopping", icon: "Receipt" },
      ],
      sections: ["hero", "quickActions", "lowStock", "openLists", "upcomingEvents"],
    },
  },
  marketing: {
    id: "marketing",
    label: "Marketing & CRM",
    short: "Marketing",
    desc: "Customers, campaigns, inbox",
    color: "rose",
    iconKey: "Megaphone",
    nav: ["home", "orders", "customers", "marketing", "more"],
    morePrimary: ["marketing", "customers", "reviews"],
    home: {
      actions: [
        { id: "orders/new", label: "New order", icon: "Plus" },
        { id: "marketing", label: "Campaign", icon: "Megaphone" },
        { id: "reviews", label: "Reviews", icon: "Mail" },
        { id: "customers", label: "People", icon: "Users" },
      ],
      sections: ["hero", "quickActions", "campaigns", "leads", "reviewsDue", "upcomingEvents"],
    },
  },
  operations: {
    id: "operations",
    label: "Operations",
    short: "Operations",
    desc: "Schedule, kitchen, timers",
    color: "caramel",
    iconKey: "Clock",
    nav: ["home", "orders", "bakes", "tools", "more"],
    morePrimary: ["tools", "bakes", "recipes", "inventory", "shopping"],
    home: {
      actions: [
        { id: "orders/new", label: "New order", icon: "Plus" },
        { id: "tools", label: "Tools", icon: "Sparkle" },
        { id: "bakes", label: "Plan week", icon: "Calendar" },
        { id: "inventory", label: "Stock", icon: "Box" },
      ],
      sections: ["hero", "quickActions", "today", "tomorrow", "lowStock"],
    },
  },
  finance: {
    id: "finance",
    label: "Finance & accounting",
    short: "Finance",
    desc: "Books, P&L, balance sheet, cash flow",
    color: "sage",
    iconKey: "Wallet",
    nav: ["home", "orders", "books", "reports", "more"],
    morePrimary: ["books", "reports"],
    home: {
      // Finance closes books, doesn't open tickets. Expense entry, reports
      // and compliance dominate; no New Order tile.
      actions: [
        { id: "books?tab=transactions", label: "Expense", icon: "Wallet" },
        { id: "reports", label: "Reports", icon: "Doc" },
        { id: "books", label: "Books", icon: "Receipt" },
        { id: "books?tab=tax", label: "Tax", icon: "Doc" },
      ],
      sections: ["hero", "quickActions", "complianceDue", "monthlySnapshot", "outstanding"],
    },
  },
};

export const MODE_ORDER: ModeId[] = ["planning", "marketing", "operations", "finance"];

// ---------- Tweaks ----------

export type Tweaks = {
  palette: "caramel" | "rose" | "sage" | "plum";
  density: "cozy" | "compact";
  darkMode: boolean;
  showBalances: boolean;
};

const DEFAULT_TWEAKS: Tweaks = {
  palette: "caramel",
  density: "cozy",
  darkMode: false,
  showBalances: true,
};

const DEFAULT_MODE: ModeId = "operations";

const MODE_KEY = "tieredcake-mode";
const TWEAKS_KEY = "tieredcake-tweaks";

// ---------- Context ----------

export type AppBranch = {
  id: string;
  label: string;
  community: string | null;
  neighbourhood: string | null;
};

type AppShellState = {
  mode: ModeId;
  modeDef: ModeDef;
  setMode: (id: ModeId) => void;
  tweaks: Tweaks;
  setTweak: <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => void;
  isAdmin: boolean;
  branches: AppBranch[];
  activeBranchId: string | null;
};

const AppShellContext = createContext<AppShellState | null>(null);

export function useAppShell(): AppShellState {
  const ctx = useContext(AppShellContext);
  if (!ctx) {
    // SSR-safe fallback: returns defaults so server-rendered pages don't crash
    // before hydration. The real provider takes over on the client.
    return {
      mode: DEFAULT_MODE,
      modeDef: MODES[DEFAULT_MODE],
      setMode: () => {},
      tweaks: DEFAULT_TWEAKS,
      setTweak: () => {},
      isAdmin: false,
      branches: [],
      activeBranchId: null,
    };
  }
  return ctx;
}

// ---------- Palette + dark-mode application ----------

const PALETTES = {
  caramel: { primary: "oklch(0.58 0.13 55)", deep: "oklch(0.43 0.13 50)", soft: "oklch(0.93 0.045 70)" },
  rose: { primary: "oklch(0.58 0.13 25)", deep: "oklch(0.42 0.13 22)", soft: "oklch(0.93 0.04 25)" },
  sage: { primary: "oklch(0.52 0.10 145)", deep: "oklch(0.38 0.09 145)", soft: "oklch(0.93 0.04 145)" },
  plum: { primary: "oklch(0.50 0.12 340)", deep: "oklch(0.35 0.10 340)", soft: "oklch(0.93 0.04 340)" },
};

function applyTweaks(t: Tweaks) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const p = PALETTES[t.palette];
  root.style.setProperty("--caramel", p.primary);
  root.style.setProperty("--caramel-deep", p.deep);
  root.style.setProperty("--caramel-soft", p.soft);

  if (t.darkMode) {
    root.style.setProperty("--bg", "oklch(0.18 0.012 50)");
    root.style.setProperty("--bg-deep", "oklch(0.14 0.010 50)");
    root.style.setProperty("--surface", "oklch(0.22 0.013 50)");
    root.style.setProperty("--surface-2", "oklch(0.25 0.014 50)");
    root.style.setProperty("--surface-3", "oklch(0.28 0.014 50)");
    root.style.setProperty("--ink", "oklch(0.95 0.015 70)");
    root.style.setProperty("--ink-soft", "oklch(0.80 0.015 70)");
    root.style.setProperty("--muted", "oklch(0.62 0.014 60)");
    root.style.setProperty("--line", "oklch(0.33 0.014 55)");
    root.style.setProperty("--line-soft", "oklch(0.30 0.013 55)");
  } else {
    root.style.removeProperty("--bg");
    root.style.removeProperty("--bg-deep");
    root.style.removeProperty("--surface");
    root.style.removeProperty("--surface-2");
    root.style.removeProperty("--surface-3");
    root.style.removeProperty("--ink");
    root.style.removeProperty("--ink-soft");
    root.style.removeProperty("--muted");
    root.style.removeProperty("--line");
    root.style.removeProperty("--line-soft");
  }
}

// ---------- Provider ----------

export function AppShell({
  children,
  isAdmin = false,
  branches = [],
  activeBranchId = null,
}: {
  children: ReactNode;
  isAdmin?: boolean;
  branches?: AppBranch[];
  activeBranchId?: string | null;
}) {
  const [mode, setModeState] = useState<ModeId>(DEFAULT_MODE);
  const [tweaks, setTweaksState] = useState<Tweaks>(DEFAULT_TWEAKS);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const m = localStorage.getItem(MODE_KEY);
      if (m && m in MODES) setModeState(m as ModeId);
      const t = localStorage.getItem(TWEAKS_KEY);
      if (t) {
        const parsed = JSON.parse(t);
        setTweaksState((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  // Apply tweaks to root whenever they change
  useEffect(() => {
    applyTweaks(tweaks);
  }, [tweaks]);

  // Persist
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, [mode, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(TWEAKS_KEY, JSON.stringify(tweaks));
    } catch {
      /* ignore */
    }
  }, [tweaks, hydrated]);

  const setMode = useCallback((id: ModeId) => setModeState(id), []);
  const setTweak = useCallback(
    <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => {
      setTweaksState((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  return (
    <AppShellContext.Provider
      value={{
        mode,
        modeDef: MODES[mode],
        setMode,
        tweaks,
        setTweak,
        isAdmin,
        branches,
        activeBranchId,
      }}
    >
      {children}
    </AppShellContext.Provider>
  );
}
