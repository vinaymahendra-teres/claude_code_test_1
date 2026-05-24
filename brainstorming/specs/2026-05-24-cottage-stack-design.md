# Tiered Cake Company — Unified Cottage-Industry Stack (Design Spec)

> _Spec date: 2026-05-24_
> _Owners: Swetha (S) · Shreya (Sh)_
> _Location: Hyderabad_
> _Status: **All phases built (this session).** CRM Phase 0 · Finance 1a–1e · Operations Phase 2 · Marketing Phase 3 · Dashboard Phase 4. 5 module files, 9 Apps Scripts, ₹0/month opex._

---

## 1. Summary

A single integrated operating system for a two-person home bakery, covering CRM, Sales, Marketing, Operations, Accounting, and Financing — built entirely on Google Sheets with light Apps Script glue and a small set of free external tools where Sheets is the wrong shape (post scheduling, design, payment collection, customer chat).

The architecture mimics a "stripped-down Zoho One": five focused module files in one Drive folder, connected by IMPORTRANGE and Apps Script, with a read-only Dashboard sheet as the home screen and morning email digest. Tooling opex: **₹0/month**.

CRM + Sales is already built ([crm_strategy.md](../crm_strategy.md), [crm_sheets/](../crm_sheets/)). This spec defines the surrounding four modules + Dashboard, and how they wire together.

---

## 2. Binding constraints

| Constraint | Source | Implication |
|---|---|---|
| Google Sheets only | Founder decision (2026-05-24) | No servers, no SaaS subscriptions, no custom apps. External tools allowed only where free and necessary. |
| ₹0/month tooling opex | "Self-sufficient cottage industry" | All free tiers; pay only for one-off services (GST CA filing when triggered). |
| Two operators (Sh, S) | Project context | Per-module ownership; concurrency by social contract, not tech. |
| Indian cottage operations | Geography + scale | UPI-first payments (personal VPA, no MDR); FSSAI compliance; Hindu/Muslim/Christian festival cash cycles; WhatsApp as primary customer channel. |
| Hyderabad climate | Geography | Cold-chain mandatory Mar–Sep; monsoon delivery buffers Jun–Sep. |
| Sheets is the destination | Founder decision (2026-05-24) | No "migrate to Odoo" exit plan. Scale challenges solved within Sheets (yearly archives, narrow IMPORTRANGE queries, file splits). |

---

## 3. Architecture overview

```
📁 Google Drive — "Tiered Cake Company — Workspace"
   │
   ├── 00_Dashboard.xlsx       ← home screen (read-only, IMPORTRANGE aggregator)
   ├── 01_CRM_Sales.xlsx       ← already built
   ├── 02_Operations.xlsx      ← production + procurement
   ├── 03_Finance.xlsx         ← UPI-first books + compliance
   └── 04_Marketing.xlsx       ← content + assets + performance
```

Each module is a focused Sheets file. Cross-module reads use IMPORTRANGE. Cross-module writes (rare) use Apps Script with the Drive API.

Every module file has `← Dashboard` hyperlinked at cell A1 of its first tab. The Dashboard has `Open <module> →` hyperlinks per panel. The Dashboard is the only URL anyone bookmarks.

---

## 4. Module specifications

### 4.1 `01_CRM_Sales.xlsx` (already built)

| Tab | Purpose |
|---|---|
| Inquiries | Raw inbox; one row per inbound order inquiry |
| Customers | Master record; one row per person |
| Orders | One row per order; includes `UPI reference (UTR)` and `Payer VPA` columns for reconciliation |
| Occasions | Normalised recurring-date table |
| Capacity Calendar | 60-day forward window; auto-rolled from Orders |
| Occasions Calendar | Derived 30-day outreach view (consent-filtered) |

**Schema additions for this spec:** `Orders` adds two columns:
- `UPI reference (UTR)` — the 12-digit Unique Transaction Reference from the customer's GPay/PhonePe confirmation (the join key for Finance reconciliation)
- `Payer VPA` — fallback identifier (e.g., `customer@oksbi`) when UTR isn't shared

**Owner:** Sh writes (Inquiries / Customers / Occasions); S writes (Orders, Capacity Calendar).
**Source-of-truth for:** leads, customers, orders, capacity bookings, revenue events.

### 4.2 `02_Operations.xlsx`

Production half + procurement half in one file (joined by ingredient consumption + PO loop).

| Tab | Purpose |
|---|---|
| Recipes | BOM per product: ingredient list with quantity-per-unit-output and cost-per-unit |
| Ingredients | Current stock, PAR levels, reorder-trigger formula |
| Bake Plan | Auto-generated daily production schedule for next 7 days (derived from Orders + Recipes) |
| Equipment Maintenance | Service log per piece; reminders for next service |
| Vendors | Supplier directory: contact, lead time, MOQ, **preferred payment mode**, **VPA / account** |
| Purchase Orders | POs raised, expected, received; linked to Vendors and Ingredients |

**Owner:** S writes; Sh reads.
**Source-of-truth for:** recipe COGS per product, ingredient inventory levels, vendor relationships, daily bake plan.

### 4.3 `03_Finance.xlsx`

UPI-first books. Built around the reality that most cottage bakers use *personal* UPI VPAs (no merchant fees, no auto-feed, all manual reconciliation).

| Tab | Purpose |
|---|---|
| Money In | Every credit (UPI / cash / bank); columns include `UTR`, `Payer VPA`, `Date`, `Amount`, `Channel`, `Matched Order ID` |
| Money Out | Every debit (ingredient UPI, capex, utilities, founder draws); columns include `UTR`, `Vendor`, `PO ID` |
| UPI Reconciliation | Two-way exception report: Orders without matched UTR; UPI inflows without matched order |
| Bank vs UPI Float | Three balances tracked separately: bank account, primary UPI app float, cash drawer |
| P&L (monthly) | Derived: Money In − Money Out by category; calendar month rollup |
| Capex Register | Assets purchased, depreciation schedule (cottage industry uses simple straight-line over useful life) |
| Vendor Ledger | Payables / aged outstanding; derived from POs and Money Out |
| Cash Runway | Rolling 6-month forecast: starting cash + projected inflows − projected outflows |
| Founder Draws | Distributions taken by S and Sh; running totals |
| Compliance | FSSAI licence number + expiry, trade licence, GST status, professional tax — with renewal reminders |

**Owner:** Shared; both review Mon morning.
**Source-of-truth for:** cash position (bank + UPI + cash), monthly profitability, runway, compliance dates.

### 4.4 `04_Marketing.xlsx`

| Tab | Purpose |
|---|---|
| Content Calendar | Planned posts: date, channel, status (Draft / Scheduled / Posted), caption, asset link, MBS-scheduled-URL |
| Asset Library | Photo/video links (Drive folder URLs), tagged by product / occasion / season |
| Performance | Weekly manual roll-up of reach / likes / saves / DMs per post (Insta + WhatsApp story views) |
| Hashtag Library | Tag sets by post type (kid birthday cake / corporate / festival / behind-the-scenes) |
| Reviews Tracker | Google reviews received (count + 5-star ratio, manually logged on receipt) |

**Owner:** Sh writes.
**Source-of-truth for:** content plan, post performance baseline, brand asset inventory, review trajectory.

### 4.5 `00_Dashboard.xlsx` — the home screen

Read-only. Built from IMPORTRANGE pulls. Six panels:

1. **This week** — orders due, deposits outstanding, capacity used, posts scheduled
2. **Cash position** — bank balance · UPI float · cash drawer · **UPI unmatched** (orders marked paid but no UTR — the leak)
3. **Top customers** — by LTV, recency, referrals
4. **Production load** — next 14 days (cake / cupcake / bomboloni slot occupancy)
5. **Marketing health** — posts this week, top-performer, new reviews count
6. **Action queue** — chase deposits · send feedback requests · reorder ingredients · schedule posts · compliance dates approaching

Each panel ends with `=HYPERLINK("<tab URL>", "Open <module> →")`.

A seventh panel surfaces **festival cash cycle** — the next Indian festival 30 days out, with projected revenue spike and 2–3 week ingredient cash outflow trigger.

**Owner:** nobody writes; both read every morning. The `morning_digest.gs` script emails an equivalent snapshot at 7am IST so a phone glance substitutes for opening the file.

---

## 5. Connectivity

### 5.1 Data flow (one-way reads)

```
CRM_Sales ──► Operations  (Orders.delivery_date + Product → Bake Plan; Recipes → ingredient consumption forecast)
          ──► Finance     (Orders.UTR → reconciliation; Orders.final_price → Money In expected)
          ──► Dashboard

Operations ──► Finance    (POs → Vendor Ledger payables; ingredient consumption → COGS)
           ──► Dashboard

Finance ────► Dashboard

Marketing ──► Dashboard
```

Downstream files never push back upstream. CRM is the customer/order source-of-truth; Operations is the production source-of-truth; Finance is the cash source-of-truth; Marketing is the content source-of-truth.

### 5.2 IMPORTRANGE practicalities

- One-time "Allow access" handshake per file pair (first reference).
- Refresh lag 1–5 min. Fine for daily-cadence ops; not real-time.
- IMPORTRANGE returns values, not formulas — Dashboard recomputes any derived columns on its side.
- Pull narrow QUERY-style ranges, not whole sheets (keeps the per-file cell budget healthy).

### 5.3 Apps Script jobs

| Script | Module | Trigger | Purpose | Status |
|---|---|---|---|---|
| `form_handler.gs` | CRM | Form submit | Stamps inquiry IDs, sets defaults | ✓ built |
| `capacity_helpers.gs` | CRM | onEdit | Capacity guardrail on new orders | ✓ built |
| `birthday_reminder.gs` | CRM | Mon 09:00 IST | Weekly occasions digest | ✓ built |
| `feedback_request.gs` | CRM | Daily 10:00 IST | T+2 Google review request queue | ✓ built |
| `festival_pre_block.gs` | CRM | Mon weekly | 21 days before Diwali / Eid / Christmas / Ganesh Chaturthi / Bathukamma → auto-block Capacity Calendar | new |
| `upi_reconciler.gs` | Finance | Daily 09:00 IST | Matches Orders.UTR ↔ Money In.UTR; flags both-side gaps; emails Sh | new |
| `compliance_reminder.gs` | Finance | Mon weekly | FSSAI / trade licence / GST — warns at 90 / 60 / 30 / 7 days from expiry | new |
| `bake_plan_generator.gs` | Operations | Nightly 23:00 IST | Reads next-7-day Orders, expands via Recipes BOM, writes daily Bake Plan tab | new |
| `par_breach_alerter.gs` | Operations | Daily 09:00 IST | Ingredients < PAR → drafts PO row, emails S | new |
| `morning_digest.gs` | Dashboard | Daily 07:00 IST | Bundles all six panels into one HTML email to both operators | new |

All scripts run on IST (`Asia/Kolkata`). All within Google's free Apps Script quota at cottage volumes.

### 5.4 External tools (the ~10% Sheets can't do)

| Function | Tool | Cost | Sheets touch-point |
|---|---|---|---|
| Post scheduling & publishing | Meta Business Suite | Free | `Marketing.Content Calendar.MBS_scheduled_URL` |
| Reviews collection | Google Business Profile | Free | `feedback_request.gs` uses the review URL |
| Customer chat | WhatsApp Business app | Free | Apps Script emits click-to-chat URLs |
| Payment collection | GPay / PhonePe personal VPA | Free (no MDR) | Static QR or dynamic UPI link in customer messages; UTR copied back into `Orders.UTR` manually |
| Design | Canva (free tier) | Free | URLs stored in `Marketing.Asset Library` |
| File storage | Google Drive | Bundled | Vendor invoice scans, photo / video assets |
| Email triggers | Gmail | Bundled | All Apps Script reminders |
| GST filing (when triggered) | CA or ClearTax | Service (₹500–2000/return) | Out of stack; manual handoff |

---

## 6. Phase plan

| Phase | Module | Sub-phases | Rationale |
|---|---|---|---|
| 0 ✓ | CRM_Sales | (already built across CRM scope) | Operational foundation |
| 1 ✓ | **Finance** | 1a Money In + UPI Reconciliation · 1b Compliance · 1c Money Out + Vendor Ledger · 1d P&L + Cash Runway · 1e Capex + Founder Draws | UPI reconciliation pain is daily; FSSAI compliance has hard dates; Operations COGS can be a manual estimate column until Phase 2 lands |
| 2 ✓ | **Operations** | 2a Recipes + Ingredients · 2b PAR breach alerter · 2c Vendors + POs · 2d Bake Plan generator · 2e Equipment Maintenance | Recipes/BOM unlocks real COGS → back-fills Finance estimates; bake plan generator returns daily time to S |
| 3 ✓ | **Marketing** | 3a Content Calendar + Asset Library · 3b Performance + Hashtag Library · 3c Reviews Tracker | Discipline upgrade; Sh already does this informally |
| 4 ✓ | **Dashboard** | 4a Panels 1–3 (this week, cash, customers) · 4b Panels 4–6 (production, marketing, action queue) · 4c morning_digest.gs · 4d Festival cash-cycle panel | Built last — aggregator can't aggregate what doesn't exist yet |

Each sub-phase is sized to one focused build session. The `02_Orders` schema addition (UPI reference + Payer VPA) ships as a CRM tweak before Phase 1 begins.

---

## 7. Ownership matrix

| Module | Daily writer | Reader | Weekly review |
|---|---|---|---|
| CRM | Sh | S | Sh sweeps Inquiries Sun evening |
| Operations | S | Sh | S reviews PAR breaches Mon morning |
| Finance | shared | both | both, Mon morning over chai |
| Marketing | Sh | S | Sh plans week Sat afternoon |
| Dashboard | nobody | both | morning glance via `morning_digest.gs` email |

The owner is the *writer*; the backup is the *reader*. If the backup needs to write, they leave a cell-comment first. Concurrent edits without coordination are the single most common failure mode for 2-person Sheets CRMs.

---

## 8. Cost

**Tooling opex: ₹0/month.** Everything within:
- Google Workspace free tier (Sheets, Apps Script, Gmail, Drive at 15GB)
- Meta Business Suite (free)
- Google Business Profile (free)
- WhatsApp Business app (free)
- GPay / PhonePe personal VPA (free — no MDR on personal accounts)
- Canva free tier

**External service costs (on demand):**
- CA for GST filing when triggered (~₹500–2000/return)

That's the entire bill. The "stripped Zoho One" experience without the ~₹3000/month Zoho One subscription.

---

## 9. Explicitly NOT building

- Real-time customer order tracking (WhatsApp status updates suffice)
- Customer self-service portal (WhatsApp is the channel)
- Multi-language UI (S and Sh work in English; vernacular only inside customer messages)
- Inventory FIFO/FEFO lot-tracking (cottage volumes don't justify)
- Multi-currency (₹ only)
- Payroll (no employees in current plan)
- Anything needing a server (Sheets-only commitment)
- Recipe library exposed to customers
- Automated WhatsApp send (click-to-chat URLs only)
- Native UPI auto-reconciliation (no feed for personal VPAs; manual UTR entry is the trade-off for ₹0 MDR)

---

## 10. Scale within Sheets

Sheets is the destination, not a stepping stone. The 10M-cell cap per file is real but distant — cottage volumes reach it via Orders + Operations consumption logs in roughly 4–7 years at sustained growth. Native-Sheets answers when pressure appears:

| Pressure | Sheets-native answer |
|---|---|
| Orders > 5000 rows in one file | Year-end archive: `01_CRM_Sales_2026.xlsx` becomes read-only, new year creates a new file; Dashboard UNIONs IMPORTRANGEs across years |
| Operations consumption log heavy | Same yearly-archive pattern |
| File > 50 MB or slow loads | Audit IMPORTRANGEs — switch from whole-sheet pulls to narrow QUERY ranges |
| Operator wants offline access | Sheets offline mode (caches locally, syncs when online) |
| Need to broaden permissions (e.g., let an accountant in) | Per-file sharing — Finance can go view-only to a third party without exposing CRM |
| Festival peak rush | Sheets handles 100+ concurrent edits comfortably at cottage volumes |

If a "Sheets can't scale to this" claim ever surfaces, treat it as a signal that the *workflow* needs rethinking, not the *tool*. Almost every cottage-scale bottleneck is a process problem in disguise.

---

## 11. Doc alignment to be done alongside this spec

The following existing artefacts were written with an implicit "Month 0–6, then migrate to Odoo" framing. Update to match this spec's Sheets-as-destination commitment:

| File | Section | Change |
|---|---|---|
| `crm_strategy.md` | §1 (Why Sheets only) | Reframe "Re-evaluate trigger" without an "and migrate to Odoo" implication |
| `crm_strategy.md` | §11 (Migration trigger to Odoo) | Replace with "Scale within Sheets" patterns from §10 above |
| `decision_log.md` | 2026-05-24 CRM entries | Strip "(Month 0–6)" qualifier; remove "Revisit at Month 6" language |
| `operating_envelope.md` | Stream 7 status block | Strip "Google Sheets only for Month 0–6"; remove "Migration trigger to Odoo defined" |

(`crm_sheets/README.md` doesn't need editing — its phases are operational rollout phases, not platform-migration phases.)

These alignment edits happen as part of executing this spec, not as a separate task.

---

## 12. Open dependencies on other Streams

| From Stream | What it sharpens in this stack |
|---|---|
| 1 — Workflow / Tooling | `Capacity Calendar` slot totals; `Equipment Maintenance` baseline; oven capacity → bake plan granularity |
| 2 — Budgeting / Entity / GST | `Finance.Compliance` GST status; `Finance.Capex Register` depreciation policy; entity form drives Founder Draws structure |
| 3 — Vendor & Inventory | `Operations.Vendors` initial seed; PAR-level discipline |
| 4 — Pricing | `Orders.Quoted (₹)` and `Orders.Final (₹)` deltas become meaningful; deposit % automation |
| 5 — Marketing | `Marketing.Content Calendar` cadence target; brand voice constraints |
| 6 — Order intake & Delivery | `Orders.Delivery mode` enum set; deposit-trigger rule (UPI link auto-sent on Quoted → Confirmed); cold-chain SOP |

The stack absorbs these as they land. None block starting Phase 1.

---

## 13. Next step

Implementation plan via `superpowers:writing-plans`. Phase 1 (Finance — Money In + UPI Reconciliation) is the first concrete build target. CRM schema addition (UPI reference + Payer VPA on Orders) happens in the same plan as a one-line tweak.
