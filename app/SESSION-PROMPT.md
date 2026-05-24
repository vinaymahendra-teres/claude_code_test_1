# Session prompt — paste at the start of the implementation session

> Copy everything between the `===` lines into the implementation session. Tuned for the current build state: 11 screens, ~6,000 JSX lines, standalone-HTML bundler, mid-iteration.

```
===

CONTEXT FOR THIS SESSION

You are continuing implementation of the Tiered Cake Company home-baker
app prototype (Hyderabad). Current state of `app/`:

- 11 screens under src/screens/ (Home, Orders, NewOrder, Customers,
  Kitchen, Production, Recipes, Inventory, Accounting, Marketing, Reports)
- 6 JSON sample-data files under data/
- src/{data,icons,ui,main,modes,timers}.jsx — shared scaffolding
- build_standalone.py bundles everything into tieredcake-standalone.html
  (runs from file://, no HTTP server needed)
- Phone-first design at 390×844 with warm-cream / caramel palette
- Original brief: HANDOFF-README.md and DESIGN-CHAT.md

WHAT'S NEW SINCE THE LAST SESSION

A sibling folder ../brainstorming/ now contains a complete
production-grade Google Sheets stack for the same business:

- 5 Sheets-based module files (CRM, Finance, Operations, Marketing, Dashboard)
- 9 Google Apps Scripts implementing the business logic
- 5 per-module strategy docs + 1 master design spec
- decision_log.md and operating_envelope.md with full rationale

The translation layer between the two is `app/BRIDGE.md` — a field-level
mapping table from every app/data/*.json to the corresponding cottage-stack
tab, plus a list of fields the app is missing that the stack expects, and
a list of business-logic scripts the app could mirror in UI.

YOUR JOB

Continue building the app as planned in HANDOFF-README.md + DESIGN-CHAT.md.
DO NOT pause to bulk-rewrite data schemas to match brainstorming/. The
prototype works; converging shapes wholesale will break screens.

DO use BRIDGE.md as your reference whenever you are about to:

- Add a new field to any data/*.json
- Add a new form input on any screen
- Name a new variable or component
- Add a new business rule (e.g., capacity checks, reorder alerts,
  reconciliation displays)

When you hit those moments, use the field names and enums from BRIDGE.md /
brainstorming/. This way every additive change converges quietly toward
the canonical schema without disrupting what already works.

TWO HARD GUARDRAILS

1. Stay a standalone HTML prototype. No runtime dependency on Google
   Sheets. The brainstorming/ stack is reference material — not a backend.
   The whole point of build_standalone.py is offline-runnable from file://.

2. ../brainstorming/ wins for business semantics. If the app's current
   data shape disagrees with brainstorming/ on a business concept (UPI
   reconciliation, DPDP consent gate, FSSAI compliance, capacity slots,
   PAR alerts, festival pre-blocking), the brainstorming side is correct.
   App-only fields (avatarTone, instagram, theme strings) are fine to keep.

BRAND AND CITY (settled 2026-05-24)

Brand is "Tiered Cake Company". City is "Hyderabad" only. Propagated
everywhere — app source, brainstorming/ prose, Apps Script constants,
and the regenerated TieredCakeCompany_*.xlsx workbooks. The workdir
folder is still named AMomentWithACake/ because it's a filesystem
path, not a brand. Vendor names that name other cities (e.g., a
Bangalore supplier) stay — they describe real suppliers.

SCREEN-LEVEL NOTES (consult BRIDGE.md for full field-level mapping)

- Home.jsx — closest analog is brainstorming/dashboard_strategy.md and
  morning_digest.gs. If you add KPI cards, consider what those scripts
  surface (orders this week, deposits outstanding, UPI unmatched count,
  PAR breaches, urgent compliance).

- Orders.jsx + NewOrder.jsx — CRM Orders tab. Two fields stack adds that
  the app currently lacks: UPI reference (UTR) and Payer VPA. When next
  iterating the order-entry flow, add UTR as an optional text field after
  payment is logged. Cold-chain notes is a third Mar–Sep critical field.

- Customers.jsx — CRM Customers tab. The big stack add is Marketing
  consent (Y/N, defaults N) + Consent date. This is DPDP Act 2023
  compliance, not optional polish. When iterating, add a consent toggle.

- Inventory.jsx — Operations Ingredients tab. Stack has reorderQty +
  days-cover fields and a derived "reorder due" flag; par_breach_alerter.gs
  shows what the "draft PO" action looks like.

- Recipes.jsx — Operations Recipes tab. STRUCTURAL MISMATCH: app uses
  nested ingredients[]; stack uses flat BOM rows. Both are valid; keep
  the app's nested shape for UI. A flatten/unflatten converter handles
  sync if it's ever needed.

- Accounting.jsx — Finance Money In + Money Out + P&L (monthly) tabs.
  The biggest missing capability the stack provides is UPI Reconciliation
  (two-way exception report: paid-but-no-inflow / inflow-with-no-order).
  If you add a "reconciliation" tab or alert, model it on upi_reconciler.gs.

- Marketing.jsx — Marketing module. App's "campaigns" abstraction has no
  direct stack equivalent; stack has Content Calendar (planned posts) +
  Hashtag Library + Reviews Tracker. Either keep the campaigns concept and
  surface it as a candidate "Phase 1f" addition to the stack, or expand
  to multiple posts during sync.

- Kitchen.jsx + Production.jsx — Operations Bake Plan tab.
  bake_plan_generator.gs is the canonical logic: read next-7-day orders,
  join recipes, surface as the day's bake plan. Mirror this client-side.

- Reports.jsx — closest analog is Finance P&L (monthly) + Cash Runway.
  If you add a runway forecast, use the BELOW BUFFER (<₹10K) / Tight
  (<₹25K) / OK thresholds from the stack's Cash Runway tab.

ITEMS TO FLAG BACK TO USER

If any of these come up during your work, stop and ask — don't decide:

- Adding a "Loans" concept (financing.json had it; was removed in favour
  of proper financial reports — only re-introduce on explicit ask)
- Adding a "Campaigns" abstraction (marketing.json has it; stack does not)
- Removing any app-only field that has design value but no stack equivalent
- Anything that would couple the app to live Google Sheets data at runtime

READ ORDER

1. HANDOFF-README.md (the design-tool brief; what the user actually wants)
2. DESIGN-CHAT.md (where the user landed after iterating)
3. BRIDGE.md (this session's contract for stack-alignment when adding
   fields/rules)
4. ../brainstorming/specs/2026-05-24-cottage-stack-design.md (only if you
   need to understand the broader business logic — otherwise skip and
   consult per-module strategy docs as referenced from BRIDGE.md)

Then continue with whatever was on your list before this prompt landed.

===
```

---

## How to use this file

- Open the implementation session. First message: paste the block above.
- The receiving session reads HANDOFF-README → DESIGN-CHAT → BRIDGE → continues build.
- Stays in app/ scope. Treats brainstorming/ as reference material, not a backend.

## When to update this file

- After any significant change to the field mapping (BRIDGE.md drift).
- After the brand/city question is resolved (delete Guardrail 1).
- After a new screen lands (add a screen-level note).
- After the stack adds a new module that wasn't here before.
