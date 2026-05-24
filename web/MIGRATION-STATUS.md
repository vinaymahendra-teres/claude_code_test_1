# Migration status — prototype → Next.js

The original prototype at [`../app/`](../app/) is ~6,000 lines of Babel-in-browser JSX using `window.*` globals. This Next.js project is the production-shaped version. **Home is migrated as the proof-of-pattern. The rest is queued.**

## What's migrated ✅

| Layer | Source (prototype) | Target (here) |
|------|---------------------|---------------|
| Schema | `app/data/*.json` | `supabase/migrations/0001_initial_schema.sql` (applied + seeded with ~100 rows) |
| Seed | inline data block | `scripts/seed.ts` (reads from `../app/data/*.json`) |
| Design tokens | inline `<style>` in `index.html` | `app/globals.css` |
| Layout shell | desktop frame + phone mockup | `app/layout.tsx` + `components/PhoneShell.tsx` (reusable, takes left/right panel overrides) |
| Status helpers | `window.statusColor` / `window.statusLabel` | `lib/status.ts` |
| Money / date formatters | `app/src/data.jsx` (`window.fmtMoney` etc.) | `lib/format.ts` |
| Icon set | `app/src/icons.jsx` (`window.Icon`) | `components/Icon.tsx` — 40+ icons, TSX |
| UI primitives (server-safe) | `app/src/ui.jsx` | `components/ui.tsx` — Card, Pill, StatusPill, Avatar, CakeArt, Field, SectionHeader, StatTile |
| UI primitives (interactive) | same | `components/ui-client.tsx` — Button, IconButton, ListRow, TextInput, SegmentedControl, Toggle, Sheet |
| Home (KPIs) | `app/src/screens/Home.jsx` | `app/page.tsx` — Server Component, live Supabase queries for week revenue, pending balance, today's bakes, tomorrow, low stock |
| Orders list | `app/src/screens/Orders.jsx` | `app/orders/page.tsx` — Server Component, tab via search params, grouped by delivery date |
| Order detail | same | `app/orders/[id]/page.tsx` — Server Component, joins customer + recipe, shows status tracker / theme / delivery / payment with UTR + cold-chain |

## What's queued 🟡

The remaining prototype screens haven't been ported. Each is a focused migration job:

| Prototype source | Target | Notes |
|------------------|--------|-------|
| `NewOrder.jsx` | `app/orders/new/page.tsx` | Six-step flow. Capacity guardrail + festival blocks become SQL joins to `orders` + `blocked_dates`. |
| `Customers.jsx` | `app/customers/page.tsx` + `app/customers/[id]/page.tsx` | DPDP consent toggle becomes a Server Action that updates `customers.marketing_consent`. |
| `Production.jsx` | `app/bakes/page.tsx` | Week schedule + oven plan. |
| `Recipes.jsx` | `app/recipes/page.tsx` + `app/recipes/[id]/page.tsx` | Method steps + tap-to-start timer. |
| `Inventory.jsx` | `app/inventory/page.tsx` | Plus the Draft POs sheet. Wire `low_stock_items` as a SQL view. |
| `Marketing.jsx` | `app/marketing/page.tsx` | Campaigns + templates. |
| `Accounting.jsx` | `app/books/page.tsx` | Three-tab Books view (Overview / Transactions / Tax) + Add Expense Server Action. |
| `Reports.jsx` | `app/reports/page.tsx` | P&L by category / Balance Sheet / Cash Flow. Mostly compute-from-queries — straightforward Server Component. |
| `Reviews.jsx` | `app/reviews/page.tsx` | Queue + Mark/Ask actions. |
| `Kitchen.jsx` (timers) | `app/kitchen/page.tsx` + `components/timers/*` | Client Component. Persistence to localStorage stays; chime stays via Web Audio. |
| `Tools.jsx` (conversions) | `app/tools/page.tsx` | Pure-client, no Supabase. |

## UI primitives to extract

Living as `window.X` in `app/src/ui.jsx` and `app/src/icons.jsx`. Each needs a TSX home:

- `components/ui/Card.tsx`
- `components/ui/Button.tsx` + `IconButton.tsx`
- `components/ui/ListRow.tsx`
- `components/ui/Sheet.tsx`
- `components/ui/Pill.tsx`
- `components/ui/SegmentedControl.tsx`
- `components/ui/Avatar.tsx`
- `components/ui/TextInput.tsx` + `Field.tsx`
- `components/ui/Toggle.tsx`
- `components/ui/StatTile.tsx`
- `components/ui/StatusPill.tsx`
- `components/ui/Sparkline.tsx` + `Bars.tsx`
- `components/ui/CakeArt.tsx`
- `components/Icon.tsx` (one component, named-export each glyph)

## Context-shaped pieces

| Prototype | Target |
|-----------|--------|
| `window.useTimers` (timers.jsx) | `components/timers/TimersContext.tsx` — `"use client"` provider, mounted in root layout |
| Mode catalog + `window.MODES` | `lib/modes.ts` (data) + `components/ModeContext.tsx` (state) |
| `tweaks` (palette/density/dark mode) | `components/TweaksContext.tsx` + cookie-backed persistence |

## Recommended migration order

1. **UI primitives + Icon** — every screen needs them, so port these first as a TSX bundle.
2. **Orders list + Order detail** — highest-value screens; lots of patterns are shared with Inventory and Customers.
3. **Customers + Reviews + Marketing** — CRM/marketing slice.
4. **Books + Reports** — finance slice.
5. **NewOrder + Bakes + Kitchen + Tools** — operations slice (NewOrder is the most complex single migration).

## Open architectural questions

- **Auth**: not wired yet. Add magic-link login gated to founders' emails before the app goes public. Until then, it's anonymous read-only — fine for the schema → seed → display loop.
- **Server Actions vs API routes**: prefer Server Actions for inline mutations (e.g., DPDP consent toggle). API routes only for non-form mutations or cross-origin webhooks.
- **Mutable state currently in localStorage** (tweaks, mode, timers): keep there for now. Migrate to Supabase only when a user has an account.
- **`window.__data.calendar`**: now lives in `blocked_dates` + `bakery_settings`. The capacity tally is derivable via `count(*) from orders where delivery_date = X`.

